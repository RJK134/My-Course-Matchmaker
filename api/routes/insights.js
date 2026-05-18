const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const PATH = path.join(__dirname, "..", "data", "insights.json");
let INSIGHTS = [];
let LOADED_AT = null;

function load() {
  if (!fs.existsSync(PATH)) {
    INSIGHTS = [];
    LOADED_AT = null;
    return;
  }
  INSIGHTS = JSON.parse(fs.readFileSync(PATH, "utf8"));
  LOADED_AT = new Date().toISOString();
}
load();

// GET /api/insights?type=&region=&subject=
router.get("/", (req, res) => {
  const { type, region, subject } = req.query;
  const t = type ? type.toLowerCase() : null;
  const r = region ? region.toLowerCase() : null;
  const s = subject ? subject.toLowerCase() : null;
  let out = INSIGHTS;
  if (t) out = out.filter((i) => (i.insightType || "").toLowerCase() === t);
  if (r) out = out.filter((i) => (i.region || "").toLowerCase().includes(r));
  if (s)
    out = out.filter(
      (i) =>
        (i.subjectArea || "").toLowerCase().includes(s) ||
        (i.title || "").toLowerCase().includes(s) ||
        (i.summary || "").toLowerCase().includes(s),
    );
  // Truncate long markdown summaries for the list view; full text via /:id.
  const trimmed = out.map((i) => ({
    ...i,
    summaryExcerpt: i.summary ? String(i.summary).slice(0, 280) : null,
  }));
  res.json({ total: trimmed.length, loadedAt: LOADED_AT, insights: trimmed });
});

router.get("/types", (req, res) => {
  const counts = {};
  for (const i of INSIGHTS) {
    const t = i.insightType || "unknown";
    counts[t] = (counts[t] || 0) + 1;
  }
  res.json({ loadedAt: LOADED_AT, types: counts });
});

router.get("/:id", (req, res) => {
  const found = INSIGHTS.find((i) => i.id === req.params.id);
  if (!found) return res.status(404).json({ error: "Not found" });
  res.json(found);
});

router.post("/reload", (req, res) => {
  load();
  res.json({ loadedAt: LOADED_AT, total: INSIGHTS.length });
});

module.exports = router;
