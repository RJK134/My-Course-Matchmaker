import domainData from "../data/domainFamilies.json";

const DOMAIN_FAMILIES = domainData.domainFamilies;

export function tokenise(text) {
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
    "not","no","like","want","would","could","also","very","really","quite",
    "some","any","that","this","about","into","from","have","has","had",
    "been","will","can","may","course","study","degree","programme","program",
    "university","college",
  ]);
  const words = remaining
    .split(/[\s,;.]+/)
    .filter((w) => w.length > 2 && !stop.has(w));
  return [...new Set([...knownPhrases, ...words])];
}

export function identifyPrimaryDomain(tokens) {
  const scores = {};
  for (const [dom, kws] of Object.entries(DOMAIN_FAMILIES)) {
    let s = 0;
    for (const t of tokens)
      for (const k of kws) {
        if (t === k) s += 3;
        else if (
          (k.includes(t) || t.includes(k)) &&
          Math.min(t.length, k.length) > 3
        )
          s += 1.5;
      }
    if (s > 0) scores[dom] = s;
  }
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) return { primary: null, secondary: [], scores: {} };
  return {
    primary: sorted[0][0],
    secondary: sorted
      .slice(1)
      .filter(([_, s]) => s >= sorted[0][1] * 0.4)
      .map(([d]) => d),
    scores,
  };
}

export function calculateMatch(course, profile) {
  const subTok = tokenise(profile.subjects);
  const intTok = tokenise(profile.interests);
  const sklTok = tokenise(profile.skills);
  const dom = identifyPrimaryDomain(subTok);

  let domScore = 0;
  if (dom.primary) {
    if (course.domain === dom.primary) domScore = 55;
    else if (dom.secondary.includes(course.domain)) domScore = 28;
    else {
      const x = course.subjects.filter((s) =>
        subTok.some((t) => s.includes(t) || t.includes(s))
      ).length;
      domScore = Math.min(10, x * 2.5);
    }
  } else {
    const h = course.subjects.filter((s) =>
      subTok.some((t) => s.includes(t) || t.includes(s))
    ).length;
    domScore = Math.min(55, (h / Math.max(course.subjects.length, 1)) * 55);
  }

  let kwScore = 0;
  if (subTok.length) {
    const cs = course.subjects.join(" ") + " " + course.title.toLowerCase();
    const h = subTok.filter((t) => cs.includes(t)).length;
    kwScore = Math.min(15, (h / subTok.length) * 15);
  }

  let enScore = 0;
  const sec = [...intTok, ...sklTok];
  if (sec.length) {
    const cs = (
      course.subjects.join(" ") +
      " " +
      course.careerPaths.join(" ")
    ).toLowerCase();
    const h = sec.filter((t) => cs.includes(t)).length;
    enScore = Math.min(8, (h / sec.length) * 8);
  }

  const lvScore =
    !profile.level || profile.level === "any"
      ? 5
      : course.level === profile.level
        ? 7
        : 0;

  const moScore =
    !profile.modes || !profile.modes.length
      ? 3
      : profile.modes.some((m) => course.mode.includes(m))
        ? 5
        : 0;

  let loScore = 3;
  if (profile.locations) {
    const lt = tokenise(profile.locations);
    const cl = (course.country + " " + course.city).toLowerCase();
    if (lt.length && lt.some((t) => cl.includes(t))) loScore = 5;
    else if (lt.length) loScore = 0;
  }

  let prScore = 0;
  if (profile.searchFree && course.free) prScore += 3;
  else if (!profile.searchFree) prScore += 1.5;
  if (profile.searchOnline && course.online) prScore += 2;
  else if (!profile.searchOnline && !course.online) prScore += 2;
  else prScore += 0.5;

  return Math.min(
    99,
    Math.round(domScore + kwScore + enScore + lvScore + moScore + loScore + prScore)
  );
}
