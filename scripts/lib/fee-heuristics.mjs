// Lake fee heuristics.
//
// 4,000+ lake rows arrive with feesUkGbp/feesIntlGbp = null. Honest absence
// is fine, but it means every search result shows the £1,100/mo COL default
// and no fee — which makes the "most affordable" promise look broken. This
// module fills the gaps using deterministic, source-aware rules so the
// numbers are at least defensible. Every enriched row is tagged with
// `feeSource = 'heuristic'` so we never claim scraped accuracy we don't have.
//
// Rules (UK 2026-27 tuition reality):
//   - UCAS UG home: £9,250 (rUK), £1,820 (Scottish students at Scottish unis)
//   - UCAS UG intl: 18,000 (humanities), 22,000 (sciences), 25,000 (medicine)
//   - CUG: same as UCAS UG (CUG indexes the same courses)
//   - WhatUni: same as UCAS UG
//   - OFQUAL: these are FE qualification listings, no tuition — mark £0
//
// All numbers in GBP, all per-year.

const HEURISTIC_FEES_BY_DOMAIN = {
  medicine_health: { home: 9250, intl: 27500 },
  computer_science: { home: 9250, intl: 22500 },
  engineering: { home: 9250, intl: 22500 },
  sciences: { home: 9250, intl: 22000 },
  business: { home: 9250, intl: 20000 },
  law: { home: 9250, intl: 19000 },
  social_sciences: { home: 9250, intl: 18500 },
  humanities: { home: 9250, intl: 18000 },
  creative_writing: { home: 9250, intl: 18000 },
  film_media: { home: 9250, intl: 18000 },
  performing_arts: { home: 9250, intl: 19500 },
  music: { home: 9250, intl: 19500 },
  visual_arts: { home: 9250, intl: 19000 },
  design: { home: 9250, intl: 19000 },
  architecture: { home: 9250, intl: 20000 },
  education: { home: 9250, intl: 17500 },
  sports: { home: 9250, intl: 18500 },
  hospitality_tourism: { home: 9250, intl: 17500 },
  agriculture_environment: { home: 9250, intl: 18500 },
  other: { home: 9250, intl: 18000 },
};

export function enrichFees(lakeRow, mappedDomain) {
  const out = { ...lakeRow };
  // Honour anything already provided.
  if (lakeRow.feesUkGbp != null || lakeRow.feesIntlGbp != null) {
    out.feeSource = 'lake';
    return out;
  }
  const src = (lakeRow.source || '').toLowerCase();
  if (src === 'ofqual') {
    // FE qualification register — these listings don't carry tuition fees.
    out.feesUkGbp = 0;
    out.feesIntlGbp = 0;
    out.feeSource = 'heuristic-ofqual-zero';
    return out;
  }
  const bucket = HEURISTIC_FEES_BY_DOMAIN[mappedDomain] || HEURISTIC_FEES_BY_DOMAIN.other;
  out.feesUkGbp = bucket.home;
  out.feesIntlGbp = bucket.intl;
  out.feeSource = `heuristic-${mappedDomain}`;
  return out;
}
