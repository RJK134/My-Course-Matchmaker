CREATE TABLE IF NOT EXISTS institutions (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  founded INTEGER,
  students INTEGER,
  url VARCHAR(500),
  apply_url VARCHAR(500),
  contact_email VARCHAR(255),
  latitude DECIMAL(9,6),
  longitude DECIMAL(9,6),
  description TEXT
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  institution_key VARCHAR(100) REFERENCES institutions(key),
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
  is_free BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS cost_of_living (
  id SERIAL PRIMARY KEY,
  city VARCHAR(100) UNIQUE NOT NULL,
  rent INTEGER NOT NULL,
  food INTEGER NOT NULL,
  transport INTEGER NOT NULL,
  utilities INTEGER NOT NULL,
  misc INTEGER NOT NULL,
  currency VARCHAR(10) NOT NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS domain_families (
  id SERIAL PRIMARY KEY,
  domain_key VARCHAR(50) UNIQUE NOT NULL,
  display_label VARCHAR(100) NOT NULL,
  keywords TEXT[] NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_courses_domain ON courses(domain);
CREATE INDEX IF NOT EXISTS idx_courses_country ON courses(country);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);
CREATE INDEX IF NOT EXISTS idx_courses_institution ON courses(institution_key);
