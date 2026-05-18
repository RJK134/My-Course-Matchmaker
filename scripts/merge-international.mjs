#!/usr/bin/env node
// scripts/merge-international.mjs
//
// One-shot helper: appends the courses + institutions in
// frontend/src/data/international-courses.additions.json into the
// canonical courses.json + institutions.json. Idempotent — re-running
// is a no-op (matches on (title, institution) for courses and on key
// for institutions).

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(REPO_ROOT, 'frontend', 'src', 'data');

const additions = JSON.parse(readFileSync(join(DATA, 'international-courses.additions.json'), 'utf8'));
const institutions = JSON.parse(readFileSync(join(DATA, 'institutions.json'), 'utf8'));
const courses = JSON.parse(readFileSync(join(DATA, 'courses.json'), 'utf8'));

const instKeys = new Set(institutions.map((i) => i.key));
let addedInst = 0;
for (const i of additions.institutions || []) {
  if (!instKeys.has(i.key)) {
    institutions.push(i);
    instKeys.add(i.key);
    addedInst += 1;
  }
}

const courseFingerprints = new Set(
  courses.map((c) => `${c.title.toLowerCase()}|${(c.institution || '').toLowerCase()}`),
);
let nextId = Math.max(...courses.map((c) => c.id || 0)) + 1;
let addedCourse = 0;
for (const c of additions.courses || []) {
  const fp = `${c.title.toLowerCase()}|${(c.institution || '').toLowerCase()}`;
  if (courseFingerprints.has(fp)) continue;
  courses.push({ id: nextId, ...c });
  courseFingerprints.add(fp);
  nextId += 1;
  addedCourse += 1;
}

writeFileSync(join(DATA, 'institutions.json'), JSON.stringify(institutions, null, 2) + '\n', 'utf8');
writeFileSync(join(DATA, 'courses.json'), JSON.stringify(courses, null, 2) + '\n', 'utf8');

console.log(`[merge-international] added ${addedInst} institutions, ${addedCourse} courses`);
console.log(`[merge-international] catalogue now: ${institutions.length} institutions, ${courses.length} courses`);
