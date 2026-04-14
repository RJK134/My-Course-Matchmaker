# n8n Workflows for MyCourseMatchmaker

Import these workflow JSON files into your n8n instance at `rjk134.app.n8n.cloud`.

## Workflows

### 1. `weekly-course-scrape.json`
**Schedule**: Every Sunday at 02:00 UTC
**Purpose**: Master orchestrator that triggers each scraper source via the MCM API, waits for completion, uploads raw data to OneDrive, and imports results into the staging table.

### 2. `col-scrape.json`
**Schedule**: Runs after course scrape completes
**Purpose**: Finds cities in the course database without cost-of-living data and scrapes Numbeo for their living costs.

### 3. `data-quality-report.json`
**Schedule**: Every Sunday at 06:00 UTC
**Purpose**: Generates a summary report of recent scrape activity and emails it.

### 4. `onedrive-backup.json`
**Schedule**: Every Sunday at 08:00 UTC
**Purpose**: Exports the full course and institution databases to OneDrive as JSON backups. Cleans up exports older than 90 days.

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
