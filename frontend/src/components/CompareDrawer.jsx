import { useEffect, useState } from "react";
import { P } from "../styles/theme";
import { api } from "../lib/api";

// Pull the rich record for each shortlisted course. Try `/api/search` filter
// by id, fall back to whatever we already have in the shortlist row.
async function enrichCourse(c) {
  try {
    const res = await api.search.query({ q: c.title, page_size: 1 });
    const hit = res.hits.find((h) => h.id === c.id) || res.hits[0];
    if (hit) return { ...c, ...hit };
  } catch {
    /* offline — use stored fields */
  }
  return c;
}

const ROW = (label, fn) => ({ label, fn });

const ROWS = [
  ROW("Provider", (c) => c.provider || c.institution || "—"),
  ROW("Location", (c) => `${c.city || "—"}, ${c.country || "—"}`),
  ROW("Level", (c) => c.level || "—"),
  ROW("Duration", (c) => c.duration || "—"),
  ROW("Mode", (c) => Array.isArray(c.mode) && c.mode.length ? c.mode.join(", ") : "—"),
  ROW("Fees (home, GBP)", (c) => fmtMoney(c.fee_home)),
  ROW("Fees (intl, GBP)", (c) => fmtMoney(c.fee_intl)),
  ROW("Total yearly est. (GBP)", (c) => fmtMoney(c.fees_for_filter), { highlight: true }),
  ROW("Top career", (c) => c.top_career_title || "—"),
  ROW("Career salary (median, GBP)", (c) => fmtMoney(c.top_career_salary_gbp)),
  ROW("ROI 5-yr (GBP)", (c) => c.roi_score ? `+£${(c.roi_score / 1000).toFixed(0)}k` : "—", { highlight: true }),
  ROW("Ranking band", (c) => c.ranking_band && c.ranking_band !== 999 ? `#${c.ranking_band}` : "—"),
  ROW("Free", (c) => (c.is_free || c.free) ? "✓" : "—"),
  ROW("Online", (c) => (c.is_online || c.online) ? "✓" : "—"),
  ROW("Source", (c) => c.provenance || "—"),
];

function fmtMoney(n) {
  if (n == null || !Number.isFinite(Number(n))) return "—";
  return "£" + Number(n).toLocaleString();
}

export default function CompareDrawer({ items, onClose }) {
  const [enriched, setEnriched] = useState(items);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all(items.map(enrichCourse)).then((rows) => {
      if (active) {
        setEnriched(rows);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [items]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11,20,38,0.85)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "32px 16px",
        overflow: "auto",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: `linear-gradient(160deg,${P.navy},${P.midnight})`,
        border: `1px solid ${P.surfaceLight}`,
        borderRadius: 16,
        padding: 24,
        width: "100%",
        maxWidth: 1100,
        boxShadow: `0 30px 60px rgba(0,0,0,0.5)`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, fontFamily: "'Trebuchet MS',sans-serif" }}>
            ⚖ Side-by-side comparison
            <span style={{ marginLeft: 12, fontSize: 12, color: P.textDim, fontWeight: 400 }}>
              {loading ? "loading rich data…" : `${enriched.length} course${enriched.length === 1 ? "" : "s"}`}
            </span>
          </h2>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: `1px solid ${P.surfaceLight}`, color: P.text, padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "'Trebuchet MS',sans-serif", fontSize: 12 }}
          >
            Close ✕
          </button>
        </div>

        <div className="mcm-compare-table" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Trebuchet MS',sans-serif", fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "10px 12px", color: P.textDim, fontWeight: 600, borderBottom: `2px solid ${P.surfaceLight}`, width: 200 }}>Attribute</th>
                {enriched.map((c) => (
                  <th key={c.id} style={{ textAlign: "left", padding: "10px 12px", color: P.text, fontWeight: 700, borderBottom: `2px solid ${P.surfaceLight}`, minWidth: 180 }}>
                    {c.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, idx) => (
                <tr key={r.label} style={{ background: idx % 2 ? `${P.surface}40` : "transparent" }}>
                  <td style={{ padding: "9px 12px", color: P.textMuted, fontWeight: 600 }}>{r.label}</td>
                  {enriched.map((c) => {
                    const v = r.fn(c);
                    const opts = r.fn.length === 2 ? r.fn(c, true) : null;
                    return (
                      <td key={c.id} style={{
                        padding: "9px 12px",
                        color: opts?.highlight ? P.goldLight : P.text,
                        fontWeight: opts?.highlight ? 700 : 400,
                      }}>
                        {v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 16, fontSize: 11, color: P.textDim, textAlign: "center" }}>
          Comparison is built from Meilisearch index data; ROI assumes 5-year salary minus total estimated cost.
        </div>
      </div>
    </div>
  );
}
