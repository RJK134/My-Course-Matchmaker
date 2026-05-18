const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const PATH = path.join(__dirname, "..", "data", "fx.json");
let RAW = [];
let LATEST = {}; // base -> quote -> { rate, date }
let LOADED_AT = null;

const KNOWN_NEUTRAL = new Set(["GBP", "USD", "EUR", "CHF"]);

function load() {
  if (!fs.existsSync(PATH)) {
    RAW = [];
    LATEST = {};
    LOADED_AT = null;
    return;
  }
  RAW = JSON.parse(fs.readFileSync(PATH, "utf8"));
  LATEST = {};
  // Skip "INTEREST" pseudo-pairs (BoE/SNB rates parked in the same table).
  for (const row of RAW) {
    if (!row.base || !row.quote || row.quote === "INTEREST") continue;
    LATEST[row.base] = LATEST[row.base] || {};
    const existing = LATEST[row.base][row.quote];
    if (!existing || existing.date < row.date) {
      LATEST[row.base][row.quote] = { rate: row.rate, date: row.date };
    }
  }
  LOADED_AT = new Date().toISOString();
}
load();

function getRate(base, quote) {
  if (!base || !quote || base === quote) return 1;
  base = base.toUpperCase();
  quote = quote.toUpperCase();
  if (LATEST[base]?.[quote]) return LATEST[base][quote].rate;
  // Try inverse.
  if (LATEST[quote]?.[base]) return 1 / LATEST[quote][base].rate;
  // Triangulate via EUR or USD.
  for (const bridge of ["EUR", "USD", "GBP"]) {
    if (bridge === base || bridge === quote) continue;
    const r1 =
      LATEST[base]?.[bridge]?.rate ??
      (LATEST[bridge]?.[base]?.rate ? 1 / LATEST[bridge][base].rate : null);
    const r2 =
      LATEST[bridge]?.[quote]?.rate ??
      (LATEST[quote]?.[bridge]?.rate ? 1 / LATEST[quote][bridge].rate : null);
    if (r1 != null && r2 != null) return r1 * r2;
  }
  return null;
}

// GET /api/fx — full table of latest rates per pair
router.get("/", (req, res) => {
  res.json({ loadedAt: LOADED_AT, totalRows: RAW.length, latest: LATEST });
});

// GET /api/fx/rate?base=GBP&quote=USD — single conversion
router.get("/rate", (req, res) => {
  const base = (req.query.base || "GBP").toUpperCase();
  const quote = (req.query.quote || "USD").toUpperCase();
  const rate = getRate(base, quote);
  if (rate == null) return res.status(404).json({ error: `No rate for ${base}->${quote}` });
  res.json({ base, quote, rate, source: "ecb-via-workhorse-datalake" });
});

// GET /api/fx/convert?amount=10000&from=GBP&to=USD
router.get("/convert", (req, res) => {
  const amount = Number(req.query.amount);
  const from = (req.query.from || "GBP").toUpperCase();
  const to = (req.query.to || "USD").toUpperCase();
  if (!Number.isFinite(amount)) return res.status(400).json({ error: "amount must be a number" });
  const rate = getRate(from, to);
  if (rate == null) return res.status(404).json({ error: `No rate for ${from}->${to}` });
  res.json({ amount, from, to, rate, converted: Math.round(amount * rate) });
});

router.post("/reload", (req, res) => {
  load();
  res.json({ loadedAt: LOADED_AT });
});

module.exports = {
  router,
  getRate,
  load,
  KNOWN_NEUTRAL,
};
