const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const CAREER_PATHWAYS_PATH = path.join(__dirname, "..", "data", "career-pathways.json");

let CAREER_PATHWAYS = [];
let BY_SUBJECT = new Map();
let SUBJECT_AGGREGATE = []; // [{ subject, careerCount, avgMedianSalary, avgGrowth, topCareer }, ...]
let LOADED_AT = null;

function loadCareerPathways() {
  if (!fs.existsSync(CAREER_PATHWAYS_PATH)) {
    CAREER_PATHWAYS = [];
    BY_SUBJECT = new Map();
    SUBJECT_AGGREGATE = [];
    LOADED_AT = null;
    return;
  }
  const raw = JSON.parse(fs.readFileSync(CAREER_PATHWAYS_PATH, "utf8"));
  CAREER_PATHWAYS = Array.isArray(raw) ? raw : [];
  BY_SUBJECT = new Map();
  for (const row of CAREER_PATHWAYS) {
    const key = (row.subjectArea || "").trim().toLowerCase();
    if (!key) continue;
    if (!BY_SUBJECT.has(key)) BY_SUBJECT.set(key, []);
    BY_SUBJECT.get(key).push(row);
  }
  SUBJECT_AGGREGATE = [...BY_SUBJECT.entries()]
    .map(([subject, careers]) => {
      const salaries = careers.map((c) => c.medianSalaryGbp).filter((n) => Number.isFinite(n));
      const growths = careers.map((c) => c.growthPct).filter((n) => Number.isFinite(n));
      const top = [...careers].sort(
        (a, b) => (b.medianSalaryGbp || 0) - (a.medianSalaryGbp || 0),
      )[0];
      return {
        subject,
        careerCount: careers.length,
        avgMedianSalaryGbp: salaries.length
          ? Math.round(salaries.reduce((s, n) => s + n, 0) / salaries.length)
          : null,
        avgGrowthPct: growths.length
          ? Number((growths.reduce((s, n) => s + n, 0) / growths.length).toFixed(1))
          : null,
        topCareer: top ? top.careerTitle : null,
        topCareerSalaryGbp: top ? top.medianSalaryGbp : null,
      };
    })
    .sort((a, b) => b.careerCount - a.careerCount);
  LOADED_AT = new Date().toISOString();
}

loadCareerPathways();

// Pick the best matching subject for a free-text query, then return its careers.
// Tries: exact match → contains-match → token-overlap. Falls back to null.
function matchSubject(query) {
  if (!query) return null;
  const q = query.trim().toLowerCase();
  if (BY_SUBJECT.has(q)) return q;
  // Contains match: any indexed subject that contains the query, shortest wins.
  const contains = [...BY_SUBJECT.keys()].filter((s) => s.includes(q) || q.includes(s));
  if (contains.length) {
    contains.sort((a, b) => Math.abs(a.length - q.length) - Math.abs(b.length - q.length));
    return contains[0];
  }
  // Token overlap: count shared tokens.
  const qTokens = q.split(/\s+/).filter(Boolean);
  let best = null;
  let bestScore = 0;
  for (const subject of BY_SUBJECT.keys()) {
    const subjectTokens = subject.split(/\s+/);
    const overlap = qTokens.filter((t) => subjectTokens.includes(t)).length;
    if (overlap > bestScore) {
      bestScore = overlap;
      best = subject;
    }
  }
  return bestScore > 0 ? best : null;
}

router.get("/", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 500, 5000);
  res.json({
    total: CAREER_PATHWAYS.length,
    subjects: SUBJECT_AGGREGATE.length,
    loadedAt: LOADED_AT,
    sample: CAREER_PATHWAYS.slice(0, limit),
  });
});

router.get("/subjects", (req, res) => {
  res.json({
    total: SUBJECT_AGGREGATE.length,
    loadedAt: LOADED_AT,
    subjects: SUBJECT_AGGREGATE,
  });
});

router.get("/subject/:subject", (req, res) => {
  const matched = matchSubject(req.params.subject);
  if (!matched) {
    return res.json({
      query: req.params.subject,
      matchedSubject: null,
      careers: [],
      hint: "No matching subject found in the career-pathways lake. Try a simpler term (e.g. 'computer science', 'biology', 'business').",
    });
  }
  const careers = BY_SUBJECT.get(matched) || [];
  res.json({
    query: req.params.subject,
    matchedSubject: matched,
    total: careers.length,
    careers,
  });
});

router.post("/reload", (req, res) => {
  loadCareerPathways();
  res.json({ loadedAt: LOADED_AT, total: CAREER_PATHWAYS.length });
});

module.exports = router;
