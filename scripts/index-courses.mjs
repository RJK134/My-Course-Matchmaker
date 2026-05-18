#!/usr/bin/env node
// scripts/index-courses.mjs
//
// Builds the Meilisearch courses index from:
//   1. the canonical Postgres courses table (the curated 125 — verified)
//   2. api/data/lake-courses.json (the workhorse datalake — provisional)
//
// Joins each row to career-pathways.json for roi/salary signals, computes a
// per-document affordability number (fees + 9 months × default COL), and
// pushes everything to Meilisearch under `courses` with the right
// filterable/sortable/searchable attribute config.

import 'dotenv/config';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { MeiliSearch } from 'meilisearch';
import { mapSubjectToDomain } from './lib/subject-taxonomy.mjs';
import { resolveInstitution } from './lib/institution-resolver.mjs';
import { lookupUkUniversity } from './lib/uk-universities.mjs';
import { enrichFees } from './lib/fee-heuristics.mjs';
import { createHash } from 'node:crypto';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const LAKE_COURSES_PATH = join(REPO_ROOT, 'api', 'data', 'lake-courses.json');
const CAREER_PATHWAYS_PATH = join(REPO_ROOT, 'api', 'data', 'career-pathways.json');
const GLOBAL_COL_PATH = join(REPO_ROOT, 'frontend', 'src', 'data', 'costOfLiving.global.json');

const MEILI_HOST = process.env.MEILI_HOST || 'http://localhost:7700';
const MEILI_KEY = process.env.MEILI_KEY || 'mcm-dev-master-key-change-me';
const INDEX_NAME = 'courses';

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5434', 10),
  database: process.env.DB_NAME || 'coursematchmaker',
  user: process.env.DB_USER || 'mcm',
  password: process.env.DB_PASSWORD || 'changeme',
};

const DEFAULT_MONTHLY_COL_GBP = 1100; // fallback when no city COL match

// Build city → GBP monthly COL lookup from the global JSON + curated DB rows
// (the DB rows already happen to be GBP).
function buildColIndex(globalRows, curatedRows) {
  const map = new Map();
  for (const c of globalRows) {
    const monthly =
      (c.gbpRent ?? 0) +
      (c.gbpFood ?? 0) +
      (c.gbpTransport ?? 0) +
      (c.gbpUtils ?? 0) +
      (c.gbpMisc ?? 0);
    if (monthly > 0) map.set(c.city.toLowerCase(), { monthly, source: 'global' });
  }
  for (const c of curatedRows) {
    if (!map.has(c.city.toLowerCase())) {
      const monthly =
        Number(c.rent || 0) +
        Number(c.food || 0) +
        Number(c.transport || 0) +
        Number(c.utilities || 0) +
        Number(c.misc || 0);
      if (monthly > 0) map.set(c.city.toLowerCase(), { monthly, source: 'curated-db' });
    }
  }
  return map;
}

function lookupMonthlyCol(colIndex, city) {
  if (!city) return null;
  return colIndex.get(String(city).toLowerCase()) || null;
}

// Lake↔curated dedup. Fingerprint = sha256(provider_norm + subject_norm + level).
function fingerprintFor(provider, subject, level) {
  const norm = (s) =>
    String(s || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  return createHash('sha256')
    .update(`${norm(provider)}|${norm(subject)}|${norm(level)}`)
    .digest('hex')
    .slice(0, 16);
}

const SOURCE_PROVENANCE = {
  ucas: 'ucas',
  cug: 'cug',
  whatuni: 'whatuni',
  ofqual: 'ofqual',
  'workhorse-datalake': 'lake',
};

function normaliseSubject(s) {
  return String(s ?? '').trim().toLowerCase();
}

function buildPathwayIndex(rows) {
  const bySubject = new Map();
  for (const r of rows) {
    const key = normaliseSubject(r.subjectArea);
    if (!key) continue;
    if (!bySubject.has(key)) bySubject.set(key, []);
    bySubject.get(key).push(r);
  }
  return bySubject;
}

function topPathwayFor(subject, pathwayIndex) {
  if (!subject) return null;
  const key = normaliseSubject(subject);
  const direct = pathwayIndex.get(key);
  if (direct && direct.length) return pickTopPathway(direct);
  // Tolerate close matches via inclusion.
  for (const [k, list] of pathwayIndex.entries()) {
    if (k.includes(key) || key.includes(k)) return pickTopPathway(list);
  }
  return null;
}

function pickTopPathway(list) {
  return [...list].sort((a, b) => (b.medianSalaryGbp || 0) - (a.medianSalaryGbp || 0))[0];
}

function avgSalaryFor(subject, pathwayIndex) {
  if (!subject) return null;
  const key = normaliseSubject(subject);
  const list = pathwayIndex.get(key);
  if (!list || !list.length) return null;
  const salaries = list.map((r) => r.medianSalaryGbp).filter((n) => Number.isFinite(n));
  if (!salaries.length) return null;
  return Math.round(salaries.reduce((s, n) => s + n, 0) / salaries.length);
}

function durationYears(row) {
  if (row.duration && /year/i.test(row.duration)) {
    const m = row.duration.match(/(\d+(?:\.\d+)?)\s*year/i);
    if (m) return Number(m[1]);
  }
  if (row.duration_months) return Number(row.duration_months) / 12;
  if (row.level === 'postgraduate') return 1;
  if (row.is_free || row.free) return 0.5;
  return 3;
}

function affordabilityForFilter(row, monthlyCol) {
  // Use fee_home where present, else fee_intl, else 0.
  const fee =
    [row.fee_home, row.fee_intl, row.feesUkGbp, row.feesIntlGbp]
      .map((v) => (v == null ? null : Number(v)))
      .find((n) => Number.isFinite(n)) ?? 0;
  const monthly = monthlyCol ?? DEFAULT_MONTHLY_COL_GBP;
  return Math.round(fee + monthly * 9);
}

function roiFor(row, pathwayIndex, monthlyCol) {
  const pathway = topPathwayFor(row.subject_area || row.subjectArea || row.domain, pathwayIndex);
  if (!pathway) return null;
  const salary5 =
    pathway.salary5yrGbp ?? (pathway.medianSalaryGbp ? pathway.medianSalaryGbp * 5 : null);
  if (!Number.isFinite(salary5)) return null;
  const years = durationYears(row);
  const total = affordabilityForFilter(row, monthlyCol) * years;
  return Math.round(salary5 - total);
}

function normaliseCuratedRow(row, pathwayIndex, colIndex) {
  // From Postgres `courses` table.
  const subject = (row.subjects && row.subjects[0]) || row.domain;
  const topPathway = topPathwayFor(subject || row.domain, pathwayIndex);
  const col = lookupMonthlyCol(colIndex, row.city);
  return {
    id: `curated-${row.id}`,
    canonical_id: row.id,
    title: row.title,
    provider: row.institution_key,
    country: row.country,
    city: row.city,
    city_monthly_col_gbp: col?.monthly ?? null,
    col_source: col?.source ?? null,
    level: row.level,
    domain: row.domain,
    subject_area: subject || row.domain,
    qualification: row.level,
    duration: row.duration,
    mode: Array.isArray(row.mode) ? row.mode : [],
    subjects: Array.isArray(row.subjects) ? row.subjects : [],
    fee_home: row.fee_home == null ? null : Number(row.fee_home),
    fee_intl: row.fee_intl == null ? null : Number(row.fee_intl),
    fee_scotland: row.fee_scotland == null ? null : Number(row.fee_scotland),
    fees_for_filter: affordabilityForFilter(row, col?.monthly),
    fees_source: 'curated',
    ranking_band: row.ranking || 999,
    is_free: !!row.is_free,
    is_online: !!row.is_online,
    employability: row.employability ?? null,
    career_paths: Array.isArray(row.career_paths) ? row.career_paths : [],
    skills_overlap: topPathway?.skillsOverlap || null,
    avg_salary_subject_gbp: avgSalaryFor(subject || row.domain, pathwayIndex),
    top_career_title: topPathway?.careerTitle ?? null,
    top_career_salary_gbp: topPathway?.medianSalaryGbp ?? null,
    roi_score: roiFor(row, pathwayIndex, col?.monthly) ?? 0,
    source: 'curated',
    provenance: 'curated',
    url: null,
    last_seen_at: row.updated_at || row.created_at || null,
  };
}

function normaliseLakeRow(row, pathwayIndex, colIndex) {
  const subject = row.subjectArea || null;
  const topPathway = topPathwayFor(subject, pathwayIndex);
  const provenance = SOURCE_PROVENANCE[row.source] || row.source || 'lake';
  const inst = resolveInstitution(row.provider);
  // If the curated catalogue didn't match, fall back to the UK universities
  // dictionary so common lake providers (Bangor, Aston, Sheffield Hallam, …)
  // still get a city/country instead of just "UK".
  const ukFallback = inst ? null : lookupUkUniversity(row.provider);
  const mappedDomain = mapSubjectToDomain(subject);

  // Heuristic fee backfill so we stop showing the default £1,100 COL only.
  const enriched = enrichFees(row, mappedDomain);
  const isFreeRow = enriched.feesUkGbp === 0 && enriched.feesIntlGbp === 0;

  const city = inst?.city || ukFallback?.city || row.locationCity || null;
  const col = lookupMonthlyCol(colIndex, city);

  return {
    id: `lake-${row.id}`,
    canonical_id: null,
    title: row.title,
    provider: row.provider,
    // Use institution lookup, then UK fallback, then honest UK default.
    country: inst?.country || ukFallback?.country || 'UK',
    city,
    city_monthly_col_gbp: col?.monthly ?? null,
    col_source: col?.source ?? null,
    institution_key: inst?.key || null,
    institution_full_name: inst?.full || null,
    institution_match: inst?._matchType || (ukFallback ? 'uk-dict' : 'unmatched'),
    institution_match_score: inst?._matchScore ?? 0,
    institution_lat: inst?.lat ?? null,
    institution_lng: inst?.lng ?? null,
    level: 'undergraduate', // best guess for unverified UCAS/CUG rows
    domain: mappedDomain,
    subject_area: subject,
    qualification: row.qualification || null,
    duration: null,
    mode: [],
    subjects: subject ? [subject] : [],
    fee_home: enriched.feesUkGbp == null ? null : Number(enriched.feesUkGbp),
    fee_intl: enriched.feesIntlGbp == null ? null : Number(enriched.feesIntlGbp),
    fee_scotland: null,
    fees_for_filter: affordabilityForFilter(
      { fee_home: enriched.feesUkGbp, fee_intl: enriched.feesIntlGbp },
      col?.monthly,
    ),
    fees_source: enriched.feeSource,
    ranking_band: 999,
    is_free: isFreeRow,
    is_online: false,
    employability: null,
    career_paths: topPathway ? [topPathway.careerTitle] : [],
    skills_overlap: topPathway?.skillsOverlap || null,
    avg_salary_subject_gbp: avgSalaryFor(subject, pathwayIndex),
    top_career_title: topPathway?.careerTitle ?? null,
    top_career_salary_gbp: topPathway?.medianSalaryGbp ?? null,
    roi_score:
      roiFor(
        {
          subject_area: subject,
          fee_home: enriched.feesUkGbp,
          fee_intl: enriched.feesIntlGbp,
          level: 'undergraduate',
        },
        pathwayIndex,
        col?.monthly,
      ) ?? 0,
    source: row.source,
    provenance,
    url: row.url,
    last_seen_at: row.lastSeenAt,
  };
}

async function main() {
  console.log('[index] connecting to Postgres', `${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`);
  const pool = new pg.Pool(DB_CONFIG);

  console.log('[index] reading career pathways');
  const pathwayRows = existsSync(CAREER_PATHWAYS_PATH)
    ? JSON.parse(readFileSync(CAREER_PATHWAYS_PATH, 'utf8'))
    : [];
  const pathwayIndex = buildPathwayIndex(pathwayRows);
  console.log(`[index] career pathways indexed: ${pathwayRows.length} rows across ${pathwayIndex.size} subjects`);

  console.log('[index] reading curated courses from Postgres');
  const { rows: curatedRows } = await pool.query('SELECT * FROM courses ORDER BY id');
  const { rows: curatedColRows } = await pool.query('SELECT * FROM cost_of_living');
  console.log(`[index] curated rows: ${curatedRows.length}, curated COL rows: ${curatedColRows.length}`);
  await pool.end();

  console.log('[index] reading lake courses from', LAKE_COURSES_PATH);
  const lakeRows = existsSync(LAKE_COURSES_PATH)
    ? JSON.parse(readFileSync(LAKE_COURSES_PATH, 'utf8'))
    : [];
  console.log(`[index] lake rows: ${lakeRows.length}`);

  console.log('[index] reading global COL from', GLOBAL_COL_PATH);
  const globalColRows = existsSync(GLOBAL_COL_PATH)
    ? JSON.parse(readFileSync(GLOBAL_COL_PATH, 'utf8'))
    : [];
  console.log(`[index] global COL rows: ${globalColRows.length}`);

  const colIndex = buildColIndex(globalColRows, curatedColRows);
  console.log(`[index] COL index built: ${colIndex.size} cities`);

  // Curated rows go in first and seed the dedup map; lake rows whose
  // (provider × subject × level) fingerprint collides with a curated row
  // get dropped (curated is always better data).
  const curatedDocs = curatedRows.map((r) => normaliseCuratedRow(r, pathwayIndex, colIndex));
  const curatedFingerprints = new Set(
    curatedDocs.map((d) => fingerprintFor(d.provider, d.subject_area, d.level)),
  );

  let droppedDupes = 0;
  const lakeDocs = [];
  for (const r of lakeRows) {
    const fp = fingerprintFor(r.provider, r.subjectArea, 'undergraduate');
    if (curatedFingerprints.has(fp)) {
      droppedDupes += 1;
      continue;
    }
    lakeDocs.push(normaliseLakeRow(r, pathwayIndex, colIndex));
  }
  if (droppedDupes > 0) console.log(`[index] dedup: dropped ${droppedDupes} lake rows that matched a curated course`);

  const docs = [...curatedDocs, ...lakeDocs];
  console.log(`[index] total docs to index: ${docs.length}`);
  const heuristic = lakeDocs.filter((d) => d.fees_source?.startsWith('heuristic')).length;
  console.log(`[index] fees_source=heuristic: ${heuristic}; curated: ${curatedDocs.length}`);
  const withCity = docs.filter((d) => d.city_monthly_col_gbp != null).length;
  console.log(`[index] city COL matched: ${withCity}/${docs.length}`);

  const meili = new MeiliSearch({ host: MEILI_HOST, apiKey: MEILI_KEY });
  const index = meili.index(INDEX_NAME);

  console.log('[index] applying index settings');
  await index.updateSettings({
    searchableAttributes: [
      'title',
      'provider',
      'subject_area',
      'subjects',
      'top_career_title',
      'career_paths',
      'qualification',
      'city',
      'country',
    ],
    filterableAttributes: [
      'country',
      'level',
      'domain',
      'subject_area',
      'qualification',
      'provenance',
      'source',
      'is_free',
      'is_online',
      'fees_for_filter',
      'roi_score',
      'fee_home',
      'fee_intl',
      'avg_salary_subject_gbp',
      'institution_match',
      'fees_source',
      'col_source',
    ],
    sortableAttributes: [
      'fees_for_filter',
      'roi_score',
      'ranking_band',
      'avg_salary_subject_gbp',
      'top_career_salary_gbp',
    ],
    rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
  });

  console.log('[index] pushing documents');
  const task = await index.addDocuments(docs, { primaryKey: 'id' });
  console.log('[index] enqueued task', task.taskUid, '— waiting...');
  const completed = await meili.tasks.waitForTask(task.taskUid, { timeOutMs: 60_000 });
  console.log('[index] task status:', completed.status, 'docs:', completed.details);

  const stats = await index.getStats();
  console.log('[index] index now has', stats.numberOfDocuments, 'documents.');
}

main().catch((err) => {
  console.error('[index] FAILED', err);
  process.exit(1);
});
