const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const PATH = path.join(__dirname, "..", "data", "funding.json");
let FUNDING = [];
let LOADED_AT = null;

function load() {
  if (!fs.existsSync(PATH)) {
    FUNDING = [];
    LOADED_AT = null;
    return;
  }
  FUNDING = JSON.parse(fs.readFileSync(PATH, "utf8"));
  LOADED_AT = new Date().toISOString();
}
load();

// GET /api/funding?country=&region=&status=&category=&q=
router.get("/", (req, res) => {
  const { country, region, status, category, q, page = 1, page_size = 50 } = req.query;
  const lc = (s) => (s ? String(s).toLowerCase() : null);
  const cn = lc(country);
  const rg = lc(region);
  const st = lc(status);
  const cat = lc(category);
  const query = lc(q);
  let out = FUNDING;
  if (cn) out = out.filter((f) => (f.country || "").toLowerCase() === cn);
  if (rg) out = out.filter((f) => (f.region || "").toLowerCase().includes(rg));
  if (st) out = out.filter((f) => (f.status || "").toLowerCase() === st);
  if (cat) out = out.filter((f) => (f.category || "").toLowerCase() === cat);
  if (query)
    out = out.filter(
      (f) =>
        (f.title || "").toLowerCase().includes(query) ||
        (f.funder || "").toLowerCase().includes(query) ||
        (f.programme || "").toLowerCase().includes(query),
    );
  const total = out.length;
  const ps = Math.min(Number(page_size), 200);
  const offset = (Math.max(Number(page), 1) - 1) * ps;
  res.json({
    total,
    page: Number(page),
    pageSize: ps,
    loadedAt: LOADED_AT,
    funding: out.slice(offset, offset + ps),
  });
});

router.get("/facets", (req, res) => {
  const facet = (key) => {
    const counts = {};
    for (const f of FUNDING) {
      const v = f[key] || "unknown";
      counts[v] = (counts[v] || 0) + 1;
    }
    return counts;
  };
  res.json({
    loadedAt: LOADED_AT,
    total: FUNDING.length,
    country: facet("country"),
    region: facet("region"),
    status: facet("status"),
    category: facet("category"),
  });
});

router.post("/reload", (req, res) => {
  load();
  res.json({ loadedAt: LOADED_AT, total: FUNDING.length });
});

module.exports = router;
