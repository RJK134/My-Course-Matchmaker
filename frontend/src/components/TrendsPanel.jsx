import { useEffect, useState } from "react";
import { P } from "../styles/theme";
import { api } from "../lib/api";

const TYPE_META = {
  "curriculum-gap": { icon: "📈", label: "Curriculum gap", colour: P.gold },
  "curriculum-risk": { icon: "⚠️", label: "At-risk subject", colour: P.danger },
  "emerging-programme": { icon: "🚀", label: "Emerging programme", colour: P.accent },
  "investment-signal": { icon: "💰", label: "Investment signal", colour: P.success },
  "credential-trend": { icon: "🎓", label: "Credential trend", colour: P.accentGlow },
};

export default function TrendsPanel({ subject }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;
    setStatus("loading");
    // Pull all then filter client-side by relevance; insights are only ~20 rows.
    api.insights
      .list({})
      .then((j) => {
        if (!active) return;
        const subj = subject ? subject.toLowerCase() : "";
        const scored = (j.insights || []).map((i) => {
          const haystack = `${i.title || ""} ${i.summaryExcerpt || ""} ${i.subjectArea || ""}`.toLowerCase();
          const score =
            (subj && haystack.includes(subj) ? 5 : 0) +
            (subj && i.subjectArea && i.subjectArea.toLowerCase().includes(subj) ? 3 : 0);
          return { ...i, _score: score };
        });
        scored.sort((a, b) => b._score - a._score);
        setItems(scored.slice(0, 4));
        setStatus("ok");
      })
      .catch(() => active && setStatus("error"));
    return () => { active = false; };
  }, [subject]);

  if (status === "loading") return null;
  if (status === "error" || items.length === 0) return null;

  return (
    <div style={{
      marginBottom: 20,
      padding: 14,
      borderRadius: 12,
      background: `${P.surface}80`,
      border: `1px solid ${P.surfaceLight}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0, fontFamily: "'Trebuchet MS',sans-serif", color: P.text }}>
          📡 Trends in your field <span style={{ color: P.textDim, fontWeight: 400 }}>(CoursePulse)</span>
        </h3>
        <span style={{ fontSize: 10, color: P.textDim }}>Perplexity + Gemini · weekly</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
        {items.map((i) => {
          const meta = TYPE_META[i.insightType] || { icon: "💡", label: i.insightType, colour: P.textMuted };
          return (
            <div key={i.id} style={{
              padding: 12,
              borderRadius: 10,
              background: P.midnight,
              border: `1px solid ${meta.colour}30`,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: meta.colour, fontWeight: 700, textTransform: "uppercase", fontFamily: "'Trebuchet MS',sans-serif" }}>
                  {meta.icon} {meta.label}
                </span>
                <span style={{ fontSize: 9, color: P.textDim }}>{i.region || "—"}</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{i.title}</div>
              {i.summaryExcerpt && (
                <div style={{ fontSize: 11, color: P.textMuted, lineHeight: 1.4 }}>
                  {i.summaryExcerpt.slice(0, 160)}…
                </div>
              )}
              <div style={{ fontSize: 9, color: P.textDim, marginTop: 6 }}>{i.source}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
