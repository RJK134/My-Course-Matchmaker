/**
 * QS & THE Ranked-Programme Scraper
 * QS: uses Playwright to intercept XHR/API responses from the programme finder.
 * THE: uses Cheerio to parse ranking pages.
 * Rate limit: 3000 ms between requests.
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

const cfg = config.sources.qs_the;
const limiter = new RateLimiter(cfg.rateLimit);
const headers = { "User-Agent": cfg.userAgent };

// ─── QS Programme Finder (Playwright + XHR interception) ────────────────────
async function scrapeQS(limit) {
  const courses = [];

  let chromium;
  try {
    chromium = require("playwright").chromium;
  } catch (err) {
    logger.error("qs-the", "Playwright is not installed -- skipping QS scrape", {
      hint: "npm install playwright && npx playwright install chromium",
    });
    return courses;
  }

  const subjects = [
    "computer-science", "business", "engineering", "social-sciences",
    "arts-humanities", "life-sciences", "natural-sciences", "medicine",
    "law", "education", "economics", "mathematics",
  ];

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: cfg.userAgent,
      locale: "en-GB",
    });

    for (const subject of subjects) {
      if (limit && courses.length >= limit) break;

      const page = await context.newPage();

      // Collect JSON payloads that the QS programme finder fetches via XHR
      const intercepted = [];
      page.on("response", async (response) => {
        const url = response.url();
        if (
          response.request().resourceType() === "xhr" &&
          (url.includes("/programs") || url.includes("/api/") || url.includes("search"))
        ) {
          try {
            const json = await response.json();
            intercepted.push(json);
          } catch (_) { /* not JSON -- ignore */ }
        }
      });

      try {
        await limiter.wait();
        const url = `${cfg.qsUrl}?subject=${subject}`;
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

        // Give the SPA a moment to fire deferred API calls
        await page.waitForTimeout(3000);

        // ── Extract from intercepted API responses ──────────────────────
        for (const payload of intercepted) {
          const items = Array.isArray(payload)
            ? payload
            : payload.data || payload.results || payload.programs || [];

          if (!Array.isArray(items)) continue;

          for (const item of items) {
            if (limit && courses.length >= limit) break;

            const title = item.title || item.name || item.program_name;
            if (!title) continue;

            courses.push({
              title,
              institution:
                item.university || item.institution || item.uni_name || "",
              country: item.country || item.location?.country || "",
              city: item.city || item.location?.city || "",
              level: item.level || item.degree_level || "undergraduate",
              mode: item.mode || item.study_mode || null,
              subjects: [subject.replace(/-/g, " ")],
              ranking: item.ranking || item.rank || item.qs_rank || null,
              duration: item.duration || item.length || null,
              feeHome: item.tuition_fee || item.fee || null,
              feeIntl: item.international_fee || item.fee_intl || null,
              online: false,
              free: false,
              sourceUrl: item.url
                ? (item.url.startsWith("http") ? item.url : `https://www.topuniversities.com${item.url}`)
                : null,
              sourceCourseId: item.id || item.nid || null,
              entryReqs: item.entry_requirements || item.requirements || null,
              careerPaths: [],
            });
          }
        }

        // ── Fallback: scrape the rendered DOM ───────────────────────────
        if (intercepted.length === 0) {
          const html = await page.content();
          const $ = cheerio.load(html);

          $('[class*="program-card"], [class*="ProgramCard"], [data-program]').each(
            (_, el) => {
              if (limit && courses.length >= limit) return;

              const title = $(el)
                .find('h3, h2, [class*="title"], [class*="name"]')
                .first()
                .text()
                .trim();
              const institution = $(el)
                .find('[class*="university"], [class*="institution"], [class*="uni"]')
                .first()
                .text()
                .trim();
              const country = $(el)
                .find('[class*="country"], [class*="location"]')
                .first()
                .text()
                .trim();
              const rankText = $(el)
                .find('[class*="rank"]')
                .first()
                .text()
                .trim();
              const link = $(el).find("a").attr("href");

              if (title && !courses.find((c) => c.title === title && c.institution === institution)) {
                courses.push({
                  title,
                  institution: institution || "",
                  country: country || "",
                  city: "",
                  level: "undergraduate",
                  subjects: [subject.replace(/-/g, " ")],
                  ranking: parseInt(rankText) || null,
                  duration: null,
                  feeHome: null,
                  feeIntl: null,
                  online: false,
                  free: false,
                  sourceUrl: link
                    ? (link.startsWith("http") ? link : `https://www.topuniversities.com${link}`)
                    : null,
                  entryReqs: null,
                  careerPaths: [],
                });
              }
            }
          );
        }

        logger.info("qs-the", `QS: scraped subject ${subject}`, {
          count: courses.length,
        });
      } catch (err) {
        logger.warn("qs-the", `QS: failed to scrape ${subject}: ${err.message}`);
      } finally {
        await page.close();
      }
    }
  } catch (err) {
    logger.error("qs-the", `QS browser error: ${err.message}`);
  } finally {
    if (browser) await browser.close();
  }

  return courses;
}

// ─── THE World University Rankings (Cheerio) ────────────────────────────────
async function scrapeTHE(limit) {
  const courses = [];

  // THE ranking pages by subject area
  const subjectSlugs = [
    "computer-science",
    "business-and-economics",
    "engineering-and-technology",
    "arts-and-humanities",
    "clinical-and-health",
    "education",
    "law",
    "life-sciences",
    "physical-sciences",
    "psychology",
    "social-sciences",
  ];

  for (const slug of subjectSlugs) {
    if (limit && courses.length >= limit) break;

    try {
      await limiter.wait();
      const url = `${cfg.theUrl}/by-subject/${slug}`;
      const { data } = await axios.get(url, { headers, timeout: 20000 });
      const $ = cheerio.load(data);

      // THE embeds ranking data inside a Next.js / Nuxt payload
      const scriptData = $('script[type="application/ld+json"]').html();
      if (scriptData) {
        try {
          const ld = JSON.parse(scriptData);
          const items = Array.isArray(ld) ? ld : ld.itemListElement || [];
          for (const item of items) {
            if (limit && courses.length >= limit) break;
            const uni = item.item || item;
            courses.push({
              title: `${slug.replace(/-/g, " ")} programme`,
              institution: uni.name || "",
              country: uni.addressCountry || uni.location || "",
              city: uni.addressLocality || "",
              level: "undergraduate",
              subjects: [slug.replace(/-/g, " ")],
              ranking: parseInt(uni.rank || item.position) || null,
              duration: null,
              feeHome: null,
              feeIntl: null,
              online: false,
              free: false,
              sourceUrl: uni.url || null,
              entryReqs: null,
              careerPaths: [],
            });
          }
        } catch (_) { /* malformed JSON-LD */ }
      }

      // Fallback: parse the visible ranking table rows
      $(
        'table tbody tr, [class*="ranking-row"], [class*="RankingRow"], [data-ranking]'
      ).each((_, el) => {
        if (limit && courses.length >= limit) return;

        const cells = $(el).find("td");
        const rankText = cells.eq(0).text().trim() || $(el).find('[class*="rank"]').text().trim();
        const name =
          cells.eq(1).text().trim() ||
          $(el).find('[class*="name"], [class*="university"]').first().text().trim();
        const country =
          cells.eq(2).text().trim() ||
          $(el).find('[class*="country"], [class*="location"]').first().text().trim();
        const link = $(el).find("a").attr("href");

        if (name && !courses.find((c) => c.institution === name && c.subjects[0] === slug.replace(/-/g, " "))) {
          courses.push({
            title: `${slug.replace(/-/g, " ")} programme`,
            institution: name,
            country: country || "",
            city: "",
            level: "undergraduate",
            subjects: [slug.replace(/-/g, " ")],
            ranking: parseInt(rankText) || null,
            duration: null,
            feeHome: null,
            feeIntl: null,
            online: false,
            free: false,
            sourceUrl: link
              ? (link.startsWith("http") ? link : `https://www.timeshighereducation.com${link}`)
              : null,
            entryReqs: null,
            careerPaths: [],
          });
        }
      });

      logger.info("qs-the", `THE: scraped ${slug}`, { count: courses.length });
    } catch (err) {
      logger.warn("qs-the", `THE: failed to scrape ${slug}: ${err.message}`);
    }
  }

  return courses;
}

// ─── Main runner ────────────────────────────────────────────────────────────
async function run({ limit } = {}) {
  logger.info("qs-the", "Starting QS/THE ranked-programme scrape", { limit });
  const perSource = limit ? Math.ceil(limit / 2) : null;

  const [qs, the] = await Promise.all([
    scrapeQS(perSource).catch((e) => {
      logger.error("qs-the", `QS scrape failed: ${e.message}`);
      return [];
    }),
    scrapeTHE(perSource).catch((e) => {
      logger.error("qs-the", `THE scrape failed: ${e.message}`);
      return [];
    }),
  ]);

  const allRaw = [...qs, ...the];
  logger.info("qs-the", "Raw programmes collected", {
    qs: qs.length,
    the: the.length,
    total: allRaw.length,
  });

  // Normalise, classify, score, fingerprint
  const processed = allRaw.map((raw) => {
    const normalised = normaliseCourse(raw, "qs-the");
    const classification = classify(normalised);
    const quality = scoreQuality({ ...normalised, domain: classification.domain });
    const fingerprint = generateFingerprint(normalised);

    return {
      ...normalised,
      domain: classification.domain,
      confidence_score: classification.confidence,
      data_quality_score: quality,
      fingerprint,
      source: "qs-the",
    };
  });

  // Deduplicate within this batch
  const seen = new Set();
  const deduped = processed.filter((c) => {
    if (seen.has(c.fingerprint)) return false;
    seen.add(c.fingerprint);
    return true;
  });

  logger.info("qs-the", "Scrape complete", {
    processed: processed.length,
    afterDedup: deduped.length,
    removed: processed.length - deduped.length,
  });

  return deduped;
}

module.exports = { run };
