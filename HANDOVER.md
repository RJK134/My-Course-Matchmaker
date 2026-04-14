# MyCourseMatchmaker — Claude Code Handover Document
## Version 4.0 | April 2026 | Future Horizons Education

---

## 1. PROJECT OVERVIEW

**MyCourseMatchmaker** is an interactive course-matching platform built for **Future Horizons Education** (co-founded by Richard, British national living in Switzerland). It matches prospective students to university degree programmes, postgraduate courses, and online learning options based on their interests, nationality, and preferences — functioning like a dating-site matcher but for academic courses.

### Current State: Single-file React JSX artifact (v4.0)
- **827 lines** of React JSX
- **119 courses** across 19 discipline families
- **77 institution profiles** with URLs, contacts, coordinates
- **52 cities** with cost-of-living data (rent, food, transport, utilities)
- **Course Explorer** subpage with 5 tabs (Costs, Institution, Preparation, Map, Support)
- Nationality-based fee calculation with UK sub-nation picker
- Clickable funding links to actual grant/scholarship websites
- OpenStreetMap integration for institution locations
- Domain-priority matching algorithm (55% primary domain weight)

### Repository
- **GitHub**: `https://github.com/RJK134/MyCourseMatchmaker`
- **Local**: `D:\Projects\MyCourseMatchmaker`

---

## 2. FULL BUILD HISTORY (v1 → v4)

### v1 — Flat keyword matcher
- 30 sample courses, 6-step questionnaire
- Flat keyword matching (40% subject, 15% level, etc.)
- **Problem**: Treated all keywords equally — "technology" in interests promoted CS courses for performing arts students

### v2 — Domain-priority algorithm
- 16 domain families taxonomy → hierarchical matching
- 45 courses with stronger creative arts coverage
- Primary domain carries 55% weight; wrong-domain courses penalised
- Name/nationality/residence fields added
- Nationality-based fee status calculation
- **Bug**: British nationals shown international fees because demonym mapping incomplete

### v3 — Fee fix + international expansion
- Fixed nationality logic: `resolveNat()` maps 50+ demonyms ("British" → "UK")
- `detFeeStatus()` checks nationality FIRST, not residence
- 119 courses with strong European coverage (Germany FREE, Finland FREE, Netherlands, Denmark, Switzerland, France, Italy)
- Clickable funding links (`{t: text, u: url}` objects)
- Age-aware entry requirements (Access to HE, BTEC, mature routes)
- Free online alternatives in every discipline
- UK sub-nation picker (England/Scotland/Wales/NI) for Scottish fee logic
- Three-tier Scottish fees: SAAS (£1,820) / rest-of-UK (£9,250) / international
- Turing Scheme URL updated to gov.uk

### v4 — Course Explorer + Cost of Living (CURRENT)
- **Course Explorer subpage** with 5 tabbed sections
- **Cost-of-living database** for 52 cities worldwide (monthly rent/food/transport/utils/misc)
- **Institution profiles** for 77 universities (founded, type, students, URL, apply, contact, lat/lng, description)
- **OpenStreetMap** embedded maps with institution coordinates
- **Preparation tab** with Coursera/edX/FutureLearn/Khan Academy search links
- **Support tab** with disability services, mental health, visa info, GP registration
- Direct "Apply / Course Page" buttons linking to actual institution application pages
- UCAS search links for UK courses
- "Show Free Alternatives" toggle in results
- Free online alternatives shown in each course's Explorer page

---

## 3. KNOWN ISSUES TO FIX

### Critical
1. **Page dropping / render errors**: The artifact occasionally fails to render in Claude.ai's sandbox. Root causes fixed so far:
   - `const` variables defined after `export default function` (not hoisted — caused ReferenceError)
   - `return<div` without space (JSX transformer read as `returnReact` identifier)
   - Missing closing brace in `getFund()` Italy section
   - **Action**: Run full JSX parse check on every edit. Test in browser.

2. **Course Explorer iframe**: OpenStreetMap `<iframe>` may be blocked by Claude.ai's Content Security Policy. Need to test in standalone React app. Fallback: Google Maps static link.

3. **No persistent data**: Currently all 119 courses are hardcoded in JSX. Richard wants a database backend.

### Medium Priority
4. **Scottish courses need `fS` field**: Only 3 of the Scottish courses have `fS:9250` added. Any new Scottish courses need this field for rest-of-UK fee tier.

5. **Course URLs**: `getCourseUrl()` falls back to Google search for institutions not in `INST_DATA`. Need to add more direct application URLs.

6. **Cost-of-living gaps**: Some cities in the course database don't have entries in `COL` (e.g. smaller UK towns). Fallback shows Numbeo link.

### Low Priority
7. **Mobile responsiveness**: Grid layouts may need media queries for small screens.
8. **PDF report generation**: Mentioned in original spec but not yet implemented.
9. **Personality/learning style tests**: Original spec mentions OCEAN model integration.

---

## 4. ARCHITECTURE DECISIONS

### Matching Algorithm
- **Domain gate (55%)**: Primary domain identified from subject tokens. Wrong-domain courses capped at 10%.
- **Keyword specificity (15%)**: How many subject tokens match course subjects.
- **Interest enrichment (8%)**: Broader interests/skills match.
- **Level (7%)**: undergraduate/postgraduate/certificate match.
- **Mode (5%)**: full-time/part-time/online match.
- **Location (5%)**: Country/city preference match.
- **Preferences (5%)**: Free/online preference bonus. Cap at 99%.

### Fee Status Logic
```
Nationality → resolveNat() → country code (e.g. "British" → "UK")
↓
detFeeStatus(nat, res, courseCo, ukNation)
  → "home" (domestic rate)
  → "ruk" (rest-of-UK at Scottish unis: £9,250)
  → "international"
↓
getFee(course, feeStatus)
  → feeHome / fS / feeIntl
```

### Key Data Structures
- `NAT_MAP`: demonym → country code (50+ entries)
- `EU_EEA`: Set of EU/EEA country names
- `DOMAIN_FAMILIES`: 19 domain → keyword arrays
- `COL`: city → {rent, food, transport, utils, misc, currency, note}
- `INST_DATA`: institution → {full, type, founded, students, url, apply, contact, lat, lng, desc}
- `C[]`: compact course array → mapped to `SAMPLE_COURSES[]`
- `getFund()`: returns [{t: text, u: url}] clickable funding sources

---

## 5. NEXT PHASE — RECOMMENDED BUILD PLAN

### Phase 1: Convert to Full React App with Database
1. **Scaffold React app** with Vite or Create React App
2. **Extract data** into separate JSON/database files:
   - `courses.json` (119+ courses)
   - `institutions.json` (77+ profiles)
   - `cost-of-living.json` (52+ cities)
   - `funding-sources.json` (by country/fee status)
3. **Set up Express.js backend** with PostgreSQL or SQLite
4. **Docker Compose** configuration:
   - `frontend` (React)
   - `api` (Express.js)
   - `db` (PostgreSQL)
   - `nginx` (reverse proxy)
5. **Admin panel** to add/edit courses, institutions, COL data

### Phase 2: Expand Course Database
1. **Scrape/API integration** with data sources from Richard's documents:
   - UCAS API / digital.ucas.com
   - studyportals.com / bachelorsportal.com / mastersportal.com
   - topuniversities.com/programs
   - study.eu
   - hochschulkompass.de (Germany)
   - universityadmissions.se (Sweden)
   - coursera.org / edx.org / futurelearn.com
2. **Target**: 500+ courses, 200+ institutions, 100+ cities

### Phase 3: Enhanced Features
1. **PDF report generation** (use jsPDF or Puppeteer)
2. **User accounts** (sign-up, save searches, compare courses)
3. **Real-time cost-of-living** via Numbeo API or similar
4. **Google Maps API** integration (replace OpenStreetMap iframe)
5. **OCEAN personality test** integration
6. **Postcode-based search** (find courses within X miles)

### Phase 4: Monetisation & Partnerships
1. **University partnership portal** (advertising, sponsored listings)
2. **Subscription tiers** (free basic / premium with PDF + advisory)
3. **Accommodation & travel partner integrations**
4. **Financial advisory service links**

---

## 6. FILE STRUCTURE (PROPOSED)

```
D:\Projects\MyCourseMatchmaker\
├── README.md
├── HANDOVER.md                    ← This file
├── docker-compose.yml
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.jsx                ← Main app (from mycoursematchmaker.jsx)
│       ├── components/
│       │   ├── Landing.jsx
│       │   ├── Questionnaire.jsx
│       │   ├── Results.jsx
│       │   ├── CourseExplorer.jsx
│       │   ├── MatchBadge.jsx
│       │   └── ui/               ← Shared form components
│       ├── data/
│       │   ├── courses.json
│       │   ├── institutions.json
│       │   ├── costOfLiving.json
│       │   └── fundingSources.json
│       ├── lib/
│       │   ├── matching.js       ← Algorithm
│       │   ├── feeCalculator.js  ← Fee status logic
│       │   └── nationalityMap.js
│       └── styles/
│           └── theme.js          ← Palette constants
├── api/
│   ├── package.json
│   ├── server.js
│   ├── routes/
│   │   ├── courses.js
│   │   ├── institutions.js
│   │   └── costOfLiving.js
│   └── db/
│       ├── schema.sql
│       └── seed.sql
└── nginx/
    └── nginx.conf
```

---

## 7. REFERENCE DOCUMENTS (from Richard)

All uploaded to Claude.ai conversations. Key data sources:

### Course Data Sources
- UCAS: digital.ucas.com/coursedisplay
- DiscoverUni: discoveruni.gov.uk
- QS Rankings: topuniversities.com/programs
- THE Rankings: timeshighereducation.com/student/course-search
- Study.eu: study.eu (European courses)
- Hochschulkompass: hochschulkompass.de (Germany)
- University Admissions Sweden: universityadmissions.se
- Coursera: coursera.org/courses
- edX: edx.org/bachelors + edx.org/learn/higher-education
- FutureLearn: futurelearn.com
- Open University: open.ac.uk/courses
- Class Central: classcentral.com (MOOC aggregator)

### Cost of Living Sources
- Numbeo: numbeo.com/cost-of-living
- Expatistan: expatistan.com/cost-of-living/country
- LivingCost.org: livingcost.org/cost
- WiseVoter: wisevoter.com/country-rankings/cost-of-living-by-country

### Funding Sources
- **UK Home**: gov.uk/student-finance, saas.gov.uk, studentfinancewales.co.uk
- **UK Abroad**: gov.uk/guidance/turing-scheme-apply-for-funding-for-international-placements
- **UK International**: chevening.org, cscuk.fcdo.gov.uk/scholarships
- **US**: studentaid.gov, fulbrightprogram.org
- **Canada**: canada.ca/student-aid, educanada.ca
- **Australia**: studyassist.gov.au, dfat.gov.au/australia-awards
- **Germany**: daad.de/scholarships, study-in-germany.de
- **France**: campusfrance.org/scholarships
- **Netherlands**: studyinholland.nl, duo.nl/student-finance
- **Nordics**: study.eu (free tuition article), si.se/scholarships
- **Switzerland**: sbfi.admin.ch/scholarships, ethz.ch/tuition-fees
- **Global**: topuniversities.com/scholarships, scholars4dev.com, thescholarshiphub.org.uk

### Business Documents
- `Arguments_for_MCM.docx` — Business case with OfS quotes, dropout stats
- `Student_Concierge_Service.docx` — 5-year business plan, subscription model, CHF 405k budget
- `Create_a_website_for_...docx` — Full product spec: user journey, tech considerations
- `My_Course_Matchmaker_first_output.docx` — Sample output format
- `University_Course__Costs_and_Funding_Source_Websites.docx` — Master list of 50+ data source URLs
- `Website_images.docx` — Brand images (6 PNGs)

---

## 8. CROSS-PROJECT REFERENCE

Richard also has a VetApp project with n8n workflow automation:
```
Repository: D:\Projects\VetApp
Workflow file: D:\Projects\VetApp\src\workflows\equismile-n8n-workflow.json
Setup command: mkdir -p "D:/Projects/VetApp/src/workflows"
Copy command: cp "D:/Projects/VetApp/src/equismile-n8n-workflow.json" "D:/Projects/VetApp/src/workflows/"
```

Richard's n8n instance is at: `https://rjk134.app.n8n.cloud/`

---

## 9. SETUP COMMANDS FOR CLAUDE CODE

### Initial Setup
```bash
# Clone and set up
cd D:\Projects
git clone https://github.com/RJK134/MyCourseMatchmaker.git
cd MyCourseMatchmaker

# Or if repo doesn't exist yet, create it:
mkdir -p D:\Projects\MyCourseMatchmaker
cd D:\Projects\MyCourseMatchmaker
git init
git remote add origin https://github.com/RJK134/MyCourseMatchmaker.git

# Copy the current v4 source file
# (copy mycoursematchmaker.jsx from Claude.ai download into this folder)

# Commit and push
git add -A
git commit -m "v4.0: Full React artifact with Course Explorer, 119 courses, 77 institutions, 52 cities COL data"
git branch -M main
git push -u origin main
```

### Scaffold Full React App
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install react-router-dom lucide-react
# Extract components from monolithic JSX into modular structure
```

### Docker Setup (future)
```bash
# After backend is built:
docker-compose up -d
```

---

## 10. PROMPTS FOR CLAUDE CODE

### Prompt 1 — Initial Context Load
```
I'm continuing development of MyCourseMatchmaker, a course-matching platform for Future Horizons Education. Read the HANDOVER.md file in D:\Projects\MyCourseMatchmaker for full build history covering v1 through v4. The current codebase is a single-file React JSX artifact (mycoursematchmaker.jsx, 827 lines) that needs to be converted into a proper React application with a database backend. Review the current code, identify all issues listed in the handover, and create a detailed implementation plan for Phase 1 (React app scaffold + database).
```

### Prompt 2 — Code Review & Fix
```
Review mycoursematchmaker.jsx for:
1. JSX parse errors (use @babel/parser)
2. const hoisting issues (variables used before definition)
3. Missing closing braces in functions
4. return<tag without space (causes returnReact error)
5. Scottish fee logic (fS field on all co:"Scotland" courses)
6. Verify all 119 courses have valid data
7. Check all institution URLs in INST_DATA are valid
Fix any issues found.
```

### Prompt 3 — Convert to Modular React App
```
Convert mycoursematchmaker.jsx into a modular React application:
1. Create Vite React project in frontend/
2. Extract into components: Landing, Questionnaire (7 steps), Results, CourseExplorer (5 tabs)
3. Move data into JSON files: courses.json, institutions.json, costOfLiving.json
4. Move logic into lib/: matching.js, feeCalculator.js, nationalityMap.js
5. Add React Router for navigation between results and Course Explorer
6. Add responsive CSS with Tailwind
7. Keep the existing dark navy/gold design aesthetic
```

### Prompt 4 — Database Backend
```
Create an Express.js API backend:
1. PostgreSQL schema for courses, institutions, cost_of_living, funding_sources
2. Seed database from the existing JSON data files
3. REST API endpoints: GET /api/courses, GET /api/courses/:id, GET /api/institutions/:id, GET /api/col/:city
4. Search/filter endpoints with query parameters
5. Docker Compose with frontend, api, db, and nginx services
6. Environment variables for database credentials
```

### Prompt 5 — Expand Course Database
```
Using the data sources listed in HANDOVER.md section 7, expand the course database:
1. Add 50+ more European universities (use QS/THE top 200 lists)
2. Add courses for: medicine, veterinary, dental, pharmacy, nursing, midwifery (at least 10 each)
3. Add more free online alternatives (Khan Academy paths, MIT OCW specific courses, Coursera specializations)
4. Add Australian universities (Melbourne, Sydney, ANU, Monash, Queensland)
5. Add Canadian universities (UBC, McGill, Waterloo, Alberta)
6. Ensure every course has: institution URL, entry requirements with mature routes, career paths, salary data
7. Add cost-of-living data for any new cities
```

### Prompt 6 — PDF Report Generation
```
Add a downloadable PDF report feature:
1. Use jsPDF or react-pdf to generate a personalized report
2. Include: student name, nationality, fee status, top 10 matches with match %, fee breakdown, career paths, funding sources
3. Include cost-of-living comparison table for matched cities
4. Add Future Horizons Education branding
5. Trigger from a "Download PDF Report" button in the results dashboard
```

---

## 11. TECH STACK

### Current
- React (JSX artifact, no build system)
- Inline CSS-in-JS styling
- No backend, no database

### Target
- **Frontend**: React + Vite + Tailwind CSS + React Router
- **Backend**: Express.js + PostgreSQL
- **Infrastructure**: Docker Compose + nginx
- **Maps**: Google Maps API or Leaflet.js (replace OpenStreetMap iframe)
- **PDF**: jsPDF or Puppeteer
- **Deployment**: Vercel (frontend) + Railway/Render (backend) or self-hosted Docker

### Design System
- **Font**: Georgia (serif) for body, Trebuchet MS (sans-serif) for UI
- **Palette**: Midnight (#0B1426), Navy (#132042), Accent Blue (#3B82F6), Gold (#F59E0B), Success Green (#10B981)
- **Aesthetic**: Dark mode, gradient backgrounds, rounded cards, gold accents for fees
- **Brand**: Future Horizons Education

---

*Generated by Claude (Anthropic) — April 2026*
*For Richard at Future Horizons Education*
