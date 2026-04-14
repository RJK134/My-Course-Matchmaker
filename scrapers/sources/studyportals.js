/**
 * StudyPortals Scraper — European bachelor & master courses
 * Uses Cheerio + axios because listing pages on bachelorsportal.com and
 * mastersportal.com are server-rendered.
 */
const axios = require("axios");
const cheerio = require("cheerio");
const config = require("../config");
const { normaliseCourse } = require("../lib/normalizer");
const { classify } = require("../lib/domainClassifier");
const { scoreQuality } = require("../lib/dataQuality");
const { generateFingerprint } = require("../lib/deduplicator");
const RateLimiter = require("../lib/rateLimiter");
const logger = require("../lib/logger");

const limiter = new RateLimiter(config.sources.studyportals.rateLimit);
const BACHELOR_URL = config.sources.studyportals.baseUrl;   // bachelorsportal.com
const MASTER_URL = config.sources.studyportals.mastersUrl;   // mastersportal.com
const MAX_PAGES = config.sources.studyportals.maxPages;
const headers = { "User-Agent": config.sources.studyportals.userAgent };

// ─── Discipline categories matching the 19 domain families ───────────────────
const DISCIPLINES = [
  { slug: "performing-arts", subjects: ["performing arts", "drama", "dance"] },
  { slug: "music", subjects: ["music", "music technology"] },
  { slug: "fine-arts-design", subjects: ["fine art", "visual arts", "art"] },
  { slug: "applied-arts-design", subjects: ["graphic design", "product design", "design"] },
  { slug: "journalism-media", subjects: ["film", "media studies", "journalism"] },
  { slug: "language-cultural-studies", subjects: ["creative writing", "literature", "linguistics"] },
  { slug: "computer-science-it", subjects: ["computer science", "software engineering", "computing"] },
  { slug: "engineering-technology", subjects: ["engineering", "mechanical", "electrical"] },
  { slug: "business-management", subjects: ["business", "management", "marketing", "economics"] },
  { slug: "natural-sciences-mathematics", subjects: ["biology", "chemistry", "physics", "mathematics"] },
  { slug: "medicine-health", subjects: ["medicine", "nursing", "public health"] },
  { slug: "law", subjects: ["law", "legal studies", "criminology"] },
  { slug: "social-sciences", subjects: ["psychology", "sociology", "political science"] },
  { slug: "humanities", subjects: ["history", "philosophy", "theology", "classics"] },
  { slug: "architecture-building-planning", subjects: ["architecture", "urban planning"] },
  { slug: "education-training", subjects: ["education", "teaching", "pedagogy"] },
  { slug: "sport-leisure", subjects: ["sport science", "exercise science", "coaching"] },
  { slug: "hospitality-tourism", subjects: ["hospitality", "tourism", "hotel management"] },
  { slug: "agriculture-forestry-fishery", subjects: ["agriculture", "forestry", "environmental management"] },
];

// ─── European countries to iterate ───────────────────────────────────────────
const COUNTRIES = [
  "United Kingdom", "Germany", "Netherlands", "France", "Spain", "Italy",
  "Sweden", "Denmark", "Norway", "Finland", "Switzerland", "Austria",
  "Belgium", "Ireland", "Poland", "Czech Republic", "Portugal", "Hungary",
  "Greece", "Romania",
];

// ─── Parse a single listing page ─────────────────────────────────────────────
function parseListingPage($, level, discipline) {
  const courses = [];

  // StudyPortals listing cards
  $('[class*="StudyCard"], [class*="result-card"], .search-result, .ResultCard, [data-testid="study-card"]').each((_, el) => {
    const card = $(el);

    const title = card.find(
      'h2, h3, [class*="CardTitle"], [class*="study-title"], [data-testid="card-title"]'
    ).first().text().trim();

    const institution = card.find(
      '[class*="institution"], [class*="OrganisationName"], [class*="uni-name"], [data-testid="institution-name"]'
    ).first().text().trim();

    const location = card.find(
      '[class*="location"], [class*="LocationName"], [data-testid="location"]'
    ).first().text().trim();

    const durationText = card.find(
      '[class*="duration"], [class*="Duration"], [data-testid="duration"]'
    ).first().text().trim();

    const feesText = card.find(
      '[class*="tuition"], [class*="fee"], [class*="Tuition"], [data-testid="tuition-fee"]'
    ).first().text().trim();

    const modeText = card.find(
      '[class*="study-mode"], [class*="StudyMode"], [class*="format"], [data-testid="study-mode"]'
    ).first().text().trim();

    const link = card.find("a[href]").first().attr("href");

    if (!title) return;

    // Parse location into city / country
    const locationParts = location.split(",").map((s) => s.trim());
    const city = locationParts[0] || "";
    const country = locationParts[locationParts.length - 1] || "";

    courses.push({
      title,
      institution: institution || "",
      country: country,
      city: city,
      level: level,
      mode: modeText || "full-time",
      duration: durationText || null,
      feeRange: feesText || null,
      subjects: [...discipline.subjects],
      sourceUrl: link ? (link.startsWith("http") ? link : null) : null,
      sourceCourseId: null,
      online: /online|distance/i.test(modeText),
      free: false,
      entryReqs: null,
      careerPaths: [],
    });
  });

  return courses;
}

// ─── Parse fee ranges like "EUR 2,000 - 4,000/year" ─────────────────────────
function parseFeeRange(feeRange) {
  if (!feeRange) return { feeHome: null, feeIntl: null };

  const rangeMatch = feeRange.match(/([\d,.]+)\s*[-–]\s*([\d,.]+)/);
  if (rangeMatch) {
    const low = parseFloat(rangeMatch[1].replace(/,/g, ""));
    const high = parseFloat(rangeMatch[2].replace(/,/g, ""));
    // Use low end as home fee estimate, high end as international
    return { feeHome: low, feeIntl: high };
  }

  // Single value
  const singleMatch = feeRange.match(/([\d,.]+)/);
  if (singleMatch) {
    const val = parseFloat(singleMatch[1].replace(/,/g, ""));
    return { feeHome: val, feeIntl: val };
  }

  return { feeHome: null, feeIntl: null };
}

// ─── Scrape one portal (bachelor or master) for a discipline + country ───────
async function scrapePortal(baseUrl, level, discipline, country, limit, totalSoFar) {
  const courses = [];
  const countrySlug = country.toLowerCase().replace(/\s+/g, "-");
  let pageNum = 1;

  while (pageNum <= MAX_PAGES) {
    if (limit && (totalSoFar + courses.length) >= limit) break;

    await limiter.wait();
    const url = `${baseUrl}/studies/${discipline.slug}/${countrySlug}/?page=${pageNum}`;

    try {
      const { data } = await axios.get(url, { headers, timeout: 15000 });
      const $ = cheerio.load(data);

      const pageCourses = parseListingPage($, level, discipline);

      if (pageCourses.length === 0) {
        break;
      }

      // Enrich with country context if parser couldn't extract it
      for (const c of pageCourses) {
        if (!c.country || c.country.length < 2) {
          c.country = country;
        }
        // Parse fee range into feeHome/feeIntl
        const fees = parseFeeRange(c.feeRange);
        c.feeHome = fees.feeHome;
        c.feeIntl = fees.feeIntl;
        delete c.feeRange;
      }

      courses.push(...pageCourses);

      logger.info("studyportals", `${level} ${discipline.slug} in ${country} page ${pageNum}`, {
        pageResults: pageCourses.length,
        subTotal: courses.length,
      });

      // Check for next page
      const hasNext = $('[class*="next"], a[rel="next"], [aria-label="Next page"], .pagination .next').length > 0;
      if (!hasNext) break;

      pageNum++;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        // No listings for this combination — not an error
        break;
      }
      logger.warn("studyportals", `Failed ${level} ${discipline.slug} in ${country} page ${pageNum}: ${err.message}`);
      break;
    }
  }

  return courses;
}

// ─── Scrape all disciplines for a level ──────────────────────────────────────
async function scrapeLevel(baseUrl, level, limit) {
  const courses = [];

  for (const discipline of DISCIPLINES) {
    for (const country of COUNTRIES) {
      if (limit && courses.length >= limit) break;

      const results = await scrapePortal(baseUrl, level, discipline, country, limit, courses.length);
      courses.push(...results);

      if (results.length > 0) {
        logger.info("studyportals", `Completed ${level} ${discipline.slug} in ${country}`, {
          found: results.length,
          runningTotal: courses.length,
        });
      }
    }
    if (limit && courses.length >= limit) break;
  }

  return courses;
}

// ─── Main runner ─────────────────────────────────────────────────────────────
async function run({ limit } = {}) {
  logger.info("studyportals", "Starting StudyPortals scrape", { limit });
  const perLevel = limit ? Math.ceil(limit / 2) : null;

  const [bachelors, masters] = await Promise.all([
    scrapeLevel(BACHELOR_URL, "bachelor", perLevel).catch((e) => {
      logger.error("studyportals", `Bachelors scrape failed: ${e.message}`);
      return [];
    }),
    scrapeLevel(MASTER_URL, "master", perLevel).catch((e) => {
      logger.error("studyportals", `Masters scrape failed: ${e.message}`);
      return [];
    }),
  ]);

  const allRaw = [...bachelors, ...masters];
  logger.info("studyportals", `Raw courses collected`, {
    bachelors: bachelors.length,
    masters: masters.length,
    total: allRaw.length,
  });

  // Normalise, classify, score, fingerprint
  const processed = allRaw.map((raw) => {
    const normalised = normaliseCourse(raw, "studyportals");
    const classification = classify(normalised);
    const quality = scoreQuality({ ...normalised, domain: classification.domain });
    const fingerprint = generateFingerprint(normalised);

    return {
      ...normalised,
      domain: classification.domain,
      confidence_score: classification.confidence,
      data_quality_score: quality,
      fingerprint,
      source: "studyportals",
    };
  });

  // Deduplicate within this batch
  const seen = new Set();
  const deduped = processed.filter((c) => {
    if (seen.has(c.fingerprint)) return false;
    seen.add(c.fingerprint);
    return true;
  });

  logger.info("studyportals", `Scrape complete`, {
    processed: processed.length,
    afterDedup: deduped.length,
    removed: processed.length - deduped.length,
  });

  return deduped;
}

module.exports = { run };
