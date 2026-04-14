/**
 * Scores course data quality on a 0.0 to 1.0 scale.
 * Higher scores = more complete and useful data.
 */

function scoreQuality(course) {
  let score = 0;
  const maxScore = 100;

  // Required fields present (40%)
  if (course.title && course.title.length > 3) score += 8;
  if (course.institution && course.institution.length > 1) score += 8;
  if (course.country) score += 6;
  if (course.city) score += 6;
  if (course.level) score += 6;
  if (course.domain) score += 6;

  // Fee data (20%)
  if (course.feeHome != null || course.feeIntl != null) score += 12;
  if (course.feeHome != null && course.feeIntl != null) score += 8;

  // Rich data (20%)
  if (course.entryReqs && course.entryReqs.length > 10) score += 5;
  if (course.careerPaths && course.careerPaths.length > 0) score += 5;
  if (course.avgSalary) score += 5;
  if (course.employability) score += 5;

  // Subjects (10%)
  if (course.subjects && course.subjects.length >= 3) score += 10;
  else if (course.subjects && course.subjects.length >= 1) score += 5;

  // Duration (10%)
  if (course.duration) score += 10;

  return Math.round((score / maxScore) * 100) / 100;
}

module.exports = { scoreQuality };
