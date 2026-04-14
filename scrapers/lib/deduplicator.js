/**
 * Generates fingerprints for course deduplication across sources.
 * SHA-256 of normalised title + institution + level + country.
 */
const crypto = require("crypto");

const DEGREE_PREFIXES = /^(ba|bsc|bfa|beng|llb|ma|msc|mfa|mba|meng|mphil|mres|phd|dphil|pgce|pgdip|hnd|hnc)\s+/i;
const INST_PREFIXES = /^(university of|the|college of)\s+/i;
const TRAILING = /\s*\(hons\)|\s*\(honours\)|\s*\(online\)|\s*\(free\)/gi;

function normaliseForFingerprint(title) {
  return String(title)
    .toLowerCase()
    .trim()
    .replace(DEGREE_PREFIXES, "")
    .replace(TRAILING, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normaliseInstitution(inst) {
  return String(inst)
    .toLowerCase()
    .trim()
    .replace(INST_PREFIXES, "")
    .replace(/\s+/g, " ")
    .trim();
}

function generateFingerprint(course) {
  const parts = [
    normaliseForFingerprint(course.title),
    normaliseInstitution(course.institution),
    (course.level || "").toLowerCase(),
    (course.country || "").toLowerCase(),
  ].join("|");

  return crypto.createHash("sha256").update(parts).digest("hex");
}

async function checkDuplicate(pool, fingerprint) {
  const result = await pool.query(
    "SELECT course_id FROM course_dedup_index WHERE fingerprint = $1",
    [fingerprint]
  );
  return result.rows.length > 0 ? result.rows[0].course_id : null;
}

async function registerFingerprint(pool, courseId, fingerprint, titleNorm) {
  await pool.query(
    `INSERT INTO course_dedup_index (course_id, fingerprint, title_norm)
     VALUES ($1, $2, $3)
     ON CONFLICT (fingerprint) DO NOTHING`,
    [courseId, fingerprint, titleNorm]
  );
}

module.exports = {
  generateFingerprint,
  checkDuplicate,
  registerFingerprint,
  normaliseForFingerprint,
};
