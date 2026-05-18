/**
 * Affordability + ROI scoring.
 *
 * affordability score = lower-is-better total cost in GBP for one academic year.
 *   = (fee_for_status) + (monthly COL × 9) — proxy for a UK academic year.
 *
 * roi score = (5-year median salary - total degree cost) in GBP, expressed
 *   per £1k. Higher = better return. Requires a salary signal joined from
 *   the career-pathways lake.
 */

function pickFee(course, status) {
  if (status === "international" && course.fee_intl != null) return Number(course.fee_intl);
  if (status === "ruk" && course.fee_scotland != null) return Number(course.fee_scotland);
  if (course.fee_home != null) return Number(course.fee_home);
  if (course.feesUkGbp != null) return Number(course.feesUkGbp);
  return null;
}

function pickColMonthly(col) {
  if (!col) return null;
  if (col.total_estimated_monthly_gbp != null) return Number(col.total_estimated_monthly_gbp);
  const parts = ["rent", "food", "transport", "utilities", "misc"]
    .map((k) => (col[k] != null ? Number(col[k]) : 0))
    .filter((n) => Number.isFinite(n));
  if (!parts.length) return null;
  return parts.reduce((a, b) => a + b, 0);
}

function durationYears(course) {
  if (course.duration && /year/i.test(course.duration)) {
    const m = course.duration.match(/(\d+(?:\.\d+)?)\s*year/i);
    if (m) return Number(m[1]);
  }
  if (course.duration_months) return Number(course.duration_months) / 12;
  if (course.level === "postgraduate") return 1;
  if (course.level === "certificate" || course.is_free || course.free) return 0.5;
  return 3; // default UG length
}

function affordabilityYear({ course, col, status }) {
  const fee = pickFee(course, status) ?? 0;
  const monthlyCol = pickColMonthly(col) ?? 0;
  const yearCol = monthlyCol * 9; // academic year
  return Math.round(fee + yearCol);
}

function affordabilityTotal({ course, col, status }) {
  const fee = pickFee(course, status) ?? 0;
  const monthlyCol = pickColMonthly(col) ?? 0;
  const yearCol = monthlyCol * 9;
  const years = durationYears(course);
  return Math.round((fee + yearCol) * years);
}

/**
 * ROI = 5-year salary - total degree cost. salary5yr from career-pathways lake.
 * Returns null if no salary signal available.
 */
function roiScore({ course, col, status, careerPathway }) {
  if (!careerPathway) return null;
  const salary5 =
    careerPathway.salary5yrGbp ??
    careerPathway.salaryFiveYrGbp ??
    (careerPathway.medianSalaryGbp ? careerPathway.medianSalaryGbp * 5 : null);
  if (!Number.isFinite(salary5)) return null;
  const total = affordabilityTotal({ course, col, status });
  return Math.round(salary5 - total);
}

module.exports = {
  pickFee,
  pickColMonthly,
  durationYears,
  affordabilityYear,
  affordabilityTotal,
  roiScore,
};
