// Fuzzy-match a lake row's `provider` string against the curated
// institutions catalogue (frontend/src/data/institutions.json) so the
// indexer can enrich the doc with country/city/lat/lng/ranking.
//
// Algorithm:
//   1. Strict equality on `full_name` then `key`, both case-insensitive.
//   2. Normalised match: drop common noise tokens ("the", "university",
//      "of", "college", etc.), compare token sets via Jaccard similarity.
//   3. Threshold: return a match if Jaccard ≥ 0.6 and at least one
//      non-noise token overlaps. Otherwise null.
//
// Built once per process — institutions list is ~105 rows so the O(N)
// scan per provider is fine.

import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const INSTITUTIONS_PATH = join(REPO_ROOT, 'frontend', 'src', 'data', 'institutions.json');

const NOISE = new Set([
  'the', 'and', 'of', 'a', 'an',
  'university', 'universities', 'college', 'school', 'institute',
  'academy', 'centre', 'center',
]);

function tokenise(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !NOISE.has(t));
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection++;
  return intersection / (a.size + b.size - intersection);
}

let INSTITUTIONS = null;

function load() {
  if (INSTITUTIONS) return INSTITUTIONS;
  const raw = JSON.parse(readFileSync(INSTITUTIONS_PATH, 'utf8'));
  INSTITUTIONS = raw.map((i) => ({
    key: i.key,
    full: i.full || i.full_name || i.key,
    type: i.type,
    country: i.country || null,
    city: i.city || null,
    lat: i.lat ?? null,
    lng: i.lng ?? null,
    url: i.url || null,
    apply: i.apply || null,
    students: i.students || null,
    founded: i.founded || null,
    _byNameLower: (i.full || i.key).toLowerCase(),
    _byKeyLower: i.key.toLowerCase(),
    _tokens: new Set(tokenise(i.full || i.key)),
  }));
  return INSTITUTIONS;
}

export function resolveInstitution(providerString) {
  if (!providerString) return null;
  const insts = load();
  const lower = String(providerString).trim().toLowerCase();

  // 1. Exact match
  for (const inst of insts) {
    if (inst._byNameLower === lower || inst._byKeyLower === lower) {
      return { ...inst, _matchType: 'exact', _matchScore: 1 };
    }
  }

  // 2. Token similarity
  const provTokens = new Set(tokenise(providerString));
  if (provTokens.size === 0) return null;
  let best = null;
  let bestScore = 0;
  for (const inst of insts) {
    const score = jaccard(provTokens, inst._tokens);
    if (score > bestScore) {
      bestScore = score;
      best = inst;
    }
  }
  if (best && bestScore >= 0.6) {
    return { ...best, _matchType: 'fuzzy', _matchScore: Number(bestScore.toFixed(2)) };
  }
  return null;
}

export function getAllInstitutions() {
  return load();
}
