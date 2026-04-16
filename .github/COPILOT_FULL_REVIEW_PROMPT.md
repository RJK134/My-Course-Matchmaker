# MyCourseMatchmaker — Comprehensive Copilot Code Review Request

## Instructions for Copilot

You are reviewing the complete MyCourseMatchmaker codebase — a course-matching platform built for Future Horizons Education that matches prospective students to university courses based on interests, nationality, and preferences.

**The product claims to deliver:**
1. Smart domain-priority matching (55% weight) across 19 discipline families
2. Nationality-based fee calculation with UK three-tier logic (home / rest-of-UK at Scottish unis / international)
3. 125 courses, 80 institutions, 55 cities with cost-of-living data
4. Course Explorer with 5 tabs (Costs, Institution, Preparation, Map, Support)
5. "Why this match?" score breakdown with progress bars
6. Fee comparison across nationality tiers
7. Shareable results URL
8. Automated scraping pipeline (4 sources: UCAS, StudyPortals, QS/THE, MOOCs)
9. Admin panel for staging/approving scraped courses
10. Express.js API backed by PostgreSQL
11. Docker Compose deployment (4 services)

**Review every file against this question: Does this code actually deliver what it promises?**

---

## Review Scope — Every File

### Frontend Core (`frontend/src/`)
- [ ] `App.jsx` — Review the DataLoader component: does the API fallback pattern work correctly? Is the shared URL encoding/decoding (base64 profile) safe from XSS? Does the level/location hard-filtering logic correctly prevent wrong results?
- [ ] `context/AppContext.jsx` — Is the state management sufficient? Are there race conditions in the data loading flow?
- [ ] `lib/matching.js` — Verify the `calculateMatch()` function returns correct breakdown scores. Is the 55% domain weight implemented correctly? Are there edge cases where scores exceed 99?
- [ ] `lib/nationalityResolver.js` — Test all fee paths: British+England at Scottish uni = ruk (£9,250). British+Scotland at Scottish uni = home (£1,820). Irish at UK uni = home. German at German uni = home (free). Does `resolveNat()` handle all 50+ demonyms?
- [ ] `lib/fundingSources.js` — Are all funding URLs current and correct? Any broken links?
- [ ] `lib/courseUrl.js` — Does the fallback chain work? Are there institutions in courses.json that aren't in institutions.json (orphaned references)?
- [ ] `lib/api.js` — Is error handling sufficient? What happens on network timeout?

### Frontend Components (`frontend/src/components/`)
- [ ] `Landing.jsx` — Does it display correct counts from state/stats?
- [ ] `Questionnaire.jsx` — Are all 7 steps validated correctly? Does the UK sub-nation picker work for all 4 nations? Is the datalist for NATIONALITIES populated correctly? Does Step 7 review show all 12 fields?
- [ ] `Results.jsx` — Does the "Free Only" filter include tuition-free universities (feeHome=0)? Does the sort dropdown work for all 5 options? Does the "Why?" breakdown toggle correctly? Does the Share button copy a valid URL?
- [ ] `CourseExplorer.jsx` — Do all 5 tabs render correctly? Does the fee comparison show correct tiers? Does the OpenStreetMap iframe load? Are funding links clickable?
- [ ] `MatchBadge.jsx` — Does the colour coding (green >80, blue >60, gold >40, red <40) match the palette?
- [ ] `admin/AdminDashboard.jsx` — Does it gracefully handle API failure? What does the user see when the database isn't running?
- [ ] `admin/StagingReview.jsx` — Does pagination work? Do bulk approve/reject send correct API calls?

### Data Files (`frontend/src/data/`)
- [ ] `courses.json` — Validate all 125 entries have required fields (id, title, institution, country, city, level, mode[], domain, subjects[]). Check Scottish courses (ids 4, 70, 95) have fS:9250. Check no duplicate IDs. Check all institution references exist in institutions.json.
- [ ] `institutions.json` — Validate all 80 entries have key, full, url, apply, lat, lng. Check URLs are not dead links.
- [ ] `costOfLiving.json` — Validate all 55 cities have rent, food, transport, utils, misc, currency. Check currencies are correct for each country.
- [ ] `domainFamilies.json` — Are all 19 domains populated with enough keywords? Any domain with too few keywords (<5)?
- [ ] `nationalityMap.json` — Are there common nationalities missing? Does the EU/EEA list include all 27 EU members + 3 EEA?

### Backend API (`api/`)
- [ ] `server.js` — Is helmet configured correctly? Is CORS too permissive? Does the admin router mount correctly?
- [ ] `routes/courses.js` — SQL injection risk? Does the parameterised query handle all filter combinations? Does the JOIN query for `/courses/:id` return correct denormalised data?
- [ ] `routes/institutions.js` — Any issues with the key lookup?
- [ ] `routes/costOfLiving.js` — City name matching case-sensitive?
- [ ] `routes/admin.js` — Is the API key auth secure? Does `child_process.spawn()` for scraper trigger have command injection risk? Does bulk approve/reject correctly move data between staging and live tables? Is the transaction in the approve endpoint properly rolled back on failure?
- [ ] `middleware/adminAuth.js` — Is the "no key = dev mode, allow all" pattern safe?
- [ ] `db/schema.sql` — Are indexes sufficient for the query patterns? Missing any foreign keys?
- [ ] `db/migrations/001_scraping_schema.sql` — Is the staging table complete? Are the ALTER TABLE statements idempotent?
- [ ] `db/seed.js` — Does the field mapping between JSON camelCase and DB snake_case cover all fields? ON CONFLICT behaviour correct?

### Scrapers (`scrapers/`)
- [ ] `index.js` — CLI argument parsing robust? Error handling for missing output directory?
- [ ] `sources/mooc.js` — Does the Coursera scraper handle rate limiting? JSON-LD parsing error-safe? Cheerio selectors likely to break on site updates?
- [ ] `sources/ucas.js` — Playwright setup correct? Is it scraping the right UCAS endpoints? Legal/ethical scraping compliance (robots.txt, rate limiting)?
- [ ] `sources/studyportals.js` — Fee parsing from "EUR 2,000-4,000/year" strings robust?
- [ ] `sources/qs-the.js` — XHR interception pattern correct? Does it handle sites that block automated access?
- [ ] `sources/numbeo.js` — COL parsing from Numbeo tables correct? Currency detection reliable?
- [ ] `lib/normalizer.js` — Does fee normalisation handle all currency formats? Duration normalisation complete?
- [ ] `lib/domainClassifier.js` — Uses same tokenisation as frontend matching.js? Confidence calculation meaningful?
- [ ] `lib/deduplicator.js` — SHA-256 fingerprint normalisation strips degree prefixes consistently?
- [ ] `lib/dataQuality.js` — Scoring weights reasonable? Missing any important quality signals?

### Infrastructure
- [ ] `docker-compose.yml` — Are default credentials acceptable for dev? Volume persistence correct? Service dependency order correct?
- [ ] `nginx/nginx.conf` — Does the reverse proxy handle WebSocket? SPA fallback for React Router?
- [ ] `.gitignore` — Does it exclude .env, node_modules, dist, venv, Draft Images?

---

## Critical Questions

1. **Is the matching algorithm trustworthy?** Would a real student get relevant results for "Theatre, acting" as British/England/UG/UK-only? Would they get different (correct) results as German/UG/Germany?

2. **Is the fee logic correct for ALL nationality paths?** British-England at Scottish uni = £9,250 (rest-of-UK). British-Scotland at Scottish uni = £1,820 (SAAS). Irish at any UK uni = home. EU at German uni = free. International everywhere = international rate.

3. **Is the data pipeline functional end-to-end?** Can you trace a course from scrape → normalise → classify → deduplicate → staging → approve → live → frontend?

4. **Are there security vulnerabilities?** SQL injection in parameterised queries? XSS in the share URL (base64-encoded user input rendered in the DOM)? Command injection in the scraper trigger endpoint?

5. **What breaks when PostgreSQL is not running?** Does the frontend gracefully fall back to JSON? Does the API crash or return useful errors?

6. **What's the real production readiness?** Could this be deployed to a public URL today? What's missing?

---

## Report Format

For each finding, report:
```
[SEVERITY] CRITICAL / HIGH / MEDIUM / LOW / INFO
[FILE] path/to/file.js:line_number
[ISSUE] What's wrong
[FIX] How to fix it
```

Group findings by:
1. **Blockers** — Must fix before any production deployment
2. **Bugs** — Functional errors that affect users
3. **Security** — Vulnerabilities
4. **Code quality** — Patterns, naming, duplication, error handling
5. **Missing features** — Claimed but not implemented
6. **Recommendations** — Improvements for next phase
