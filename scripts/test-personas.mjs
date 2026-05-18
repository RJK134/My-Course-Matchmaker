#!/usr/bin/env node
// scripts/test-personas.mjs
//
// Hits the running MCM API + matcher with the 6 personas defined in
// TESTING-GUIDE.md and asserts the load-bearing behaviours that have
// previously broken (fee status by nationality, hard level filter,
// Scottish three-tier fees, domain detection, location filtering).
//
// Run against a live API:
//   API_URL=http://localhost:3002 node scripts/test-personas.mjs
//
// Exits non-zero on any failure.

import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API_URL = process.env.API_URL || 'http://localhost:3002';

// We need the matcher. It's an ES module in the frontend lib — import it
// directly so we exercise the same scoring real users get.
const matchingPath = join(REPO_ROOT, 'frontend', 'src', 'lib', 'matching.js');
const matchingSrc = readFileSync(matchingPath, 'utf8')
  // The frontend file imports the domain families JSON. Inline it for ESM.
  .replace(
    /import domainData from "[^"]+";/,
    `const domainData = ${JSON.stringify(JSON.parse(readFileSync(join(REPO_ROOT, 'frontend', 'src', 'data', 'domainFamilies.json'), 'utf8')))};`,
  );
const { calculateMatch, identifyPrimaryDomain, tokenise } = await import(
  `data:text/javascript;base64,${Buffer.from(matchingSrc).toString('base64')}`
);

const fees = await import(`data:text/javascript;base64,${Buffer.from(
  readFileSync(join(REPO_ROOT, 'frontend', 'src', 'lib', 'nationalityResolver.js'), 'utf8').replace(
    /import natData from "[^"]+";/,
    `const natData = ${JSON.stringify(JSON.parse(readFileSync(join(REPO_ROOT, 'frontend', 'src', 'data', 'nationalityMap.json'), 'utf8')))};`,
  ),
).toString('base64')}`);
const { detFeeStatus, getFee, resolveNat } = fees;

const PERSONAS = [
  {
    name: 'Sarah',
    profile: { name: 'Sarah', nationality: 'British', ukNation: 'England', residence: 'UK', subjects: 'Theatre, acting and performing arts', level: 'undergraduate', modes: ['full-time'], interests: 'Community theatre, directing, devised work', skills: 'Public speaking, creative thinking', locations: 'UK' },
    expect: {
      nationalityResolvedTo: 'UK',
      primaryDomain: 'performing_arts',
      topResultDomain: 'performing_arts',
      topResultCountry: ['UK', 'Scotland'],
      feeStatus: 'home',
    },
  },
  {
    name: 'Callum',
    profile: { name: 'Callum', nationality: 'British', ukNation: 'Scotland', residence: 'Scotland', subjects: 'Business, management and economics', level: 'undergraduate', modes: ['full-time'], interests: 'Entrepreneurship, start-ups', skills: 'Leadership, analytics', locations: 'Scotland' },
    expect: {
      nationalityResolvedTo: 'UK',
      primaryDomain: 'business',
      scottishHomeFee: true,
    },
  },
  {
    name: 'Anna',
    profile: { name: 'Anna', nationality: 'German', residence: 'Germany', subjects: 'Computer science and artificial intelligence', level: 'undergraduate', modes: ['full-time'], interests: 'Machine learning, open source', skills: 'Python, mathematics', locations: 'Germany, Netherlands, Switzerland' },
    expect: {
      nationalityResolvedTo: 'Germany',
      primaryDomain: 'computer_science',
      onlyLevel: 'undergraduate',
      hasNonUkInTop: true,
    },
  },
  {
    name: 'Priya',
    profile: { name: 'Priya', nationality: 'Indian', residence: 'India', subjects: 'Medicine, nursing and healthcare', level: 'undergraduate', modes: ['full-time'], interests: 'Public health, community medicine', skills: 'Biology, chemistry', locations: 'UK, Australia, Canada' },
    expect: {
      nationalityResolvedTo: 'India',
      primaryDomain: 'medicine_health',
      ukFeeStatus: 'international',
    },
  },
  {
    name: 'Mike',
    profile: { name: 'Mike', nationality: 'American', residence: 'USA', subjects: 'Web development, programming, software engineering', level: 'certificate', modes: ['online', 'part-time'], interests: 'Career change, freelancing', skills: 'Self-motivated', locations: '', searchOnline: true, searchFree: true },
    expect: {
      nationalityResolvedTo: 'USA',
      primaryDomain: 'computer_science',
      onlyLevel: 'certificate',
    },
  },
  {
    name: 'Luca',
    profile: { name: 'Luca', nationality: 'Italian', residence: 'Italy', subjects: 'Environmental science, conservation, sustainability', level: 'postgraduate', modes: ['full-time'], interests: 'Climate change, biodiversity', skills: 'Research methods, GIS', locations: 'UK, Netherlands, Denmark, Sweden' },
    expect: {
      nationalityResolvedTo: 'Italy',
      primaryDomain: 'agriculture_environment',
      onlyLevel: 'postgraduate',
    },
  },
];

async function fetchCourses() {
  const res = await fetch(`${API_URL}/api/courses`);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

let passed = 0;
let failed = 0;
const failures = [];

function record(personaName, check, ok, detail) {
  if (ok) {
    passed += 1;
    console.log(`  ✓ ${personaName}: ${check}`);
  } else {
    failed += 1;
    console.log(`  ✗ ${personaName}: ${check} — ${detail}`);
    failures.push(`${personaName}: ${check} (${detail})`);
  }
}

const courses = await fetchCourses();
// API rows use snake_case; convert to the frontend shape the matcher expects.
const normalised = courses.map((c) => ({
  ...c,
  institution: c.institution_key,
  feeHome: c.fee_home == null ? null : Number(c.fee_home),
  feeIntl: c.fee_intl == null ? null : Number(c.fee_intl),
  feeScotland: c.fee_scotland == null ? null : Number(c.fee_scotland),
  livingCost: c.living_cost == null ? null : Number(c.living_cost),
  entryReqs: c.entry_reqs,
  careerPaths: Array.isArray(c.career_paths) ? c.career_paths : [],
  avgSalary: c.avg_salary,
  online: c.is_online,
  free: c.is_free,
}));
console.log(`Loaded ${normalised.length} courses from ${API_URL}`);

for (const persona of PERSONAS) {
  console.log(`\n--- ${persona.name} ---`);
  const profile = persona.profile;
  const e = persona.expect;

  const natCode = resolveNat(profile.nationality);
  record(persona.name, 'nationality resolves', natCode === e.nationalityResolvedTo, `got ${natCode}, expected ${e.nationalityResolvedTo}`);

  const dom = identifyPrimaryDomain(tokenise(profile.subjects));
  record(persona.name, `primary domain is ${e.primaryDomain}`, dom.primary === e.primaryDomain, `got ${dom.primary}`);

  // Hard-filter by level (matches the React app flow).
  let pool = normalised;
  if (profile.level && profile.level !== 'any') {
    pool = pool.filter((c) => c.level === profile.level);
  }
  const scored = pool
    .map((c) => ({ ...c, _m: calculateMatch(c, profile).total, _f: detFeeStatus(profile.nationality, profile.residence, c.country, profile.ukNation) }))
    .sort((a, b) => b._m - a._m)
    .slice(0, 30);

  record(persona.name, 'matcher returned at least 5 results', scored.length >= 5, `got ${scored.length}`);

  if (e.onlyLevel) {
    const wrong = scored.filter((c) => c.level !== e.onlyLevel);
    record(persona.name, `hard-filter — all results are ${e.onlyLevel}`, wrong.length === 0, `${wrong.length} wrong-level results leaked: ${wrong.slice(0,3).map(c=>c.title).join(' / ')}`);
  }

  if (e.topResultDomain) {
    record(persona.name, `top result is in ${e.topResultDomain}`, scored[0]?.domain === e.topResultDomain, `top is ${scored[0]?.title} (${scored[0]?.domain})`);
  }

  if (e.topResultCountry) {
    record(persona.name, `top result is in expected country`, e.topResultCountry.includes(scored[0]?.country), `top is in ${scored[0]?.country}`);
  }

  if (e.feeStatus) {
    record(persona.name, `top result fee status is ${e.feeStatus}`, scored[0]?._f === e.feeStatus, `got ${scored[0]?._f}`);
  }

  if (e.ukFeeStatus) {
    const ukOne = scored.find((c) => c.country === 'UK');
    if (ukOne) {
      record(persona.name, `UK result fee status is ${e.ukFeeStatus}`, ukOne._f === e.ukFeeStatus, `got ${ukOne._f} for ${ukOne.title}`);
    }
  }

  if (e.scottishHomeFee) {
    const scot = scored.find((c) => c.country === 'Scotland');
    if (scot) {
      const fee = getFee(scot, scot._f);
      record(persona.name, `Scottish course fee is SAAS home rate (≤£2k)`, fee <= 2000, `got £${fee} for ${scot.title}`);
    } else {
      record(persona.name, 'has a Scottish result in top 30', false, 'no Scottish result found in top 30');
    }
  }

  if (e.hasNonUkInTop) {
    const nonUk = scored.find((c) => c.country !== 'UK' && c.country !== 'Scotland');
    record(persona.name, 'top 30 includes a non-UK result', !!nonUk, nonUk ? `e.g. ${nonUk.title} in ${nonUk.country}` : 'all UK');
  }
}

console.log(`\n=== ${passed} passed · ${failed} failed ===`);
if (failed > 0) {
  console.log('\nFailures:');
  for (const f of failures) console.log('  -', f);
  process.exit(1);
}
