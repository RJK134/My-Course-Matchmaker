# Copilot Code Review Instructions for MyCourseMatchmaker

## Project Context
MyCourseMatchmaker is a course-matching platform for Future Horizons Education. It matches prospective students to university courses based on interests, nationality, and preferences — with nationality-based fee calculations, cost-of-living data, and funding source links.

## Review Focus Areas

### Critical — Always Flag
- **Fee calculation logic**: Any change to `nationalityResolver.js`, `detFeeStatus()`, `getFee()`, or `getFund()` must preserve the three-tier UK fee logic (home / rest-of-UK at Scottish unis / international)
- **Data integrity**: Courses must have valid `id`, `title`, `institution`, `country`, `level`, `domain`, and `subjects` fields
- **Scottish fee handling**: The `feeScotland` / `fS` field must exist on all `country: "Scotland"` courses with value `9250`
- **Security**: No API keys, passwords, or secrets in committed code. Check `.env` files are gitignored

### Important — Check Carefully
- **Matching algorithm**: Changes to `matching.js` must not break the 55% domain-priority weighting
- **Domain classification**: The 19 domain families in `domainFamilies.json` must stay consistent between frontend and scraper classifier
- **Deduplication**: SHA-256 fingerprints must normalise title + institution + level + country consistently
- **React patterns**: Controlled components, proper key props, no direct state mutation

### Style — Suggest Improvements
- British English in user-facing strings (e.g. "programme" not "program", "colour" not "color")
- Consistent use of the design system palette from `styles/theme.js`
- Prefer named exports for utility functions, default exports for React components
