const express = require("express");
const fs = require("fs");
const path = require("path");
const pool = require("../db/pool");
const router = express.Router();

// Global COL JSON: ~60 international university cities with rent / food /
// transport / utils / misc in native currency AND a GBP-converted snapshot.
const GLOBAL_COL_PATH = path.join(
  __dirname,
  "..",
  "..",
  "frontend",
  "src",
  "data",
  "costOfLiving.global.json",
);
let GLOBAL_COL = [];
let GLOBAL_COL_BY_CITY = new Map();
function loadGlobalCol() {
  try {
    if (!fs.existsSync(GLOBAL_COL_PATH)) return;
    GLOBAL_COL = JSON.parse(fs.readFileSync(GLOBAL_COL_PATH, "utf8"));
    GLOBAL_COL_BY_CITY = new Map(GLOBAL_COL.map((r) => [r.city.toLowerCase(), r]));
  } catch (_e) {
    /* shipped JSON; only fails if hand-edited badly */
  }
}
loadGlobalCol();

// Curated UK COL from Postgres (the original 55 cities).
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM cost_of_living ORDER BY city");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// The global international COL set, served from the JSON snapshot.
router.get("/global", (req, res) => {
  res.json({ total: GLOBAL_COL.length, cities: GLOBAL_COL });
});

// Combined city lookup: tries the global file first, falls back to Postgres.
router.get("/lookup/:city", async (req, res) => {
  const key = decodeURIComponent(req.params.city).toLowerCase();
  const hit = GLOBAL_COL_BY_CITY.get(key);
  if (hit) return res.json({ source: "global", ...hit });
  try {
    const result = await pool.query(
      "SELECT * FROM cost_of_living WHERE LOWER(city) = $1",
      [key],
    );
    if (result.rows[0]) return res.json({ source: "curated-db", ...result.rows[0] });
    res.status(404).json({ error: "no COL data for that city" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:city", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM cost_of_living WHERE city = $1",
      [req.params.city],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "City not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/reload-global", (req, res) => {
  loadGlobalCol();
  res.json({ total: GLOBAL_COL.length });
});

module.exports = router;
