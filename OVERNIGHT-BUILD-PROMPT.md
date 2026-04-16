# MyCourseMatchmaker — Overnight Autonomous Build Prompt

**Copy this entire prompt into a new Claude Code session and run it overnight.**

---

## Prompt

```
I'm running an overnight autonomous build for MyCourseMatchmaker at D:\Projects\MyCourseMatchmaker.

Read HANDOVER.md, TESTING-GUIDE.md, .github/COPILOT_FULL_REVIEW_PROMPT.md, and .github/MAC_WORKHORSE_INTEGRATION.md for full context.

The frontend works (125 courses via JSON fallback at localhost:5180) but the entire backend pipeline has never been initialised. Port 3001 is used by SJMS and port 5432 is used by another PostgreSQL — MCM must use port 3002 (API) and port 5434 (PostgreSQL).

Complete ALL of the following tasks in order. After each major step, commit to a feature branch, push, create a PR against main, and wait 3 minutes for GitHub Copilot automated review. Then read the Copilot review comments via `gh pr view N --comments`, address any findings by pushing follow-up commits, and merge the PR. Continue to the next task.

If any step fails, diagnose the root cause, fix it, and retry before moving on. Do not skip steps. Log every action.

### TASK 1: Fix Port Conflicts
- docker-compose.yml: change db to port 5434:5432, api PORT to 3002, nginx to 8180:80
- api/.env: set PORT=3002, DB_PORT=5434, DB_HOST=localhost
- frontend/vite.config.js: change proxy from localhost:3001 to localhost:3002
- .claude/launch.json: update api port to 3002
- Branch: fix/port-conflicts → PR → Copilot review → merge

### TASK 2: Fix Database Pool Error Handling
- api/db/pool.js: add pool.on('error') handler so API doesn't crash when DB is down. Add connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000. Log connection status on startup.
- api/server.js: add a startup check that logs whether DB is reachable
- Branch: fix/pool-error-handling → PR → Copilot review → merge

### TASK 3: Initialise PostgreSQL Database
- Run: docker-compose up -d db (starts PostgreSQL on port 5434)
- Wait for PostgreSQL to be ready (poll with pg_isready or retry loop)
- Run: cd api && node db/seed.js (seeds 125 courses, 80 institutions, 55 cities, 19 domains from JSON files)
- Verify seed worked: connect to DB and SELECT COUNT(*) FROM courses (should be 125)
- Apply scraping migration: run the SQL in api/db/migrations/001_scraping_schema.sql against the database
- Verify migration: SELECT * FROM scrape_sources (should show 4 sources)
- Do NOT commit database state — only commit any code changes needed to make seeding work

### TASK 4: Start API and Verify All Endpoints
- Run: cd api && npm run dev (or node server.js) in background
- Test every endpoint:
  - GET /api/health → should return {"status":"ok"}
  - GET /api/courses → should return array of 125 courses
  - GET /api/courses/1 → should return RADA course with institution and COL join
  - GET /api/institutions → should return 80 institutions
  - GET /api/institutions/RADA → should return RADA profile
  - GET /api/col → should return 55 cities
  - GET /api/col/London → should return London COL data
  - GET /api/admin/stats → should return {totalCourses:125, totalInstitutions:80, totalCities:55, pendingReview:0}
  - GET /api/admin/sources → should return 4 scrape sources
- If any endpoint fails, diagnose and fix the route code, then commit the fix

### TASK 5: Fix Frontend DataLoader Race Condition
- In frontend/src/App.jsx, update the DataLoader so that if ANY API call fails, ALL fall back to JSON (don't mix API data with JSON fallback)
- Verify: with API running, frontend loads from API. With API stopped, frontend loads from JSON.
- Branch: fix/dataloader-race-condition → PR → Copilot review → merge

### TASK 6: Verify Frontend Connects to Live API
- Restart the frontend dev server (npm run dev in frontend/)
- Take a screenshot or snapshot of the landing page
- Verify the course/institution/city counts come from the API (should still be 125/80/55)
- Navigate through Sarah persona (British/England/Theatre/UG/UK) and verify results
- Navigate to /admin and verify the dashboard loads with real stats from the database

### TASK 7: Test Scraper Pipeline End-to-End
- Create scrapers/output/ directory if it doesn't exist
- Run: cd scrapers && node index.js --source mooc --limit 10
- If it fails, diagnose and fix (missing deps, path issues, etc.)
- Verify output file exists at scrapers/output/mooc-YYYY-MM-DD-raw.json
- Read the output file and verify it contains valid course objects
- If the scraper works, commit any fixes needed
- Branch: fix/scraper-pipeline → PR → Copilot review → merge

### TASK 8: Test Scraper Import to Database
- Call POST /api/admin/scrape/trigger with body {"source":"mooc"} (via curl or API call)
- Wait for the scraper to complete (check status via GET /api/admin/scrape/status/:runId)
- Call POST /api/admin/scrape/import/:runId to import output into staging_courses
- Verify: GET /api/admin/staging should show the imported courses with status "pending"
- If any step fails, fix the admin route code and commit
- Branch: fix/scraper-import → PR → Copilot review → merge

### TASK 9: Create Missing Setup Scripts
- Create scripts/ directory
- Create scripts/setup-db.sh:
  - Starts PostgreSQL via docker-compose
  - Waits for it to be ready
  - Runs seed.js
  - Applies migration 001
  - Logs success/failure
- Create scripts/export-to-onedrive.js:
  - Connects to PostgreSQL
  - Exports courses, institutions, COL as JSON
  - Writes to OneDrive path (configurable via env var)
- Create scripts/import-from-onedrive.js:
  - Reads latest JSON from OneDrive path
  - Copies to frontend/src/data/ if newer
- Branch: feat/setup-scripts → PR → Copilot review → merge

### TASK 10: Run Comprehensive Copilot Review
- Copy the contents of .github/COPILOT_FULL_REVIEW_PROMPT.md
- Create an issue on the repo titled "Full Copilot Code Review" with the prompt as the body
- Run: gh issue create --title "Full Copilot Code Review" --body-file .github/COPILOT_FULL_REVIEW_PROMPT.md
- Read any automated responses

### TASK 11: Final Verification Loop
- Run through ALL 6 test personas from TESTING-GUIDE.md:
  1. Sarah (British/England/Theatre/UG/UK)
  2. Callum (British/Scotland/Business/UG/Scotland)
  3. Anna (German/CS/UG/Germany,Netherlands,Switzerland)
  4. Priya (Indian/Medicine/UG/UK,Australia,Canada)
  5. Mike (American/Web Dev/Certificate/Online/Free)
  6. Luca (Italian/Environment/PG/UK,Netherlands,Denmark,Sweden)
- For each persona, verify:
  - Nationality resolves correctly
  - Domain detected correctly
  - Results show correct fee status (home/ruk/international)
  - Only correct level courses appear
  - Location filter works
  - Course Explorer loads with costs, institution, map
- Log any failures as bugs
- Fix bugs immediately, commit, push, create PR, merge

### TASK 12: Create Final Status Report
- Create a COMPLETED-STATUS.md file in the project root summarising:
  - All PRs merged (with numbers and titles)
  - All bugs found and fixed
  - All Copilot review findings and resolutions
  - Current system status (what works, what's pending)
  - Database status (course count, institution count)
  - Next steps for Phase 3
- Commit and push to main

## Important Rules
- Use British English throughout
- Never hardcode secrets
- Every change goes through a PR with Copilot review
- Use conventional commit messages: fix:, feat:, data:, docs:, chore:
- Branch naming: fix/xxx, feat/xxx, data/xxx, docs/xxx
- After creating each PR, wait 3 minutes, then check for Copilot comments
- Address ALL Copilot findings before merging
- If a task cannot be completed (e.g. external service down), log why and continue to next task
- The GitHub repo is https://github.com/RJK134/My-Course-Matchmaker
- Frontend runs on port 5180, API on port 3002, PostgreSQL on port 5434
- Do not stop until all 12 tasks are complete or you've attempted every task
```

---

## How to Run This

1. Open a **new Claude Code terminal session** (not this one)
2. Set to **auto mode** (no confirmations)
3. Paste the prompt above
4. Let it run overnight
5. In the morning, check:
   - GitHub: https://github.com/RJK134/My-Course-Matchmaker/pulls (merged PRs)
   - `COMPLETED-STATUS.md` in the project root
   - `http://localhost:5180` (frontend)
   - `http://localhost:3002/api/health` (API)
   - `http://localhost:5180/admin` (admin panel)

## Expected Outcome

By morning you should have:
- PostgreSQL running with 125+ courses seeded
- API serving live data on port 3002
- Frontend consuming the API (not JSON fallback)
- Admin panel showing real stats
- At least one scraper tested end-to-end
- 6-10 PRs merged with Copilot review history
- Setup scripts for Mac workhorse integration
- Full status report
