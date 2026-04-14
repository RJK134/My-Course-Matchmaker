-- Migration 001: Scraping infrastructure tables
-- Run after initial schema.sql

-- ─── Source registry ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scrape_sources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  base_url VARCHAR(500),
  scraper_type VARCHAR(20) NOT NULL, -- 'api', 'cheerio', 'playwright'
  last_run_at TIMESTAMPTZ,
  last_run_status VARCHAR(20), -- 'success', 'partial', 'failed'
  last_run_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Scrape run audit trail ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scrape_runs (
  id SERIAL PRIMARY KEY,
  source_id INTEGER REFERENCES scrape_sources(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'running', -- 'running', 'success', 'partial', 'failed'
  courses_found INTEGER DEFAULT 0,
  courses_new INTEGER DEFAULT 0,
  courses_updated INTEGER DEFAULT 0,
  courses_rejected INTEGER DEFAULT 0,
  error_log TEXT,
  onedrive_path VARCHAR(500)
);

-- ─── Staging table for unapproved scraped courses ────────────────────────────
CREATE TABLE IF NOT EXISTS staging_courses (
  id SERIAL PRIMARY KEY,
  source_id INTEGER REFERENCES scrape_sources(id),
  scrape_run_id INTEGER REFERENCES scrape_runs(id),
  source_url VARCHAR(500),
  source_course_id VARCHAR(200),

  -- Mirror of courses table fields
  title VARCHAR(255) NOT NULL,
  institution_key VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  level VARCHAR(50) NOT NULL,
  mode TEXT[] NOT NULL,
  domain VARCHAR(50) NOT NULL,
  subjects TEXT[] NOT NULL,
  fee_home NUMERIC(10,2),
  fee_intl NUMERIC(10,2),
  fee_scotland NUMERIC(10,2),
  living_cost NUMERIC(10,2),
  duration VARCHAR(50),
  ranking INTEGER,
  entry_reqs TEXT,
  career_paths TEXT[],
  avg_salary VARCHAR(50),
  employability INTEGER,
  is_online BOOLEAN DEFAULT FALSE,
  is_free BOOLEAN DEFAULT FALSE,

  -- Classification and quality
  confidence_score NUMERIC(3,2) DEFAULT 0,
  auto_classified_domain VARCHAR(50),
  data_quality_score NUMERIC(3,2) DEFAULT 0,

  -- Review workflow
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'merged'
  reviewed_by VARCHAR(100),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  duplicate_of INTEGER REFERENCES courses(id),

  -- Raw payload
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Deduplication index ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_dedup_index (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  fingerprint VARCHAR(64) NOT NULL,
  title_norm VARCHAR(255),
  UNIQUE(fingerprint)
);

-- ─── Extend existing tables ──────────────────────────────────────────────────

-- Courses: add provenance tracking
ALTER TABLE courses ADD COLUMN IF NOT EXISTS source_id INTEGER REFERENCES scrape_sources(id);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS source_url VARCHAR(500);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS source_course_id VARCHAR(200);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS data_quality_score NUMERIC(3,2);
ALTER TABLE courses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Institutions: add location and provenance
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS source_id INTEGER REFERENCES scrape_sources(id);
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Cost of living: add source tracking
ALTER TABLE cost_of_living ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE cost_of_living ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';
ALTER TABLE cost_of_living ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ;
ALTER TABLE cost_of_living ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_staging_status ON staging_courses(status);
CREATE INDEX IF NOT EXISTS idx_staging_source ON staging_courses(source_id);
CREATE INDEX IF NOT EXISTS idx_staging_domain ON staging_courses(domain);
CREATE INDEX IF NOT EXISTS idx_courses_source ON courses(source_id);
CREATE INDEX IF NOT EXISTS idx_dedup_fingerprint ON course_dedup_index(fingerprint);
CREATE INDEX IF NOT EXISTS idx_courses_updated ON courses(updated_at);
CREATE INDEX IF NOT EXISTS idx_scrape_runs_source ON scrape_runs(source_id);

-- ─── Seed the four scrape sources ────────────────────────────────────────────
INSERT INTO scrape_sources (name, display_name, base_url, scraper_type) VALUES
  ('ucas', 'UCAS (UK Courses)', 'https://digital.ucas.com/coursedisplay', 'playwright'),
  ('studyportals', 'StudyPortals / study.eu', 'https://www.bachelorsportal.com', 'cheerio'),
  ('qs_the', 'QS/THE Rankings', 'https://www.topuniversities.com/programs', 'playwright'),
  ('mooc', 'Coursera/edX/FutureLearn', 'https://www.coursera.org/courses', 'api')
ON CONFLICT (name) DO NOTHING;
