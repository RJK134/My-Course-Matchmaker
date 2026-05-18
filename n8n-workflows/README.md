# n8n Workflows for MyCourseMatchmaker

Import these workflow JSON files into your n8n instance at `rjk134.app.n8n.cloud`.

## Workflows

### 1. `weekly-course-scrape.json`
**Schedule**: Every Sunday at 02:00 UTC
**Purpose**: Master orchestrator that triggers each scraper source via the MCM API, waits for completion, uploads raw data to OneDrive, and imports results into the staging table.

### 2. `col-scrape.json`
**Schedule**: Every Sunday at 06:00 UTC
**Purpose**: Asks the MCM API for cities referenced by courses but missing
COL data (`GET /api/admin/cities/missing-col`), scrapes each city's Numbeo
page, parses the headline rent/food/transport numbers, and upserts via
`POST /api/admin/col`.

### 3. `data-quality-report.json`
**Schedule**: Every Sunday at 06:00 UTC
**Purpose**: Fans out to `/api/admin/stats`, `/api/admin/scrape/report/latest`
and `/api/search/health`, composes a Markdown digest (corpus counts, source
freshness, Meilisearch document count), and emails it to
`MCM_REPORT_RECIPIENT`.

### 4. `onedrive-backup.json`
**Schedule**: Every Sunday at 08:00 UTC
**Purpose**: Exports the full courses + institutions tables via
`/api/admin/export/*`, writes dated + `-latest` JSON copies to
`MyCourseMatchmaker/exports/` on OneDrive, and reaps anything older than
90 days on a second 09:00 trigger.

## Setup

1. Configure n8n credentials:
   - **HTTP Header Auth**: Create credential with header `x-admin-key` and your `ADMIN_API_KEY` value
   - **Microsoft OneDrive OAuth2**: Connect your OneDrive account
   - **SMTP** (optional): For email reports

2. Set n8n environment variable: `MCM_API_URL` = `http://your-api-host:3001`

3. Import each workflow JSON file via n8n UI → Workflows → Import from File

## OneDrive Folder Structure

```
MyCourseMatchmaker/
  raw-scrapes/
    ucas/
    studyportals/
    qs-the/
    mooc/
    col/
  exports/
  reports/
```
