const express = require("express");
const { getCoursesIndex } = require("../lib/meilisearch");
const { getRate } = require("./fx");
const router = express.Router();

/**
 * GET /api/search
 *  q          full-text query
 *  country    one or more (repeat param to AND multiple OR groups — Meilisearch supports
 *             arrays in filter), pass comma-separated.
 *  level      undergraduate | postgraduate | certificate | doctorate
 *  source     curated | ucas | cug | whatuni | ofqual | mooc (provenance)
 *  free       true|false
 *  online     true|false
 *  max_fees   numeric GBP cap (filters by fees_for_filter)
 *  min_roi    numeric GBP cap (filters by roi)
 *  sort       affordability | roi | ranking | match (default: relevance)
 *  page       1-based
 *  page_size  default 20, max 100
 *
 * Returns { hits, total, page, pageSize, facets, processingTimeMs }
 */
router.get("/", async (req, res) => {
  try {
    const {
      q = "",
      country,
      level,
      source,
      free,
      online,
      max_fees,
      min_roi,
      sort,
      page = 1,
      page_size = 20,
    } = req.query;

    const filters = [];
    const arrFilter = (field, value) => {
      const vals = String(value).split(",").map((s) => s.trim()).filter(Boolean);
      if (vals.length === 1) filters.push(`${field} = "${vals[0]}"`);
      else if (vals.length > 1) filters.push(`(${vals.map((v) => `${field} = "${v}"`).join(" OR ")})`);
    };

    if (country) arrFilter("country", country);
    if (level) arrFilter("level", level);
    if (source) arrFilter("provenance", source);
    if (free === "true") filters.push("is_free = true");
    if (online === "true") filters.push("is_online = true");
    if (max_fees) filters.push(`fees_for_filter <= ${Number(max_fees)}`);
    if (min_roi) filters.push(`roi_score >= ${Number(min_roi)}`);

    const sortMap = {
      affordability: ["fees_for_filter:asc"],
      roi: ["roi_score:desc"],
      ranking: ["ranking_band:asc"],
      "fee-low": ["fees_for_filter:asc"],
      "fee-high": ["fees_for_filter:desc"],
    };

    const params = {
      limit: Math.min(Number(page_size), 100),
      offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(page_size), 100),
      filter: filters.length ? filters.join(" AND ") : undefined,
      facets: ["country", "level", "domain", "provenance", "is_free", "is_online"],
    };
    if (sort && sortMap[sort]) params.sort = sortMap[sort];

    const idx = getCoursesIndex();
    const result = await idx.search(q || "", params);

    // Currency layer: every doc is indexed in GBP. When ?currency=XXX is
    // passed, attach a `_converted` block so the client can render in the
    // user's home currency without a per-row round-trip.
    const requestedCurrency = (req.query.currency || "GBP").toUpperCase();
    let rate = 1;
    if (requestedCurrency !== "GBP") {
      rate = getRate("GBP", requestedCurrency) ?? 1;
    }
    const hits = result.hits.map((h) => {
      if (requestedCurrency === "GBP" || rate === 1) {
        return { ...h, _currency: { code: "GBP", rate: 1, source: "indexed" } };
      }
      const convert = (n) => (Number.isFinite(n) ? Math.round(n * rate) : null);
      return {
        ...h,
        _currency: {
          code: requestedCurrency,
          rate,
          source: "ecb-via-workhorse-datalake",
        },
        _converted: {
          fee_home: convert(h.fee_home),
          fee_intl: convert(h.fee_intl),
          fees_for_filter: convert(h.fees_for_filter),
          avg_salary_subject_gbp: convert(h.avg_salary_subject_gbp),
          top_career_salary_gbp: convert(h.top_career_salary_gbp),
        },
      };
    });

    res.json({
      hits,
      total: result.estimatedTotalHits ?? result.totalHits ?? result.hits.length,
      page: Number(page),
      pageSize: Number(page_size),
      facets: result.facetDistribution || {},
      processingTimeMs: result.processingTimeMs,
      query: q,
      appliedFilters: filters,
      currency: { code: requestedCurrency, rate, source: requestedCurrency === "GBP" ? "indexed" : "ecb-via-workhorse-datalake" },
    });
  } catch (err) {
    res.status(500).json({ error: err.message, hint: "Is the indexer up to date? Run: node scripts/index-courses.mjs" });
  }
});

router.get("/health", async (req, res) => {
  try {
    const idx = getCoursesIndex();
    const stats = await idx.getStats();
    res.json({ ok: true, ...stats });
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message });
  }
});

module.exports = router;
