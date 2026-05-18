// Deterministic mapper from the 98 distinct subject_area values that
// appear in the lake (UCAS / CUG / WhatUni / OFQUAL) to the 19
// DOMAIN_FAMILIES keys MyCourseMatchmaker uses for matching, faceting
// and the visual domain badge.
//
// Strategy:
//   1. Direct hash lookup on the lowercased subject string.
//   2. Substring contains-match against tagged token lists.
//   3. Fall through to 'other' (so the indexer never throws and the
//      facet stays honest about unmapped rows).

const DIRECT = {
  // computer_science
  'computer science': 'computer_science',
  'cyber security': 'computer_science',
  'cybersecurity': 'computer_science',
  'artificial intelligence': 'computer_science',
  'data science': 'computer_science',
  'information technology and systems': 'computer_science',

  // engineering
  'engineering': 'engineering',
  'general engineering': 'engineering',
  'mechanical engineering': 'engineering',
  'electrical and electronic engineering': 'engineering',
  'chemical engineering': 'engineering',
  'civil engineering': 'engineering',
  'aeronautical and aerospace engineering': 'engineering',
  'manufacturing and production engineering': 'engineering',
  'medical technology and bioengineering': 'engineering',
  'materials technology': 'engineering',
  'building': 'engineering',

  // sciences
  'biology': 'sciences',
  'biological sciences': 'sciences',
  'biomedical sciences': 'sciences',
  'chemistry': 'sciences',
  'physics': 'sciences',
  'physics and astronomy': 'sciences',
  'mathematics': 'sciences',
  'geology': 'sciences',
  'food science': 'sciences',
  'forensic science': 'sciences',
  'pharmacology and pharmacy': 'sciences',

  // medicine_health
  'medicine': 'medicine_health',
  'nursing': 'medicine_health',
  'dentistry': 'medicine_health',
  'veterinary medicine': 'medicine_health',
  'physiotherapy': 'medicine_health',
  'health studies': 'medicine_health',
  'paramedic science': 'medicine_health',
  'optometry ophthalmics and orthoptics': 'medicine_health',
  'complementary medicine': 'medicine_health',
  'speech and language therapy': 'medicine_health',
  'counselling psychotherapy and occupational therapy': 'medicine_health',

  // business
  'business': 'business',
  'business management': 'business',
  'business and management studies': 'business',
  'accounting': 'business',
  'accounting and finance': 'business',
  'finance': 'business',
  'marketing': 'business',
  'economics': 'business',

  // law
  'law': 'law',
  'criminology': 'law',

  // social_sciences
  'psychology': 'social_sciences',
  'sociology': 'social_sciences',
  'anthropology': 'social_sciences',
  'politics': 'social_sciences',
  'international relations': 'social_sciences',
  'social work': 'social_sciences',
  'social policy': 'social_sciences',
  'childhood and youth studies': 'social_sciences',

  // humanities
  'history': 'humanities',
  'history of art architecture and design': 'humanities',
  'classics': 'humanities',
  'philosophy': 'humanities',
  'theology and religious studies': 'humanities',
  'archaeology': 'humanities',
  'linguistics': 'humanities',
  'languages': 'humanities',
  'english': 'humanities',
  'french': 'humanities',
  'german': 'humanities',
  'italian': 'humanities',
  'iberian languages': 'humanities',
  'russian and east european languages': 'humanities',
  'celtic studies': 'humanities',
  'asian studies': 'humanities',
  'african and middle eastern studies': 'humanities',
  'american studies': 'humanities',

  // creative_writing
  'creative writing': 'creative_writing',
  'journalism': 'creative_writing',
  'communication and media studies': 'creative_writing',
  'media studies': 'creative_writing',

  // film_media
  'film': 'film_media',
  'film studies': 'film_media',
  'drama dance and cinematics': 'film_media',

  // performing_arts
  'drama': 'performing_arts',

  // music
  'music': 'music',
  'arts music institutions': 'music',

  // visual_arts
  'art': 'visual_arts',
  'art and design': 'visual_arts',

  // design
  'design': 'design',
  'fashion': 'design',

  // architecture
  'architecture': 'architecture',
  'town and country planning and landscape design': 'architecture',
  'land and property management': 'architecture',

  // education
  'education': 'education',

  // sports
  'sports science': 'sports',

  // hospitality_tourism
  'tourism transport travel and heritage studies': 'hospitality_tourism',

  // agriculture_environment
  'agriculture and forestry': 'agriculture_environment',
  'geography': 'agriculture_environment',
  'geography and environmental science': 'agriculture_environment',
};

// Token fallbacks for subjects not in DIRECT. Order matters — first match wins.
const TOKEN_RULES = [
  [['compute', 'comput'], 'computer_science'],
  [['cyber', 'security', 'data', 'ai', 'machine'], 'computer_science'],
  [['engine', 'mechan', 'electrical', 'manufact'], 'engineering'],
  [['nurs', 'medic', 'health', 'clinic', 'pharm', 'dent', 'physio'], 'medicine_health'],
  [['biolog', 'chem', 'physic', 'math', 'science', 'astron'], 'sciences'],
  [['business', 'manag', 'account', 'financ', 'market', 'econ', 'mba'], 'business'],
  [['law', 'crimin'], 'law'],
  [['psycholog', 'sociolog', 'politic', 'social', 'anthrop'], 'social_sciences'],
  [['history', 'philos', 'theol', 'archae', 'lingu', 'languag', 'classic', 'english', 'french', 'german', 'italian'], 'humanities'],
  [['writ', 'journal', 'media', 'communic'], 'creative_writing'],
  [['film', 'cinema'], 'film_media'],
  [['drama', 'theatre', 'theater', 'perform', 'dance'], 'performing_arts'],
  [['music'], 'music'],
  [['art'], 'visual_arts'],
  [['design', 'fashion'], 'design'],
  [['architect', 'urban', 'plan'], 'architecture'],
  [['educa', 'teach', 'pedagog'], 'education'],
  [['sport', 'kinesiol', 'coach'], 'sports'],
  [['hospital', 'tour', 'hotel', 'culin'], 'hospitality_tourism'],
  [['agricultur', 'forest', 'environment', 'geograph', 'conservation'], 'agriculture_environment'],
];

export function mapSubjectToDomain(subjectArea) {
  if (!subjectArea) return 'other';
  const s = String(subjectArea).trim().toLowerCase();
  if (DIRECT[s]) return DIRECT[s];
  for (const [tokens, domain] of TOKEN_RULES) {
    if (tokens.some((t) => s.includes(t))) return domain;
  }
  return 'other';
}

export function listKnownSubjects() {
  return Object.keys(DIRECT).sort();
}
