/**
 * UCAS Scraper — UK undergraduate & postgraduate courses
 * Uses Playwright because digital.ucas.com is JS-rendered with dynamic filtering.
 * Iterates through subject areas matching the 19 MCM domain families.
 */
const config = require("../config");
const { normaliseCourse } = require("../lib/normalizer");
const { classify } = require("../lib/domainClassifier");
const { scoreQuality } = require("../lib/dataQuality");
const { generateFingerprint } = require("../lib/deduplicator");
const RateLimiter = require("../lib/rateLimiter");
const logger = require("../lib/logger");

const limiter = new RateLimiter(config.sources.ucas.rateLimit);
const BASE_URL = config.sources.ucas.baseUrl;
const MAX_PAGES = config.sources.ucas.maxPages;
const UA = config.sources.ucas.userAgent;

// ─── UCAS subject-area slugs mapped to the 19 domain families ────────────────
const SUBJECT_AREAS = [
  { slug: "performing-arts", subjects: ["performing arts", "drama", "dance"] },
  { slug: "music", subjects: ["music", "music technology"] },
  { slug: "art-and-design", subjects: ["fine art", "visual arts", "art"] },
  { slug: "design-studies", subjects: ["graphic design", "product design", "design"] },
  { slug: "media-studies-and-production", subjects: ["film", "media production", "broadcasting"] },
  { slug: "english-studies", subjects: ["creative writing", "english literature", "literature"] },
  { slug: "computer-science", subjects: ["computer science", "software engineering", "computing"] },
  { slug: "engineering", subjects: ["engineering", "mechanical", "electrical", "civil"] },
  { slug: "business-and-management", subjects: ["business", "management", "marketing"] },
  { slug: "biological-sciences", subjects: ["biology", "chemistry", "physics", "sciences"] },
  { slug: "medicine", subjects: ["medicine", "nursing", "healthcare"] },
  { slug: "law", subjects: ["law", "legal studies", "criminology"] },
  { slug: "social-sciences", subjects: ["psychology", "sociology", "politics"] },
  { slug: "historical-philosophical-and-religious-studies", subjects: ["history", "philosophy", "theology"] },
  { slug: "architecture-building-and-planning", subjects: ["architecture", "urban planning"] },
  { slug: "education-and-teaching", subjects: ["education", "teaching", "PGCE"] },
  { slug: "sport-and-exercise-sciences", subjects: ["sport science", "exercise science", "coaching"] },
  { slug: "hospitality-leisure-recreation-and-tourism", subjects: ["hospitality", "tourism", "event management"] },
  { slug: "agriculture-food-and-related-studies", subjects: ["agriculture", "environmental management", "conservation"] },
];

// ─── LD+JSON extraction ──────────────────────────────────────────────────────
function extractFromLdJson(page, ldJsonBlocks) {
  const courses = [];
  for (const block of ldJsonBlocks) {
    try {
      const ld = JSON.parse(block);
      const items = Array.isArray(ld) ? ld : [ld];
      for (const item of items) {
        if (item["@type"] !== "Course" && item["@type"] !== "EducationalOccupationalProgram") continue;
        const provider = item.provider || item.offers?.offeredBy || {};
        courses.push({
          title: item.name,
          institution: provider.name || provider.legalName || "",
          country: "UK",
          city: provider.address?.addressLocality || "",
          level: item.educationalLevel || item.coursePrerequisites || "",
          mode: item.courseMode || item.deliveryMode || "",
          duration: item.timeRequired || item.duration || null,
          entryReqs: item.coursePrerequisites || null,
          sourceUrl: item.url || null,
          sourceCourseId: item.courseCode || null,
          subjects: [],
          feeHome: null,
          feeIntl: null,
          online: false,
          free: false,
          careerPaths: [],
        });
      }
    } catch (_) { /* skip malformed JSON-LD */ }
  }
  return courses;
}

// ─── DOM fallback parsing ────────────────────────────────────────────────────
async function parseCoursePage(page) {
  return page.evaluate(() => {
    const courses = [];
    const cards = document.querySelectorAll(
      '[class*="course-card"], [class*="search-result"], [data-testid="course-result"], .results-list > li, .course-result'
    );

    cards.forEach((card) => {
      const titleEl = card.querySelector(
        'h2, h3, h4, [class*="course-title"], [class*="courseName"], [data-testid="course-title"]'
      );
      const providerEl = card.querySelector(
        '[class*="provider"], [class*="institution"], [data-testid="provider-name"]'
      );
      const locationEl = card.querySelector(
        '[class*="location"], [class*="campus"], [data-testid="location"]'
      );
      const qualEl = card.querySelector(
        '[class*="qualification"], [class*="qual"], [data-testid="qualification"]'
      );
      const codeEl = card.querySelector(
        '[class*="ucas-code"], [class*="courseCode"], [data-testid="ucas-code"]'
      );
      const modeEl = card.querySelector(
        '[class*="study-mode"], [class*="studyMode"], [data-testid="study-mode"]'
      );
      const durationEl = card.querySelector(
        '[class*="duration"], [data-testid="duration"]'
      );
      const entryEl = card.querySelector(
        '[class*="entry-req"], [class*="tariff"], [data-testid="entry-requirements"]'
      );
      const linkEl = card.querySelector("a[href]");

      const title = titleEl?.textContent?.trim();
      if (!title) return;

      courses.push({
        title,
        institution: providerEl?.textContent?.trim() || "",
        city: locationEl?.textContent?.trim() || "",
        qualification: qualEl?.textContent?.trim() || "",
        sourceCourseId: codeEl?.textContent?.trim() || null,
        mode: modeEl?.textContent?.trim() || "",
        duration: durationEl?.textContent?.trim() || null,
        entryReqs: entryEl?.textContent?.trim() || null,
        sourceUrl: linkEl?.href || null,
      });
    });

    return courses;
  });
}

// ─── Scrape a single subject area ────────────────────────────────────────────
async function scrapeSubjectArea(browser, subjectArea, limit, totalSoFar) {
  const courses = [];
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ "User-Agent": UA });

  let pageNum = 1;
  try {
    while (pageNum <= MAX_PAGES) {
      if (limit && (totalSoFar + courses.length) >= limit) break;

      await limiter.wait();
      const url = `${BASE_URL}/results/courses?searchTerm=${subjectArea.slug}&page=${pageNum}`;
      logger.info("ucas", `Fetching ${url}`, { page: pageNum });

      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      } catch (navErr) {
        logger.warn("ucas", `Navigation timeout for ${subjectArea.slug} page ${pageNum}: ${navErr.message}`);
        break;
      }

      // Wait for results to render
      try {
        await page.waitForSelector(
          '[class*="course-card"], [class*="search-result"], [data-testid="course-result"], .results-list > li, .course-result',
          { timeout: 10000 }
        );
      } catch (_) {
        // No results found — end of listings
        logger.info("ucas", `No results for ${subjectArea.slug} page ${pageNum}, stopping`);
        break;
      }

      // Try LD+JSON first
      const ldJsonBlocks = await page.evaluate(() => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        return Array.from(scripts).map((s) => s.textContent);
      });

      let pageCourses = extractFromLdJson(page, ldJsonBlocks);

      // Fall back to DOM parsing if LD+JSON yielded nothing
      if (pageCourses.length === 0) {
        const domResults = await parseCoursePage(page);
        pageCourses = domResults.map((r) => ({
          title: r.title,
          institution: r.institution,
          country: "UK",
          city: r.city,
          level: r.qualification || "",
          mode: r.mode,
          duration: r.duration,
          entryReqs: r.entryReqs,
          sourceUrl: r.sourceUrl,
          sourceCourseId: r.sourceCourseId,
          subjects: [],
          feeHome: null,
          feeIntl: null,
          online: false,
          free: false,
          careerPaths: [],
        }));
      }

      if (pageCourses.length === 0) {
        logger.info("ucas", `Empty page for ${subjectArea.slug} at page ${pageNum}, stopping`);
        break;
      }

      // Inject subject context and country
      for (const c of pageCourses) {
        c.country = c.country || "UK";
        c.subjects = c.subjects.length > 0 ? c.subjects : [...subjectArea.subjects];
        courses.push(c);
      }

      logger.info("ucas", `Scraped ${subjectArea.slug} page ${pageNum}`, {
        pageResults: pageCourses.length,
        subjectTotal: courses.length,
      });

      // Check for next page
      const hasNext = await page.evaluate(() => {
        const next = document.querySelector(
          '[class*="next-page"], [aria-label="Next page"], a[rel="next"], [data-testid="pagination-next"]'
        );
        return next && !next.hasAttribute("disabled") && !next.classList.contains("disabled");
      });

      if (!hasNext) break;
      pageNum++;
    }
  } catch (err) {
    logger.error("ucas", `Error scraping ${subjectArea.slug}: ${err.message}`);
  } finally {
    await page.close();
  }

  return courses;
}

// ─── Main runner ─────────────────────────────────────────────────────────────
async function run({ limit } = {}) {
  logger.info("ucas", "Starting UCAS scrape", { limit });

  let chromium;
  try {
    chromium = require("playwright").chromium;
  } catch (e) {
    logger.error("ucas", "Playwright not installed. Run: npm i playwright");
    throw new Error("Playwright is required for the UCAS scraper");
  }

  const browser = await chromium.launch({ headless: true });
  const allRaw = [];

  try {
    for (const subjectArea of SUBJECT_AREAS) {
      if (limit && allRaw.length >= limit) break;

      const results = await scrapeSubjectArea(browser, subjectArea, limit, allRaw.length);
      allRaw.push(...results);

      logger.info("ucas", `Completed ${subjectArea.slug}`, {
        subjectResults: results.length,
        runningTotal: allRaw.length,
      });
    }
  } finally {
    await browser.close();
  }

  logger.info("ucas", `Raw courses collected`, { total: allRaw.length });

  // Normalise, classify, score, fingerprint
  const processed = allRaw.map((raw) => {
    const normalised = normaliseCourse(raw, "ucas");
    const classification = classify(normalised);
    const quality = scoreQuality({ ...normalised, domain: classification.domain });
    const fingerprint = generateFingerprint(normalised);

    return {
      ...normalised,
      domain: classification.domain,
      confidence_score: classification.confidence,
      data_quality_score: quality,
      fingerprint,
      source: "ucas",
    };
  });

  // Deduplicate within this batch
  const seen = new Set();
  const deduped = processed.filter((c) => {
    if (seen.has(c.fingerprint)) return false;
    seen.add(c.fingerprint);
    return true;
  });

  logger.info("ucas", `Scrape complete`, {
    processed: processed.length,
    afterDedup: deduped.length,
    removed: processed.length - deduped.length,
  });

  return deduped;
}

module.exports = { run };
