# Mac Workhorse Integration — Expanded Course Database Architecture

## Problem

The Windows development machine (Richard's XPS) runs the MCM frontend and API. A separate MacBook ("the workhorse") runs heavy-duty scraping and data collection, building an expanded course database of 10,000+ courses. These two machines need to share a common database so the frontend can serve all scraped courses.

## Architecture Options

### Option A: Shared PostgreSQL via Network (Recommended)

```
┌─────────────────────────────┐     ┌─────────────────────────────┐
│  MacBook Workhorse          │     │  Windows XPS (Dev Machine)  │
│                             │     │                             │
│  ┌─────────────────┐        │     │  ┌─────────────────┐        │
│  │ Scraper Pipeline │        │     │  │ React Frontend   │        │
│  │ (UCAS, QS, etc.) │        │     │  │ (port 5180)      │        │
│  └────────┬────────┘        │     │  └────────┬────────┘        │
│           │ writes           │     │           │ reads           │
│           ▼                  │     │           ▼                  │
│  ┌─────────────────┐        │     │  ┌─────────────────┐        │
│  │ PostgreSQL DB    │◄──────────────►│ Express API      │        │
│  │ (port 5432)      │  network │     │ (port 3001)      │        │
│  │ 10,000+ courses  │        │     │  └─────────────────┘        │
│  └─────────────────┘        │     │                             │
│  ┌─────────────────┐        │     │  JSON fallback (125 courses)│
│  │ n8n Workflows    │        │     │  for when Mac is offline    │
│  │ (weekly schedule) │        │     │                             │
│  └─────────────────┘        │     │                             │
└─────────────────────────────┘     └─────────────────────────────┘
```

**How it works:**
1. PostgreSQL runs on the MacBook with the full 10K+ course database
2. Mac's PostgreSQL is accessible on the local network (e.g. `192.168.x.x:5432`)
3. Windows API connects to Mac's PostgreSQL via the network IP
4. Frontend on Windows calls the local API, which queries the Mac's database
5. When the Mac is offline, frontend falls back to the static JSON files (125 courses)

**Setup on MacBook:**
```bash
# Install PostgreSQL
brew install postgresql@16
brew services start postgresql@16

# Create the MCM database
createdb coursematchmaker
psql coursematchmaker < schema.sql
psql coursematchmaker < migrations/001_scraping_schema.sql

# Allow network connections — edit postgresql.conf
# listen_addresses = '*'

# Edit pg_hba.conf to allow the Windows machine
# host all mcm 192.168.0.0/24 md5

# Restart PostgreSQL
brew services restart postgresql@16
```

**Setup on Windows (`api/.env`):**
```env
DB_HOST=192.168.x.x    # Mac's local IP
DB_PORT=5432
DB_NAME=coursematchmaker
DB_USER=mcm
DB_PASSWORD=<secure-password>
```

**Pros:** Simple, single source of truth, real-time data
**Cons:** Requires both machines on same network, Mac must be running

---

### Option B: JSON File Sync via OneDrive (Simpler)

```
┌─────────────────────────────┐     ┌─────────────────────────────┐
│  MacBook Workhorse          │     │  Windows XPS (Dev Machine)  │
│                             │     │                             │
│  Scrapers → PostgreSQL      │     │  React Frontend             │
│       │                     │     │       │                     │
│       ▼                     │     │       ▼                     │
│  Export JSON ──► OneDrive ──────► Import JSON → courses.json    │
│  (weekly cron)   (auto-sync) │     │  (auto-detect new file)    │
│                             │     │                             │
└─────────────────────────────┘     └─────────────────────────────┘
```

**How it works:**
1. Mac scrapes courses into its local PostgreSQL
2. Weekly cron exports the full database as `courses-export.json` to OneDrive
3. OneDrive syncs automatically to the Windows machine
4. A watcher script on Windows detects the new file and updates `frontend/src/data/courses.json`
5. Frontend rebuilds with the new data

**Mac export script (`scripts/export-to-onedrive.sh`):**
```bash
#!/bin/bash
EXPORT_DIR="$HOME/OneDrive/MyCourseMatchmaker/exports"
DATE=$(date +%Y-%m-%d)

psql -U mcm -d coursematchmaker -c "\COPY (SELECT row_to_json(c) FROM courses c) TO STDOUT" \
  | jq -s '.' > "$EXPORT_DIR/courses-$DATE.json"

psql -U mcm -d coursematchmaker -c "\COPY (SELECT row_to_json(i) FROM institutions i) TO STDOUT" \
  | jq -s '.' > "$EXPORT_DIR/institutions-$DATE.json"

# Also create a "latest" symlink
cp "$EXPORT_DIR/courses-$DATE.json" "$EXPORT_DIR/courses-latest.json"
cp "$EXPORT_DIR/institutions-$DATE.json" "$EXPORT_DIR/institutions-latest.json"
```

**Windows import script (`scripts/import-from-onedrive.js`):**
```javascript
const fs = require('fs');
const path = require('path');

const ONEDRIVE = process.env.ONEDRIVE || path.join(process.env.USERPROFILE, 'OneDrive');
const EXPORT_DIR = path.join(ONEDRIVE, 'MyCourseMatchmaker', 'exports');
const DATA_DIR = path.join(__dirname, '..', 'frontend', 'src', 'data');

const files = ['courses-latest.json', 'institutions-latest.json'];
for (const file of files) {
  const src = path.join(EXPORT_DIR, file);
  const dest = path.join(DATA_DIR, file.replace('-latest', ''));
  if (fs.existsSync(src)) {
    const srcStat = fs.statSync(src);
    const destStat = fs.existsSync(dest) ? fs.statSync(dest) : null;
    if (!destStat || srcStat.mtimeMs > destStat.mtimeMs) {
      fs.copyFileSync(src, dest);
      console.log(`Updated ${dest} (${srcStat.size} bytes)`);
    }
  }
}
```

**Pros:** Works when machines are on different networks, no PostgreSQL config needed on Windows
**Cons:** Data is stale (weekly sync), larger JSON files (10K courses = ~7MB)

---

### Option C: Hybrid — Mac PostgreSQL + OneDrive Backup (Best of Both)

```
MacBook Workhorse
  └── PostgreSQL (primary, 10K+ courses)
  └── Scrapers run here (weekly via n8n)
  └── OneDrive export (weekly backup)

Windows XPS
  └── API connects to Mac PostgreSQL when available
  └── Falls back to OneDrive JSON when Mac is offline
  └── Frontend always works (JSON fallback built in)
```

**Implementation:**
1. Mac hosts PostgreSQL as the primary database
2. Weekly n8n workflow exports full DB to OneDrive as JSON
3. Windows API tries Mac PostgreSQL first, falls back to local SQLite or JSON
4. Frontend DataLoader already has the fallback pattern (App.jsx lines 22-74)

---

## Recommended: Option C (Hybrid)

### Mac Workhorse Setup

**1. PostgreSQL Installation and Configuration:**
```bash
# Install
brew install postgresql@16
brew services start postgresql@16

# Create database and user
createuser -P mcm              # Set password
createdb -O mcm coursematchmaker

# Apply schemas
psql -U mcm -d coursematchmaker -f api/db/schema.sql
psql -U mcm -d coursematchmaker -f api/db/migrations/001_scraping_schema.sql

# Seed initial data from JSON files
cd api && node db/seed.js

# Allow network access
echo "listen_addresses = '*'" >> $(brew --prefix)/var/postgresql@16/postgresql.conf
echo "host all mcm 192.168.0.0/24 md5" >> $(brew --prefix)/var/postgresql@16/pg_hba.conf
brew services restart postgresql@16
```

**2. Clone the repo and install scraper dependencies:**
```bash
git clone https://github.com/RJK134/My-Course-Matchmaker.git
cd My-Course-Matchmaker/scrapers
npm install
npx playwright install chromium
```

**3. Run scrapers on the Mac:**
```bash
# Test with small batch
node index.js --source mooc --limit 50

# Full scrape
node index.js --source ucas
node index.js --source studyportals
node index.js --source qs_the
node index.js --source mooc
```

**4. Set up weekly cron (alternative to n8n):**
```bash
# crontab -e
0 2 * * 0 cd ~/My-Course-Matchmaker/scrapers && node index.js --source mooc >> ~/mcm-scrape.log 2>&1
0 3 * * 0 cd ~/My-Course-Matchmaker/scrapers && node index.js --source ucas >> ~/mcm-scrape.log 2>&1
0 4 * * 0 cd ~/My-Course-Matchmaker/scrapers && node index.js --source studyportals >> ~/mcm-scrape.log 2>&1
0 5 * * 0 cd ~/My-Course-Matchmaker/scrapers && node index.js --source qs_the >> ~/mcm-scrape.log 2>&1
```

**5. Weekly export to OneDrive:**
```bash
0 8 * * 0 cd ~/My-Course-Matchmaker && node scripts/export-to-onedrive.js >> ~/mcm-export.log 2>&1
```

### Windows XPS Configuration

**Update `api/.env` to point to Mac:**
```env
PORT=3001
DB_HOST=192.168.x.x       # Mac's IP on local network
DB_PORT=5432
DB_NAME=coursematchmaker
DB_USER=mcm
DB_PASSWORD=<password>

# Fallback for when Mac is offline
DB_FALLBACK=json
```

**Update `api/db/pool.js` to handle connection failures gracefully:**
```javascript
const pool = new Pool({ ... });

pool.on('error', (err) => {
  console.error('Database connection lost:', err.message);
  // Don't crash — frontend will use JSON fallback
});

module.exports = pool;
```

---

## Data Flow with Mac Integration

```
Weekly Schedule (Mac)
    │
    ├── UCAS scraper ──────► 3-5K UK courses
    ├── StudyPortals scraper ► 3-4K European courses
    ├── QS/THE scraper ────► 1-2K ranked programmes
    ├── MOOC scraper ──────► 1-2K online courses
    └── Numbeo COL scraper ► 100+ cities
              │
              ▼
    Mac PostgreSQL (10,000+ courses)
              │
    ┌─────────┼──────────┐
    │         │          │
    ▼         ▼          ▼
  Network   OneDrive   n8n Report
  (live)    (backup)   (email)
    │         │
    ▼         ▼
  Windows   JSON Fallback
  API       (offline mode)
    │
    ▼
  Frontend (localhost:5180)
  └── 10,000+ courses live
```

---

## File Changes Required

```
D:/Projects/MyCourseMatchmaker/
  api/
    db/pool.js                    MODIFY — graceful connection failure
    .env                          MODIFY — Mac PostgreSQL IP
  scripts/                        NEW DIRECTORY
    export-to-onedrive.js         NEW — weekly DB export
    import-from-onedrive.js       NEW — Windows-side JSON import
    setup-mac-db.sh               NEW — Mac PostgreSQL setup script
  .github/
    MAC_WORKHORSE_INTEGRATION.md  NEW — this document
```
