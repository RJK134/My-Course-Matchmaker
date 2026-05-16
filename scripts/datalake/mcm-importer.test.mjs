// scripts/datalake/mcm-importer.test.mjs
//
// Uses Node's built-in test runner (`node --test`). Zero new deps.
// Run with: `npm test`.

import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';

import {
  FORBIDDEN_COLUMNS,
  detectForbiddenColumns,
  parseCsv,
  rowsToObjects,
  validateCareerPathwayRow,
  validateCourseRow,
} from './mcm-importer.mjs';

const GOOD_COURSE_ROW = {
  id: '142',
  ucas_code: 'I100',
  provider: 'University of Manchester',
  title: 'BSc (Hons) Computer Science',
  qualification: 'BSc (Hons)',
  subject_area: 'Computer Science',
  location_city: 'Manchester',
  fees_uk_gbp: '9535',
  fees_intl_gbp: '32500',
  url: 'https://www.manchester.ac.uk/study/undergraduate/courses/2026/00128/',
  source: 'ucas',
  last_seen_at: '2026-05-10T08:00:00Z',
};

const GOOD_PATHWAY_ROW = {
  subject_area: 'Computer Science',
  career_title: 'Software engineer',
  career_sector: 'Technology',
  demand_trend: 'rising',
  growth_pct: '22.5',
  median_salary_gbp: '52000',
  salary_5yr_gbp: '78000',
  roi_score: '0.78',
  skills_overlap: 'algorithms;data-structures;system-design',
  confidence: '0.9',
  source: 'ons-lmi',
  updated_at: '2026-05-10T08:00:00Z',
};

describe('detectForbiddenColumns', () => {
  it('returns an empty array for a clean course header', () => {
    assert.deepEqual(detectForbiddenColumns(Object.keys(GOOD_COURSE_ROW)), []);
  });

  it('flags forbidden columns case-insensitively', () => {
    assert.deepEqual(detectForbiddenColumns(['title', 'BODY']), ['body']);
    assert.deepEqual(detectForbiddenColumns(['Mark_Scheme', 'url']), ['mark_scheme']);
  });

  it('rejects every documented body / answer / PII alias', () => {
    for (const col of FORBIDDEN_COLUMNS) {
      assert.ok(
        detectForbiddenColumns(['title', col]).includes(col),
        `expected ${col} to be detected`,
      );
    }
  });
});

describe('parseCsv + rowsToObjects', () => {
  it('round-trips a typical workhorse export', () => {
    const csv =
      'title,url,city\n' +
      'BSc Computer Science,https://example.test/a,Manchester\n' +
      '"BA, English Literature",https://example.test/b,Leeds\n';
    const { header, objects } = rowsToObjects(parseCsv(csv));
    assert.deepEqual(header, ['title', 'url', 'city']);
    assert.equal(objects.length, 2);
    assert.equal(objects[1].title, 'BA, English Literature');
  });

  it('skips blank trailing rows', () => {
    const csv = 'title,url\nA,https://example.test\n\n';
    const { objects } = rowsToObjects(parseCsv(csv));
    assert.equal(objects.length, 1);
  });
});

describe('validateCourseRow', () => {
  it('accepts a well-formed workhorse courses.csv row', () => {
    const r = validateCourseRow(GOOD_COURSE_ROW);
    assert.equal(r.ok, true);
    assert.equal(r.row.title, 'BSc (Hons) Computer Science');
    assert.equal(r.row.feesUkGbp, 9535);
    assert.equal(r.row.feesIntlGbp, 32500);
    assert.equal(r.row.ucasCode, 'I100');
    assert.equal(r.row.provenance, 'workhorse-datalake');
    assert.ok(r.row.id.startsWith('university-of-manchester'));
  });

  it('drops rows missing a title', () => {
    const r = validateCourseRow({ ...GOOD_COURSE_ROW, title: '' });
    assert.equal(r.ok, false);
  });

  it('drops rows missing a url', () => {
    const r = validateCourseRow({ ...GOOD_COURSE_ROW, url: '' });
    assert.equal(r.ok, false);
  });

  it('drops rows whose url is not http(s)', () => {
    const r = validateCourseRow({ ...GOOD_COURSE_ROW, url: 'javascript:alert(1)' });
    assert.equal(r.ok, false);
  });

  it('rejects rows smuggling a forbidden body column', () => {
    const r = validateCourseRow({ ...GOOD_COURSE_ROW, body: 'leaked text' });
    assert.equal(r.ok, false);
  });

  it('rejects rows smuggling applicant PII (email)', () => {
    const r = validateCourseRow({ ...GOOD_COURSE_ROW, email: 'student@example.test' });
    assert.equal(r.ok, false);
  });

  it('coerces missing fee numbers to null instead of dropping the row', () => {
    const r = validateCourseRow({ ...GOOD_COURSE_ROW, fees_uk_gbp: '', fees_intl_gbp: '' });
    assert.equal(r.ok, true);
    assert.equal(r.row.feesUkGbp, null);
    assert.equal(r.row.feesIntlGbp, null);
  });
});

describe('validateCareerPathwayRow', () => {
  it('accepts a well-formed workhorse pathway row', () => {
    const r = validateCareerPathwayRow(GOOD_PATHWAY_ROW);
    assert.equal(r.ok, true);
    assert.equal(r.row.subjectArea, 'Computer Science');
    assert.equal(r.row.careerTitle, 'Software engineer');
    assert.equal(r.row.medianSalaryGbp, 52000);
    assert.equal(r.row.salary5yrGbp, 78000);
    assert.equal(r.row.roiScore, 0.78);
    assert.equal(r.row.provenance, 'workhorse-datalake');
  });

  it('drops rows missing subject_area', () => {
    const r = validateCareerPathwayRow({ ...GOOD_PATHWAY_ROW, subject_area: '' });
    assert.equal(r.ok, false);
  });

  it('drops rows missing career_title', () => {
    const r = validateCareerPathwayRow({ ...GOOD_PATHWAY_ROW, career_title: '' });
    assert.equal(r.ok, false);
  });

  it('rejects rows smuggling a forbidden mark_scheme column', () => {
    const r = validateCareerPathwayRow({ ...GOOD_PATHWAY_ROW, mark_scheme: 'answer key' });
    assert.equal(r.ok, false);
  });

  it('coerces non-numeric demand/growth metrics to null', () => {
    const r = validateCareerPathwayRow({
      ...GOOD_PATHWAY_ROW,
      growth_pct: 'unknown',
      confidence: '',
    });
    assert.equal(r.ok, true);
    assert.equal(r.row.growthPct, null);
    assert.equal(r.row.confidence, null);
  });
});
