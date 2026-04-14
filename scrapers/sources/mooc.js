/**
 * MOOC Scraper — Coursera, edX, FutureLearn
 * Uses public APIs and HTML scraping for free/online course data.
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

const limiter = new RateLimiter(config.sources.mooc.rateLimit);
const headers = { "User-Agent": config.sources.mooc.userAgent };

// ─── Coursera ────────────────────────────────────────────────────────────────
async function scrapeCoursera(limit) {
  const courses = [];
  const subjects = [
    "computer-science", "data-science", "business", "arts-and-humanities",
    "social-sciences", "health", "math-and-logic", "physical-science-and-engineering",
    "information-technology", "language-learning", "personal-development",
  ];

  for (const subject of subjects) {
    if (limit && courses.length >= limit) break;
    try {
      await limiter.wait();
      const url = `https://www.coursera.org/courses?query=${subject}&page=1&index=prod_all_products_term_optimization`;
      const { data } = await axios.get(url, { headers, timeout: 15000 });
      const $ = cheerio.load(data);

      // Coursera renders course cards with structured data
      $('script[type="application/ld+json"]').each((_, el) => {
        try {
          const ld = JSON.parse($(el).html());
          if (ld["@type"] === "Course" || (Array.isArray(ld) && ld[0]?.["@type"] === "Course")) {
            const items = Array.isArray(ld) ? ld : [ld];
            for (const item of items) {
              if (limit && courses.length >= limit) return;
              courses.push({
                title: item.name,
                institution: item.provider?.name || "Coursera",
                country: "Online",
                city: "Online",
                level: "certificate",
                mode: ["online", "self-paced"],
                subjects: [subject.replace(/-/g, " ")],
                feeHome: 0,
                feeIntl: 0,
                online: true,
                free: item.isAccessibleForFree || false,
                duration: item.timeRequired || "Self-paced",
                sourceUrl: item.url,
                sourceCourseId: item.courseCode || null,
                entryReqs: "None. Open enrolment.",
                careerPaths: [],
                avgSalary: null,
                employability: null,
              });
            }
          }
        } catch (e) { /* skip malformed JSON-LD */ }
      });

      // Fallback: parse visible course cards
      $('[data-testid="product-card"], .cds-ProductCard-base').each((_, el) => {
        if (limit && courses.length >= limit) return;
        const title = $(el).find('h3, [data-testid="product-card-title"]').text().trim();
        const provider = $(el).find('[data-testid="product-card-partner-name"], .partner-name').text().trim();
        const link = $(el).find("a").attr("href");
        if (title && !courses.find((c) => c.title === title)) {
          courses.push({
            title,
            institution: provider || "Coursera",
            country: "Online",
            city: "Online",
            level: "certificate",
            mode: ["online", "self-paced"],
            subjects: [subject.replace(/-/g, " ")],
            feeHome: 0,
            feeIntl: 0,
            online: true,
            free: false,
            duration: "Self-paced",
            sourceUrl: link ? `https://www.coursera.org${link}` : null,
            entryReqs: "None. Open enrolment.",
            careerPaths: [],
          });
        }
      });

      logger.info("mooc", `Coursera: scraped ${subject}`, { count: courses.length });
    } catch (err) {
      logger.warn("mooc", `Coursera: failed to scrape ${subject}: ${err.message}`);
    }
  }
  return courses;
}

// ─── edX ─────────────────────────────────────────────────────────────────────
async function scrapeEdx(limit) {
  const courses = [];
  const subjects = [
    "computer-science", "data-science", "business-management", "engineering",
    "humanities", "science", "social-sciences", "health-safety", "art-culture",
    "education-teacher-training", "environmental-studies", "law", "mathematics",
  ];

  for (const subject of subjects) {
    if (limit && courses.length >= limit) break;
    try {
      await limiter.wait();
      const url = `https://www.edx.org/search?q=${subject}&tab=course`;
      const { data } = await axios.get(url, { headers, timeout: 15000 });
      const $ = cheerio.load(data);

      // edX embeds course data in Next.js __NEXT_DATA__
      const nextData = $('script#__NEXT_DATA__').html();
      if (nextData) {
        try {
          const parsed = JSON.parse(nextData);
          const products = parsed?.props?.pageProps?.results || [];
          for (const p of products) {
            if (limit && courses.length >= limit) break;
            courses.push({
              title: p.title || p.name,
              institution: p.owners?.[0]?.name || p.partner || "edX",
              country: "Online",
              city: "Online",
              level: p.type === "Masters" ? "postgraduate" : "certificate",
              mode: ["online", "self-paced"],
              subjects: [subject.replace(/-/g, " ")],
              feeHome: 0,
              feeIntl: 0,
              online: true,
              free: p.activeCourseRun?.isEnrollable && !p.activeCourseRun?.isPaid,
              duration: p.activeCourseRun?.weeksToComplete
                ? `${p.activeCourseRun.weeksToComplete} weeks`
                : "Self-paced",
              sourceUrl: p.cardUrl ? `https://www.edx.org${p.cardUrl}` : null,
              entryReqs: "None. Open enrolment.",
              careerPaths: [],
            });
          }
        } catch (e) { /* skip parse errors */ }
      }

      logger.info("mooc", `edX: scraped ${subject}`, { count: courses.length });
    } catch (err) {
      logger.warn("mooc", `edX: failed to scrape ${subject}: ${err.message}`);
    }
  }
  return courses;
}

// ─── FutureLearn ──────────────────────────────────────────────────────────────
async function scrapeFutureLearn(limit) {
  const courses = [];
  const categories = [
    "business-and-management", "creative-arts-and-media", "healthcare-and-medicine",
    "history", "it-and-computer-science", "language-and-cultures",
    "law", "literature", "nature-and-environment", "politics-and-society",
    "psychology-and-mental-health", "science-engineering-and-maths", "teaching",
  ];

  for (const cat of categories) {
    if (limit && courses.length >= limit) break;
    try {
      await limiter.wait();
      const url = `https://www.futurelearn.com/courses/${cat}`;
      const { data } = await axios.get(url, { headers, timeout: 15000 });
      const $ = cheerio.load(data);

      $(".m-card, .CourseCard, [data-testid='course-card']").each((_, el) => {
        if (limit && courses.length >= limit) return;
        const title = $(el).find("h3, .m-card__title, .CourseCard-title").text().trim();
        const provider = $(el).find(".m-card__org, .CourseCard-org").text().trim();
        const link = $(el).find("a").attr("href");
        const duration = $(el).find(".m-card__duration, .CourseCard-duration").text().trim();

        if (title) {
          courses.push({
            title,
            institution: provider || "FutureLearn",
            country: "Online",
            city: "Online",
            level: "certificate",
            mode: ["online", "part-time"],
            subjects: [cat.replace(/-/g, " ")],
            feeHome: 0,
            feeIntl: 0,
            online: true,
            free: true,
            duration: duration || "4-8 weeks",
            sourceUrl: link ? `https://www.futurelearn.com${link}` : null,
            entryReqs: "None. Open enrolment.",
            careerPaths: [],
          });
        }
      });

      logger.info("mooc", `FutureLearn: scraped ${cat}`, { count: courses.length });
    } catch (err) {
      logger.warn("mooc", `FutureLearn: failed to scrape ${cat}: ${err.message}`);
    }
  }
  return courses;
}

// ─── Main runner ──────────────────────────────────────────────────────────────
async function run({ limit } = {}) {
  logger.info("mooc", "Starting MOOC scrape", { limit });
  const perSource = limit ? Math.ceil(limit / 3) : null;

  const [coursera, edx, futurelearn] = await Promise.all([
    scrapeCoursera(perSource).catch((e) => { logger.error("mooc", `Coursera failed: ${e.message}`); return []; }),
    scrapeEdx(perSource).catch((e) => { logger.error("mooc", `edX failed: ${e.message}`); return []; }),
    scrapeFutureLearn(perSource).catch((e) => { logger.error("mooc", `FutureLearn failed: ${e.message}`); return []; }),
  ]);

  const allRaw = [...coursera, ...edx, ...futurelearn];
  logger.info("mooc", `Raw courses collected`, {
    coursera: coursera.length,
    edx: edx.length,
    futurelearn: futurelearn.length,
    total: allRaw.length,
  });

  // Normalise, classify, score, fingerprint
  const processed = allRaw.map((raw) => {
    const normalised = normaliseCourse(raw, "mooc");
    const classification = classify(normalised);
    const quality = scoreQuality({ ...normalised, domain: classification.domain });
    const fingerprint = generateFingerprint(normalised);

    return {
      ...normalised,
      domain: classification.domain,
      confidence_score: classification.confidence,
      data_quality_score: quality,
      fingerprint,
      source: "mooc",
    };
  });

  // Deduplicate within this batch
  const seen = new Set();
  const deduped = processed.filter((c) => {
    if (seen.has(c.fingerprint)) return false;
    seen.add(c.fingerprint);
    return true;
  });

  logger.info("mooc", `Scrape complete`, {
    processed: processed.length,
    afterDedup: deduped.length,
    removed: processed.length - deduped.length,
  });

  return deduped;
}

module.exports = { run };
