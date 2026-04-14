/**
 * Numbeo Cost-of-Living Scraper
 * Fetches rent, food, transport, utilities, and miscellaneous costs for cities.
 * Uses Cheerio + axios on numbeo.com/cost-of-living/in/{CityName}.
 * Rate limit: 3000 ms between requests.
 */
const axios = require("axios");
const cheerio = require("cheerio");
const config = require("../config");
const { classify } = require("../lib/domainClassifier");
const { scoreQuality } = require("../lib/dataQuality");
const RateLimiter = require("../lib/rateLimiter");
const logger = require("../lib/logger");

const cfg = config.sources.numbeo;
const limiter = new RateLimiter(cfg.rateLimit);
const headers = { "User-Agent": cfg.userAgent };

/**
 * Convert a city name into the Numbeo URL slug.
 * "New York" -> "New-York", "Ho Chi Minh City" -> "Ho-Chi-Minh-City"
 */
function cityToSlug(city) {
  return city
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Za-z0-9\-]/g, "");
}

/**
 * Parse a price string from Numbeo into a number.
 * Handles formats like "1,200.50 $", "850.00 EUR", "3,500.00\u00a0kr" etc.
 */
function parsePrice(text) {
  if (!text) return null;
  const cleaned = text.replace(/[^\d.,\-]/g, "").replace(/,/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : Math.round(num * 100) / 100;
}

/**
 * Extract the currency code from a price cell (e.g. "$", "EUR", "kr").
 */
function extractCurrency(text) {
  if (!text) return "USD";
  const match = text.match(/([A-Z]{2,3}|[$\u20ac\u00a3])/);
  if (!match) return "USD";
  const sym = match[1];
  const map = { $: "USD", "\u20ac": "EUR", "\u00a3": "GBP" };
  return map[sym] || sym;
}

/**
 * Scrape cost-of-living data for a single city.
 * Returns a COL record matching the canonical schema, or null on failure.
 */
async function scrapeCity(cityName) {
  const slug = cityToSlug(cityName);
  const url = `${cfg.baseUrl}/${slug}`;

  await limiter.wait();

  let data;
  try {
    const response = await axios.get(url, { headers, timeout: 20000 });
    data = response.data;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      logger.warn("numbeo", `City not found on Numbeo: ${cityName}`, { slug });
    } else {
      logger.warn("numbeo", `Failed to fetch ${cityName}: ${err.message}`);
    }
    return null;
  }

  const $ = cheerio.load(data);

  // Numbeo renders a table with class "data_wide_table" containing cost items.
  // Each row has a description cell and a price cell.
  const costs = {};
  let currency = "USD";

  $("table.data_wide_table tbody tr, table.data_wide_table tr").each(
    (_, el) => {
      const cells = $(el).find("td");
      if (cells.length < 2) return;

      const label = cells.eq(0).text().trim().toLowerCase();
      const priceText = cells.eq(1).text().trim();
      const price = parsePrice(priceText);

      // Detect currency from the first valid price cell
      if (price !== null && currency === "USD") {
        currency = extractCurrency(priceText);
      }

      // ── Rent (1-bedroom, city centre) ─────────────────────────────
      if (
        label.includes("apartment") &&
        label.includes("1") &&
        label.includes("centre")
      ) {
        costs.rent = price;
      }

      // ── Food / Groceries (monthly estimate from key items) ────────
      // Numbeo lists individual grocery items; we accumulate key staples
      // and also check for "meal" rows for a composite food figure.
      if (label.includes("meal, inexpensive restaurant")) {
        // Rough monthly food: 30 meals * inexpensive restaurant price
        costs._mealCheap = price;
      }
      if (label.includes("meal for 2 people, mid-range")) {
        costs._meal2 = price;
      }
      if (
        label.includes("milk (regular)") ||
        label.includes("milk, regular")
      ) {
        costs._milk = price;
      }
      if (label.includes("loaf of fresh white bread")) {
        costs._bread = price;
      }
      if (label.includes("rice") && label.includes("1kg")) {
        costs._rice = price;
      }
      if (label.includes("eggs") && label.includes("12")) {
        costs._eggs = price;
      }

      // ── Transport (monthly pass) ─────────────────────────────────
      if (
        label.includes("monthly pass") ||
        (label.includes("transportation") && label.includes("monthly"))
      ) {
        costs.transport = price;
      }

      // ── Utilities (basic for 85m2 apartment) ─────────────────────
      if (
        label.includes("basic (electricity, heating, cooling, water, garbage)")
      ) {
        costs.utils = price;
      }

      // ── Internet (broadband) — goes into misc ────────────────────
      if (label.includes("internet") && label.includes("60 mbps")) {
        costs._internet = price;
      }
    }
  );

  // ── Derive composite food figure ──────────────────────────────────────────
  // Estimate monthly groceries from individual items when available,
  // otherwise fall back to a rough 30 * cheap-meal estimate.
  if (costs._milk != null && costs._bread != null && costs._rice != null && costs._eggs != null) {
    // Rough 4-week grocery basket: (milk*8 + bread*4 + rice*4 + eggs*4) * 1.8 multiplier
    costs.food = Math.round(
      (costs._milk * 8 + costs._bread * 4 + costs._rice * 4 + costs._eggs * 4) * 1.8
    );
  } else if (costs._mealCheap) {
    costs.food = Math.round(costs._mealCheap * 30);
  } else {
    costs.food = null;
  }

  // ── Derive misc (internet + small buffer) ─────────────────────────────────
  costs.misc = costs._internet || null;

  // If we got essentially nothing, treat it as a failed scrape
  if (costs.rent == null && costs.food == null && costs.transport == null) {
    logger.warn("numbeo", `No cost data extracted for ${cityName}`);
    return null;
  }

  const record = {
    city: cityName,
    rent: costs.rent || null,
    food: costs.food || null,
    transport: costs.transport || null,
    utils: costs.utils || null,
    misc: costs.misc || null,
    currency,
    note: `Scraped from Numbeo (${new Date().toISOString().slice(0, 10)})`,
  };

  logger.info("numbeo", `Scraped COL for ${cityName}`, {
    rent: record.rent,
    food: record.food,
    transport: record.transport,
  });

  return record;
}

// ─── Main runner ────────────────────────────────────────────────────────────
async function run({ cities } = {}) {
  if (!cities || !Array.isArray(cities) || cities.length === 0) {
    logger.warn("numbeo", "No cities provided -- nothing to scrape");
    return [];
  }

  logger.info("numbeo", "Starting Numbeo COL scrape", {
    cityCount: cities.length,
    cities: cities.slice(0, 10), // log first 10 for brevity
  });

  const results = [];

  for (const city of cities) {
    try {
      const record = await scrapeCity(city);
      if (record) {
        // Run domain classifier and quality scorer on the COL record so it
        // integrates with the rest of the pipeline.
        const classification = classify({ title: `Cost of living in ${city}`, subjects: ["cost of living"] });
        const quality = scoreQuality({
          title: `Cost of living in ${city}`,
          city,
          domain: classification.domain,
          country: city, // best we have without a separate lookup
        });

        results.push({
          ...record,
          domain: classification.domain,
          data_quality_score: quality,
          source: "numbeo",
        });
      }
    } catch (err) {
      logger.error("numbeo", `Error scraping ${city}: ${err.message}`);
    }
  }

  logger.info("numbeo", "Scrape complete", {
    requested: cities.length,
    successful: results.length,
    failed: cities.length - results.length,
  });

  return results;
}

module.exports = { run };
