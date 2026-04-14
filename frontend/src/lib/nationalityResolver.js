import natData from "../data/nationalityMap.json";

const NAT_MAP = natData.nationalityMap;
const EU_EEA = new Set(natData.euEea);

export const NATIONALITIES = [
  ...new Set(
    Object.keys(NAT_MAP).map((k) => k.charAt(0).toUpperCase() + k.slice(1))
  ),
];

export function resolveNat(raw) {
  if (!raw) return null;
  return NAT_MAP[raw.trim().toLowerCase()] || raw.trim();
}

export function detFeeStatus(nat, res, courseCo, ukNation) {
  if (courseCo === "Online") return "home";
  const nc = resolveNat(nat);
  const rc = resolveNat(res);
  if (!nc) return "international";

  if (courseCo === "Scotland") {
    const h = new Set([
      "UK",
      "England",
      "Scotland",
      "Wales",
      "Northern Ireland",
      "Ireland",
    ]);
    if (!h.has(nc)) return "international";
    if (ukNation === "Scotland") return "home";
    return "ruk";
  }

  if (courseCo === "UK") {
    const h = new Set([
      "UK",
      "England",
      "Scotland",
      "Wales",
      "Northern Ireland",
      "Ireland",
    ]);
    return h.has(nc) ? "home" : "international";
  }

  if (EU_EEA.has(courseCo))
    return EU_EEA.has(nc) || nc === courseCo ? "home" : "international";
  if (courseCo === "USA")
    return nc === "USA" || rc === "USA" ? "home" : "international";
  if (courseCo === "Canada")
    return nc === "Canada" || rc === "Canada" ? "home" : "international";
  if (courseCo === "Australia")
    return nc === "Australia" || rc === "Australia" ? "home" : "international";
  if (courseCo === "Switzerland")
    return nc === "Switzerland" ? "home" : "international";

  return nc === courseCo ? "home" : "international";
}

export function getFee(course, feeStatus) {
  if (feeStatus === "ruk") return course.feeScotland || course.fS || 9250;
  return feeStatus === "home" ? course.feeHome : course.feeIntl;
}
