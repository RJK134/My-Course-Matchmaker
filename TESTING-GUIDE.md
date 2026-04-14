# MyCourseMatchmaker — Testing Guide & Feedback Framework
## Version 4.1 | Phase 2 | Future Horizons Education

---

## How to Access the Live Site

```bash
cd D:\Projects\MyCourseMatchmaker\frontend
npm run dev
```
Open **http://localhost:5180** in your browser.

Admin panel: **http://localhost:5180/admin**

---

## Test Personas

### Persona 1: SARAH — British Undergraduate from England
**Purpose**: Tests UK home fee calculation, domain matching, and standard UG flow.

| Field | Value |
|-------|-------|
| Name | Sarah |
| Nationality | British |
| UK Sub-nation | England |
| Residence | UK |
| Subject | Theatre, acting and performing arts |
| Level | Undergraduate |
| Mode | Full-time, Face-to-face |
| Interests | Community theatre, directing, devised work |
| Skills | Public speaking, creative thinking |
| Learning style | Hands-on, collaborative |
| Locations | UK |
| Extra-curricular | Youth theatre, volunteering |

**Expected outcomes to verify:**
- [ ] Nationality resolves to "UK" with green tick
- [ ] England sub-nation button highlights
- [ ] Domain detected as "Performing Arts"
- [ ] Top matches include RADA, Central, Bristol, Leeds (all UK drama schools)
- [ ] Fee shown as £9,250/yr (home fee) for UK courses
- [ ] RADA Course Explorer → Costs tab shows London COL data (£1,400 rent)
- [ ] Funding sources include Student Finance England, UCAS scholarships
- [ ] Free alternatives section shows MasterClass Acting or similar MOOC

---

### Persona 2: CALLUM — Scottish Student at Scottish University
**Purpose**: Tests the three-tier Scottish fee logic (SAAS = free, rest-of-UK = £9,250).

| Field | Value |
|-------|-------|
| Name | Callum |
| Nationality | British |
| UK Sub-nation | Scotland |
| Residence | Scotland |
| Subject | Business, management and economics |
| Level | Undergraduate |
| Mode | Full-time |
| Interests | Entrepreneurship, start-ups |
| Skills | Leadership, analytics |
| Locations | Scotland |

**Expected outcomes to verify:**
- [ ] Scottish sub-nation shows gold banner: "🏴 Scottish: FREE tuition at Scottish universities via SAAS"
- [ ] Domain detected as "Business"
- [ ] University of St Andrews BSc Business appears in results
- [ ] St Andrews fee shown as £1,820/yr (SAAS home rate), NOT £9,250
- [ ] Royal Conservatoire of Scotland (if matched) also shows £1,820
- [ ] University of Glasgow BA History shows £1,820
- [ ] Funding sources include SAAS link
- [ ] St Andrews COL data shows for the city

---

### Persona 3: ANNA — German Student Exploring European Options
**Purpose**: Tests EU/EEA fee status and European university matching.

| Field | Value |
|-------|-------|
| Name | Anna |
| Nationality | German |
| Residence | Germany |
| Subject | Computer science and artificial intelligence |
| Level | Undergraduate |
| Mode | Full-time |
| Interests | Machine learning, open source |
| Skills | Python, mathematics |
| Locations | Germany, Netherlands, Switzerland |

**Expected outcomes to verify:**
- [ ] Nationality resolves to "Germany"
- [ ] No UK sub-nation picker appears
- [ ] Domain detected as "Computer Science"
- [ ] TU Munich BSc Computer Science appears — fee shown as FREE (€0)
- [ ] ETH Zurich appears — fee shown as £1,460 (same for all nationalities)
- [ ] TU Delft or Dutch courses show EU home fee rate
- [ ] Funding includes DAAD Scholarships, "No tuition fees at public universities"
- [ ] Munich COL data shows €700 rent, semester ticket note
- [ ] Results include both German and Dutch options per location preference

---

### Persona 4: PRIYA — Indian International Student
**Purpose**: Tests international fee calculations across multiple countries.

| Field | Value |
|-------|-------|
| Name | Priya |
| Nationality | Indian |
| Residence | India |
| Subject | Medicine, nursing and healthcare |
| Level | Undergraduate |
| Mode | Full-time, Face-to-face |
| Interests | Public health, community medicine |
| Skills | Biology, chemistry, patient care |
| Locations | UK, Australia, Canada |
| Options | Worldwide checked |

**Expected outcomes to verify:**
- [ ] Nationality resolves to "India"
- [ ] Domain detected as "Medicine & Health"
- [ ] All UK courses show INTERNATIONAL fee rates (£20,000+)
- [ ] Funding sources include Chevening, Commonwealth, GREAT Scholarships (not Student Finance England)
- [ ] If Australian courses appear, fees are international rates
- [ ] Course Explorer shows visa requirements link for non-UK countries
- [ ] International Students Office link appears in Support tab
- [ ] Free MOOC alternatives shown (if any in medicine domain)

---

### Persona 5: MIKE — Career-Changing Mature Learner
**Purpose**: Tests online/free course filtering and certificate-level matching.

| Field | Value |
|-------|-------|
| Name | Mike |
| Nationality | American |
| Residence | USA |
| Subject | Web development, programming, software engineering |
| Level | Certificate |
| Mode | Online, Part-time |
| Interests | Career change, freelancing |
| Skills | Self-motivated, problem-solving |
| Locations | (leave empty) |
| Options | Worldwide, Include online, Free/low-cost ALL checked |

**Expected outcomes to verify:**
- [ ] Nationality resolves to "USA"
- [ ] Domain detected as "Computer Science"
- [ ] Results heavily weighted toward online/free courses
- [ ] CS50 (Harvard/edX), The Odin Project, MIT OCW all appear near top
- [ ] FREE and ONLINE badges shown on cards
- [ ] "Show Free Alternatives" toggle works — filters to free only
- [ ] US courses show home fee rate (FAFSA eligible)
- [ ] Funding includes Federal Student Aid (FAFSA), Pell Grants
- [ ] Coursera Financial Aid, edX Financial Assistance in funding links
- [ ] Fee shown as "Free" or £0 for MOOC courses

---

### Persona 6: LUCA — Postgraduate Researcher
**Purpose**: Tests postgraduate level filtering and research-focused matching.

| Field | Value |
|-------|-------|
| Name | Luca |
| Nationality | Italian |
| Residence | Italy |
| Subject | Environmental science, conservation, sustainability |
| Level | Postgraduate |
| Mode | Full-time |
| Interests | Climate change, biodiversity, fieldwork |
| Skills | Research methods, data analysis, GIS |
| Locations | UK, Netherlands, Denmark, Sweden |

**Expected outcomes to verify:**
- [ ] Nationality resolves to "Italy"
- [ ] Domain detected as "Environment" (agriculture_environment)
- [ ] MSc Conservation Science (Imperial) appears — PG fee shown
- [ ] Italian = EU/EEA, so Nordic courses show home/EU fee rates
- [ ] Funding includes Study in Italy scholarships, Holland Scholarship
- [ ] Free tuition link for Nordic universities
- [ ] Copenhagen/Uppsala COL data shown if matched
- [ ] Career pathways show Conservation Scientist, Biodiversity Officer etc.
- [ ] Preparation tab shows relevant Coursera/edX links for environmental subjects
- [ ] Only postgraduate courses shown (no UG results)

---

## Step-by-Step Testing Procedure

For each persona, follow these steps:

### A. Questionnaire Flow (Steps 1-7)
1. Click "Start Matching" on landing page
2. Enter name, nationality, residence per persona
3. **VERIFY**: nationality resolves correctly, UK sub-nation appears if British
4. Enter subject, select level and mode
5. **VERIFY**: domain detection shows correct domain in green
6. Fill interests, skills, learning style, locations
7. **VERIFY**: review page (step 7) shows all entered data correctly
8. Click "Generate [Name]'s Matches"
9. **VERIFY**: loading screen shows personalised message

### B. Results Dashboard
10. **VERIFY**: results count, stats bar (top %, avg %, free count, countries)
11. **VERIFY**: fee amounts are correct for this persona's nationality
12. Test sort dropdown: Best Match → Lowest Fee → Employability
13. Test "Free Only" toggle
14. Test "New Search" button returns to questionnaire

### C. Course Explorer (click top result)
15. **VERIFY**: course title, institution name, location, duration correct
16. **VERIFY**: "Apply / Course Page" button links to real institution URL
17. **Costs tab**: fee matches nationality, COL data present for city, funding links clickable
18. **Institution tab**: description, founded year, student count, website link
19. **Preparation tab**: entry requirements shown, Coursera/edX/FutureLearn links work
20. **Map tab**: OpenStreetMap iframe loads (or Google Maps fallback link)
21. **Support tab**: contact email, student support links, visa info if international
22. **VERIFY**: "Back to results" returns to results list

### D. Cross-checks
23. Click a different course — verify Explorer updates
24. Click a free online alternative — verify it loads in Explorer
25. Navigate to `/admin` — verify admin dashboard loads (may show empty if no DB)

---

## Feedback Report Template

Copy this template for each test session. Fill in one per persona tested.

```
═══════════════════════════════════════════════════════════════
MCM TEST REPORT
═══════════════════════════════════════════════════════════════

Tester:        [Your name]
Date:          [YYYY-MM-DD]
Persona:       [e.g. SARAH — British UG from England]
Browser:       [e.g. Chrome 124, Firefox 126, Safari 18]
Screen size:   [e.g. Desktop 1920x1080, Laptop 1366x768, Mobile 390x844]

═══════════════════════════════════════════════════════════════
SECTION 1: BUGS (things that are broken)
═══════════════════════════════════════════════════════════════

Format per bug:
  BUG-[number]: [Short title]
  Severity: CRITICAL / HIGH / MEDIUM / LOW
  Page: [Landing / Questionnaire Step N / Results / Explorer Tab]
  Steps to reproduce:
    1.
    2.
    3.
  Expected behaviour:
  Actual behaviour:
  Screenshot: [attach or describe]

Example:
  BUG-001: Scottish fee showing £9,250 instead of £1,820
  Severity: CRITICAL
  Page: Results
  Steps to reproduce:
    1. Select British, Scotland
    2. Search for Business, Undergraduate
    3. View University of St Andrews result
  Expected: Fee = £1,820 (SAAS home rate)
  Actual: Fee = £9,250 (rest-of-UK rate)

───────────────────────────────────────────────────────────────

═══════════════════════════════════════════════════════════════
SECTION 2: USER EXPERIENCE ISSUES (things that feel wrong)
═══════════════════════════════════════════════════════════════

Format per issue:
  UX-[number]: [Short title]
  Impact: HIGH / MEDIUM / LOW
  Page: [where it occurs]
  Description: [what felt wrong, confusing, or slow]
  Suggestion: [how it could be improved]

Example:
  UX-001: No visual feedback when selecting UK sub-nation
  Impact: MEDIUM
  Page: Questionnaire Step 1
  Description: After clicking "England", the button highlights but there
               is no confirmation text like "Fees calculated for England"
  Suggestion: Add a brief confirmation message below the buttons

───────────────────────────────────────────────────────────────

═══════════════════════════════════════════════════════════════
SECTION 3: USER STORIES FOR REMEDIATION
═══════════════════════════════════════════════════════════════

Format (one per story):
  US-[number]: [Title]
  As a [type of user],
  I want [goal],
  So that [benefit].

  Acceptance criteria:
  - [ ] [Criterion 1]
  - [ ] [Criterion 2]

  Priority: MUST / SHOULD / COULD
  Linked bugs: [BUG-xxx, UX-xxx]

Example:
  US-001: Save and resume questionnaire
  As a prospective student,
  I want my questionnaire answers saved if I close the browser,
  So that I don't have to re-enter everything next time.

  Acceptance criteria:
  - [ ] Answers persist in localStorage
  - [ ] On return, user sees "Continue where you left off?" prompt
  - [ ] Clear button resets saved data

  Priority: SHOULD
  Linked bugs: none

───────────────────────────────────────────────────────────────

═══════════════════════════════════════════════════════════════
SECTION 4: ENHANCEMENT PROPOSALS
═══════════════════════════════════════════════════════════════

Format per proposal:
  ENH-[number]: [Title]
  Category: FEATURE / PERFORMANCE / DATA / DESIGN / ACCESSIBILITY
  Description: [What should be added or improved]
  Business value: [Why this matters for Future Horizons Education]
  Effort estimate: SMALL (< 1 day) / MEDIUM (1-3 days) / LARGE (1+ week)
  Dependencies: [What must exist first]

Example:
  ENH-001: PDF report download
  Category: FEATURE
  Description: Add "Download PDF Report" button on results page that
               generates a branded PDF with top 10 matches, fee comparison,
               COL table, and funding links.
  Business value: Core product differentiator. Enables premium tier.
               Students can share with parents/advisors.
  Effort estimate: MEDIUM
  Dependencies: Results page must be functional

───────────────────────────────────────────────────────────────

═══════════════════════════════════════════════════════════════
SECTION 5: DATA QUALITY OBSERVATIONS
═══════════════════════════════════════════════════════════════

  Missing courses: [Any courses you expected but didn't see]
  Wrong fees: [Any fees that looked incorrect]
  Missing COL: [Cities without cost-of-living data]
  Broken links: [Any apply/funding/institution URLs that 404]
  Missing institutions: [Universities that should be in the database]
  Domain mismatches: [Courses classified into the wrong subject area]

───────────────────────────────────────────────────────────────

═══════════════════════════════════════════════════════════════
SECTION 6: OVERALL SCORES (1-5 scale, 5 = excellent)
═══════════════════════════════════════════════════════════════

  Visual design:           [ ] / 5
  Ease of use:             [ ] / 5
  Match quality:           [ ] / 5
  Fee accuracy:            [ ] / 5
  Course Explorer depth:   [ ] / 5
  Mobile responsiveness:   [ ] / 5
  Loading speed:           [ ] / 5
  Overall impression:      [ ] / 5

  Top 3 strengths:
  1.
  2.
  3.

  Top 3 improvements needed:
  1.
  2.
  3.

═══════════════════════════════════════════════════════════════
```

---

## Testing Priority Matrix

| Priority | What to Test | Why |
|----------|-------------|-----|
| **P0 — Critical** | Fee calculations for all 6 personas | Core value proposition. Wrong fees = lost trust |
| **P0 — Critical** | Scottish three-tier fee logic (Persona 2) | Most complex fee path, historically buggy |
| **P1 — High** | Domain detection accuracy | 55% of matching weight depends on this |
| **P1 — High** | Course Explorer all 5 tabs | Primary product differentiator |
| **P1 — High** | Funding links are clickable and correct | Direct user value |
| **P2 — Medium** | Sort/filter on results page | Usability |
| **P2 — Medium** | Free alternatives toggle | Key feature for cost-conscious users |
| **P2 — Medium** | Mobile layout (test at 390px width) | Growing mobile audience |
| **P3 — Low** | Admin panel functionality | Internal tool, lower urgency |
| **P3 — Low** | Edge cases (empty fields, special characters) | Robustness |

---

## Known Limitations (Do Not Report as Bugs)

These are known Phase 2 constraints, not bugs:

1. **Admin panel shows empty data** if PostgreSQL is not running (expected — JSON fallback only serves public pages)
2. **OpenStreetMap iframe** may not load in some browser privacy modes
3. **119 courses only** until scrapers are activated against live sources
4. **No user accounts** — this is Phase 3
5. **No PDF export** — this is Phase 3
6. **Mobile layout** has known grid issues on screens < 400px — logged for Phase 3

---

*Testing guide prepared for Future Horizons Education — April 2026*
