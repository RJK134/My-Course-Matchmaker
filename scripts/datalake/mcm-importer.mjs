// scripts/datalake/mcm-importer.mjs
//
// Pure helpers for the Workhorse → MyCourseMatchmaker datalake sync.
// Lives in its own module so the test file (`node --test`) and the
// production script (`npm run sync-datalake`) both depend on the same
// validators.
//
// METADATA / PUBLIC-COURSE-METADATA ROWS ONLY. The `FORBIDDEN_COLUMNS`
// set mirrors the rule the Maieus consumer (`RJK134/Maieus2` PR #99)
// and the Shakespeare consumer (`RJK134/Shakespeare-is-Boring` PR #6)
// apply — any header carrying body / question / mark-scheme / answer /
// solution / personal-data columns rejects the whole batch.

export const FORBIDDEN_COLUMNS = new Set([
  'body',
  'questiontext',
  'question_text',
  'questionbody',
  'question_body',
  'markscheme',
  'mark_scheme',
  'markschemetext',
  'mark_scheme_text',
  'answer',
  'answertext',
  'answer_text',
  'solution',
  'solutiontext',
  'solution_text',
  // Lake rows about courses are public listings. No applicant PII here.
  'email',
  'phone',
  'applicant_name',
  'date_of_birth',
]);

export function detectForbiddenColumns(header) {
  return header
    .map((h) => String(h).trim().toLowerCase())
    .filter((h) => FORBIDDEN_COLUMNS.has(h));
}

// Minimal RFC-4180-ish CSV reader matching Python csv.DictWriter output.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
          continue;
        }
        inQuotes = false;
        continue;
      }
      cell += c;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      continue;
    }
    if (c === ',') {
      row.push(cell);
      cell = '';
      continue;
    }
    if (c === '\r') continue;
    if (c === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      continue;
    }
    cell += c;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export function rowsToObjects(rows) {
  if (rows.length === 0) return { header: [], objects: [] };
  const header = rows[0].map((h) => h.trim());
  const objects = rows
    .slice(1)
    .filter((r) => r.some((c) => c !== ''))
    .map((r) => {
      const o = {};
      for (let i = 0; i < header.length; i += 1) {
        o[header[i]] = r[i] ?? '';
      }
      return o;
    });
  return { header, objects };
}

function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function pick(obj, ...keys) {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && String(v).trim() !== '') return String(v).trim();
  }
  return undefined;
}

function safeNumber(value) {
  if (value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Validate one `courses.csv` row from the workhorse lake.
 * Required: title + url. Rows without both can't render and are dropped.
 * Forbidden columns reject loudly via the batch-level guard.
 */
export function validateCourseRow(obj) {
  for (const k of Object.keys(obj)) {
    if (FORBIDDEN_COLUMNS.has(k.trim().toLowerCase())) {
      return { ok: false, reason: `forbidden column: ${k}` };
    }
  }
  const title = pick(obj, 'title');
  const url = pick(obj, 'url');
  if (!title || !url) {
    return { ok: false, reason: 'missing title or url' };
  }
  if (!/^https?:\/\//i.test(url)) {
    return { ok: false, reason: 'url must start with http(s)' };
  }
  const ucasCode = pick(obj, 'ucas_code', 'ucasCode');
  const provider = pick(obj, 'provider', 'institution');
  const qualification = pick(obj, 'qualification', 'level');
  const subjectArea = pick(obj, 'subject_area', 'subjectArea');
  const locationCity = pick(obj, 'location_city', 'city', 'locationCity');
  const feesUk = safeNumber(pick(obj, 'fees_uk_gbp', 'feesUkGbp', 'fee_home'));
  const feesIntl = safeNumber(pick(obj, 'fees_intl_gbp', 'feesIntlGbp', 'fee_intl'));
  const source = pick(obj, 'source');
  const lastSeen = pick(obj, 'last_seen_at', 'lastSeenAt');
  return {
    ok: true,
    row: {
      id: slugify(`${provider ?? ''}-${title}-${ucasCode ?? ''}-${locationCity ?? ''}`),
      title,
      url,
      ucasCode: ucasCode ?? null,
      provider: provider ?? null,
      qualification: qualification ?? null,
      subjectArea: subjectArea ?? null,
      locationCity: locationCity ?? null,
      feesUkGbp: feesUk,
      feesIntlGbp: feesIntl,
      source: source ?? 'workhorse-datalake',
      lastSeenAt: lastSeen ?? null,
      provenance: 'workhorse-datalake',
    },
  };
}

/**
 * Validate one `coursepulse_insights.csv` row from the lake.
 * Required: insight_type + title. summary can be long markdown.
 */
export function validateCoursePulseRow(obj) {
  for (const k of Object.keys(obj)) {
    if (FORBIDDEN_COLUMNS.has(k.trim().toLowerCase())) {
      return { ok: false, reason: `forbidden column: ${k}` };
    }
  }
  const insightType = pick(obj, 'insight_type', 'insightType');
  const title = pick(obj, 'title');
  if (!insightType || !title) {
    return { ok: false, reason: 'missing insight_type or title' };
  }
  const subjectArea = pick(obj, 'subject_area', 'subjectArea');
  const summary = pick(obj, 'summary');
  const source = pick(obj, 'source');
  const region = pick(obj, 'region');
  const createdAt = pick(obj, 'created_at', 'createdAt');
  return {
    ok: true,
    row: {
      id: slugify(`${insightType}-${title}-${region ?? ''}-${createdAt ?? ''}`),
      insightType,
      subjectArea: subjectArea ?? null,
      title,
      summary: summary ?? null,
      source: source ?? 'workhorse-datalake',
      region: region ?? null,
      createdAt: createdAt ?? null,
      provenance: 'workhorse-datalake',
    },
  };
}

/**
 * Validate one `funding_opportunities.csv` row from the lake.
 * Required: title + funder + url.
 */
export function validateFundingRow(obj) {
  for (const k of Object.keys(obj)) {
    if (FORBIDDEN_COLUMNS.has(k.trim().toLowerCase())) {
      return { ok: false, reason: `forbidden column: ${k}` };
    }
  }
  const title = pick(obj, 'title');
  const funder = pick(obj, 'funder');
  const url = pick(obj, 'url');
  if (!title || !funder) return { ok: false, reason: 'missing title or funder' };
  if (url && !/^https?:\/\//i.test(url)) {
    return { ok: false, reason: 'url must start with http(s)' };
  }
  const programme = pick(obj, 'programme');
  const region = pick(obj, 'region');
  const country = pick(obj, 'country');
  const amountMin = safeNumber(pick(obj, 'amount_min', 'amountMin'));
  const amountMax = safeNumber(pick(obj, 'amount_max', 'amountMax'));
  const currency = pick(obj, 'currency');
  const deadline = pick(obj, 'deadline');
  const status = pick(obj, 'status');
  const category = pick(obj, 'category');
  const discoveredAt = pick(obj, 'discovered_at', 'discoveredAt');
  return {
    ok: true,
    row: {
      id: slugify(`${funder}-${title}-${region ?? ''}`),
      title,
      funder,
      programme: programme ?? null,
      region: region ?? null,
      country: country ?? null,
      amountMin,
      amountMax,
      currency: currency ?? null,
      deadline: deadline ?? null,
      status: status ?? null,
      url: url ?? null,
      category: category ?? null,
      discoveredAt: discoveredAt ?? null,
      provenance: 'workhorse-datalake',
    },
  };
}

/**
 * Validate one `exchange_rates.csv` row from the lake.
 * Required: base_currency + quote_currency + rate + rate_date.
 */
export function validateFxRow(obj) {
  for (const k of Object.keys(obj)) {
    if (FORBIDDEN_COLUMNS.has(k.trim().toLowerCase())) {
      return { ok: false, reason: `forbidden column: ${k}` };
    }
  }
  const base = pick(obj, 'base_currency', 'baseCurrency');
  const quote = pick(obj, 'quote_currency', 'quoteCurrency');
  const rate = safeNumber(pick(obj, 'rate'));
  const date = pick(obj, 'rate_date', 'rateDate');
  if (!base || !quote || rate == null || !date) {
    return { ok: false, reason: 'missing base/quote/rate/date' };
  }
  return {
    ok: true,
    row: {
      base,
      quote,
      rate,
      date,
      source: pick(obj, 'source') ?? 'workhorse-datalake',
      provenance: 'workhorse-datalake',
    },
  };
}

/**
 * Validate one `course_career_pathways.csv` row from the lake.
 * Required: subject_area + career_title. Both are useless individually
 * for rendering a "what this leads to" tile.
 */
export function validateCareerPathwayRow(obj) {
  for (const k of Object.keys(obj)) {
    if (FORBIDDEN_COLUMNS.has(k.trim().toLowerCase())) {
      return { ok: false, reason: `forbidden column: ${k}` };
    }
  }
  const subjectArea = pick(obj, 'subject_area', 'subjectArea');
  const careerTitle = pick(obj, 'career_title', 'careerTitle');
  if (!subjectArea || !careerTitle) {
    return { ok: false, reason: 'missing subject_area or career_title' };
  }
  const careerSector = pick(obj, 'career_sector', 'careerSector');
  const demandTrend = pick(obj, 'demand_trend', 'demandTrend');
  const growthPct = safeNumber(pick(obj, 'growth_pct', 'growthPct'));
  const medianSalary = safeNumber(pick(obj, 'median_salary_gbp', 'medianSalaryGbp'));
  const salary5yr = safeNumber(pick(obj, 'salary_5yr_gbp', 'salary5yrGbp'));
  const roiScore = safeNumber(pick(obj, 'roi_score', 'roiScore'));
  const skillsOverlap = pick(obj, 'skills_overlap', 'skillsOverlap');
  const confidence = safeNumber(pick(obj, 'confidence'));
  const source = pick(obj, 'source');
  const updatedAt = pick(obj, 'updated_at', 'updatedAt');
  return {
    ok: true,
    row: {
      id: slugify(`${subjectArea}-${careerTitle}`),
      subjectArea,
      careerTitle,
      careerSector: careerSector ?? null,
      demandTrend: demandTrend ?? null,
      growthPct,
      medianSalaryGbp: medianSalary,
      salary5yrGbp: salary5yr,
      roiScore,
      skillsOverlap: skillsOverlap ?? null,
      confidence,
      source: source ?? 'workhorse-datalake',
      updatedAt: updatedAt ?? null,
      provenance: 'workhorse-datalake',
    },
  };
}
