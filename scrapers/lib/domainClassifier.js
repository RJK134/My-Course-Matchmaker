/**
 * Classifies courses into the 19 MCM domain families using keyword matching.
 * Reuses the same domain taxonomy from the frontend.
 */
const path = require("path");
const domainData = require(path.join(
  __dirname,
  "../../frontend/src/data/domainFamilies.json"
));

const DOMAIN_FAMILIES = domainData.domainFamilies;
const DOMAIN_LABELS = domainData.domainLabels;

function tokenise(text) {
  if (!text) return [];
  const lower = text.toLowerCase().replace(/[^\w\s,;.'-]/g, " ");
  const knownPhrases = [];
  const allPhrases = Object.values(DOMAIN_FAMILIES).flat();
  let remaining = lower;
  for (const phrase of allPhrases.sort((a, b) => b.length - a.length)) {
    if (remaining.includes(phrase)) {
      knownPhrases.push(phrase);
      remaining = remaining.replace(
        new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        " "
      );
    }
  }
  const stop = new Set([
    "i","a","an","the","and","or","of","in","to","for","is","my","me","it",
    "at","on","with","but","as","be","by","so","if","am","are","was","do",
    "not","no","like","want","would","course","study","degree","programme",
    "program","university","college",
  ]);
  const words = remaining
    .split(/[\s,;.]+/)
    .filter((w) => w.length > 2 && !stop.has(w));
  return [...new Set([...knownPhrases, ...words])];
}

function classify(course) {
  const text = [
    course.title,
    ...(course.subjects || []),
    course.entryReqs,
  ]
    .filter(Boolean)
    .join(" ");
  const tokens = tokenise(text);

  const scores = {};
  for (const [dom, kws] of Object.entries(DOMAIN_FAMILIES)) {
    let s = 0;
    for (const t of tokens) {
      for (const k of kws) {
        if (t === k) s += 3;
        else if (
          (k.includes(t) || t.includes(k)) &&
          Math.min(t.length, k.length) > 3
        )
          s += 1.5;
      }
    }
    if (s > 0) scores[dom] = s;
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) {
    return { domain: "education", confidence: 0, label: "Education" };
  }

  const topScore = sorted[0][1];
  const maxPossible = tokens.length * 3;
  const confidence = Math.min(1, topScore / Math.max(maxPossible, 1));

  return {
    domain: sorted[0][0],
    confidence: Math.round(confidence * 100) / 100,
    label: DOMAIN_LABELS[sorted[0][0]] || sorted[0][0],
  };
}

module.exports = { classify, tokenise, DOMAIN_FAMILIES, DOMAIN_LABELS };
