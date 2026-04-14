/**
 * Normalises scraped course data into the canonical MCM schema.
 */

function normaliseTitle(raw) {
  if (!raw) return "";
  return raw
    .replace(/<[^>]*>/g, "") // strip HTML
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 255);
}

function normaliseFee(raw) {
  if (!raw || raw === "Free" || raw === "free" || raw === "0") return 0;
  if (typeof raw === "number") return raw;
  // Extract numeric value from strings like "£9,250", "EUR 2,000/year", "$30,000 per year"
  const cleaned = String(raw).replace(/[£$€,]/g, "").replace(/per\s*(year|annum|yr)/i, "");
  const match = cleaned.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

function normaliseDuration(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase().trim();
  // "4 semesters" → "2 years"
  const semMatch = s.match(/(\d+)\s*semester/);
  if (semMatch) return `${Math.ceil(parseInt(semMatch[1]) / 2)} years`;
  // "120 ECTS" → roughly "2 years"
  const ectsMatch = s.match(/(\d+)\s*ects/i);
  if (ectsMatch) return `${Math.ceil(parseInt(ectsMatch[1]) / 60)} years`;
  // "3 years", "1 year", "12 months", "6-12 months", "Self-paced"
  if (/self.?paced/i.test(s)) return "Self-paced";
  return raw.trim();
}

function normaliseLevel(raw) {
  if (!raw) return "undergraduate";
  const s = String(raw).toLowerCase();
  if (/postgrad|master|msc|ma\b|mba|phd|doctor|mphil|mres/i.test(s)) return "postgraduate";
  if (/undergrad|bachelor|bsc|ba\b|bfa|beng|llb/i.test(s)) return "undergraduate";
  if (/certif|diploma|micro|nanodegree|mooc|short/i.test(s)) return "certificate";
  return "undergraduate";
}

function normaliseMode(raw) {
  if (!raw) return ["full-time"];
  const modes = [];
  const s = Array.isArray(raw) ? raw.join(" ") : String(raw).toLowerCase();
  if (/full.?time/i.test(s)) modes.push("full-time");
  if (/part.?time/i.test(s)) modes.push("part-time");
  if (/online|remote|distance|self.?paced/i.test(s)) modes.push("online");
  if (/face.?to.?face|campus|on.?site|in.?person/i.test(s)) modes.push("face-to-face");
  if (/blend/i.test(s)) modes.push("online", "face-to-face");
  return modes.length ? [...new Set(modes)] : ["full-time"];
}

function normaliseSubjects(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((s) => s.toLowerCase().trim()).filter(Boolean);
  return String(raw)
    .split(/[,;|]/)
    .map((s) => s.toLowerCase().trim())
    .filter((s) => s.length > 1);
}

function normaliseCountry(raw) {
  if (!raw) return "Unknown";
  const map = {
    "united kingdom": "UK", uk: "UK", england: "UK",
    "united states": "USA", "united states of america": "USA", us: "USA",
    deutschland: "Germany", france: "France", italia: "Italy", italy: "Italy",
    espana: "Spain", spain: "Spain", nederland: "Netherlands", netherlands: "Netherlands",
    schweiz: "Switzerland", suisse: "Switzerland", switzerland: "Switzerland",
    sverige: "Sweden", sweden: "Sweden", danmark: "Denmark", denmark: "Denmark",
    suomi: "Finland", finland: "Finland", norge: "Norway", norway: "Norway",
  };
  const lower = String(raw).toLowerCase().trim();
  return map[lower] || raw.trim();
}

function normaliseCourse(raw, source) {
  return {
    title: normaliseTitle(raw.title),
    institution: raw.institution || raw.institution_key || raw.provider || "",
    country: normaliseCountry(raw.country),
    city: raw.city || raw.location || "",
    level: normaliseLevel(raw.level || raw.qualification),
    mode: normaliseMode(raw.mode || raw.studyMode),
    subjects: normaliseSubjects(raw.subjects || raw.keywords || raw.tags),
    feeHome: normaliseFee(raw.feeHome || raw.fee_home || raw.tuitionFee),
    feeIntl: normaliseFee(raw.feeIntl || raw.fee_intl || raw.internationalFee),
    feeScotland: normaliseFee(raw.feeScotland || raw.fee_scotland) || null,
    livingCost: normaliseFee(raw.livingCost || raw.living_cost) || null,
    duration: normaliseDuration(raw.duration),
    ranking: parseInt(raw.ranking) || null,
    entryReqs: raw.entryReqs || raw.entry_reqs || raw.requirements || null,
    careerPaths: Array.isArray(raw.careerPaths) ? raw.careerPaths : [],
    avgSalary: raw.avgSalary || raw.salary || null,
    employability: parseInt(raw.employability) || null,
    online: Boolean(raw.online || raw.is_online),
    free: Boolean(raw.free || raw.is_free),
    sourceUrl: raw.sourceUrl || raw.url || null,
    sourceCourseId: raw.sourceCourseId || raw.courseCode || null,
  };
}

module.exports = {
  normaliseCourse,
  normaliseTitle,
  normaliseFee,
  normaliseDuration,
  normaliseLevel,
  normaliseMode,
  normaliseSubjects,
  normaliseCountry,
};
