import { useState } from "react";
import { P, DL } from "../styles/theme";
import { getFee } from "../lib/nationalityResolver";
import { tokenise, identifyPrimaryDomain } from "../lib/matching";
import MatchBadge from "./MatchBadge";

export default function Results({ results, profile, onNewSearch, onExplore }) {
  const [sortBy, setSortBy] = useState("match");
  const [showFreeAlts, setShowFreeAlts] = useState(false);

  const dName = profile.name.trim()
    ? profile.name.trim().split(/\s+/)[0]
    : "Student";

  const sorted = [...results].sort((a, b) => {
    if (sortBy === "match") return b.matchPercent - a.matchPercent;
    if (sortBy === "fee-low")
      return getFee(a, a.feeStatus) - getFee(b, b.feeStatus);
    if (sortBy === "fee-high")
      return getFee(b, b.feeStatus) - getFee(a, a.feeStatus);
    if (sortBy === "ranking") return (a.ranking || 999) - (b.ranking || 999);
    if (sortBy === "employability")
      return b.employability - a.employability;
    return 0;
  });

  // BUG-004 fix: include tuition-free unis (feeHome=0) not just MOOC free courses
  const isFreeOrTuitionFree = (c) => c.free || c.feeHome === 0 || c.feeIntl === 0;
  const displayed = showFreeAlts
    ? sorted.filter(isFreeOrTuitionFree)
    : sorted;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg,${P.midnight},${P.navy})`,
        fontFamily: "'Georgia',serif",
        color: P.text,
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 400, margin: 0 }}>
              {dName}'s{" "}
              <span style={{ color: P.accent, fontWeight: 700 }}>
                Course Matches
              </span>
            </h1>
            <p
              style={{ color: P.textMuted, fontSize: 13, marginTop: 4 }}
            >
              {results.length} courses • {profile.nationality}
              {profile.ukNation ? ` (${profile.ukNation})` : ""} • Click any
              course for full explorer with costs, maps & more
              {(() => {
                const t = tokenise(profile.subjects);
                const i = identifyPrimaryDomain(t);
                return i.primary ? (
                  <span style={{ color: P.success }}>
                    {" "}
                    • {DL[i.primary]}
                  </span>
                ) : null;
              })()}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                background: P.surface,
                border: `1px solid ${P.surfaceLight}`,
                color: P.text,
                fontSize: 12,
                fontFamily: "'Trebuchet MS',sans-serif",
              }}
            >
              <option value="match">Best Match</option>
              <option value="fee-low">Lowest Fee</option>
              <option value="fee-high">Highest Fee</option>
              <option value="ranking">Ranking</option>
              <option value="employability">Employability</option>
            </select>
            <button
              onClick={() => setShowFreeAlts(!showFreeAlts)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                background: showFreeAlts ? `${P.success}20` : P.surface,
                border: `1px solid ${showFreeAlts ? P.success + "40" : P.surfaceLight}`,
                color: showFreeAlts ? P.success : P.textMuted,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'Trebuchet MS',sans-serif",
              }}
            >
              {showFreeAlts ? "✓ Free Only" : "💡 Free"}
            </button>
            <button
              onClick={onNewSearch}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                background: `${P.accent}20`,
                border: `1px solid ${P.accent}40`,
                color: P.accentLight,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'Trebuchet MS',sans-serif",
              }}
            >
              ← New
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
            gap: 10,
            marginBottom: 24,
          }}
        >
          {[
            { l: "Top", v: `${sorted[0]?.matchPercent || 0}%`, c: P.success },
            {
              l: "Avg Match",
              v: `${Math.round(results.reduce((s, r) => s + r.matchPercent, 0) / results.length)}%`,
              c: P.accent,
            },
            {
              l: "Free",
              v: results.filter(isFreeOrTuitionFree).length,
              c: P.goldLight,
            },
            {
              l: "Online",
              v: results.filter((r) => r.online).length,
              c: P.accentGlow,
            },
            {
              l: "Countries",
              v: [...new Set(results.map((r) => r.country))].length,
              c: P.text,
            },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                padding: 12,
                borderRadius: 10,
                background: P.surface,
                border: `1px solid ${P.surfaceLight}`,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: s.c,
                  fontFamily: "'Trebuchet MS',sans-serif",
                }}
              >
                {s.v}
              </div>
              <div style={{ fontSize: 10, color: P.textDim }}>{s.l}</div>
            </div>
          ))}
        </div>

        {showFreeAlts && (
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 10,
              background: `${P.success}10`,
              border: `1px solid ${P.success}30`,
              marginBottom: 16,
              fontSize: 12,
              color: P.success,
            }}
          >
            Showing free online courses only
          </div>
        )}

        {/* Course cards */}
        <div style={{ display: "grid", gap: 10 }}>
          {displayed.map((c) => {
            const f = getFee(c, c.feeStatus);
            return (
              <div
                key={c.id}
                onClick={() => onExplore(c)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "50px 1fr auto",
                  gap: 14,
                  alignItems: "center",
                  padding: "14px 18px",
                  borderRadius: 12,
                  background: P.surface,
                  border: `1px solid ${P.surfaceLight}`,
                  cursor: "pointer",
                  transition: "border-color 0.2s,transform 0.15s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = P.accent;
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = P.surfaceLight;
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <MatchBadge p={c.matchPercent} />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: "'Trebuchet MS',sans-serif",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c.title}
                    {c.free && (
                      <span
                        style={{
                          marginLeft: 8,
                          padding: "2px 7px",
                          borderRadius: 10,
                          background: `${P.success}25`,
                          color: P.success,
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        FREE
                      </span>
                    )}
                    {c.online && (
                      <span
                        style={{
                          marginLeft: 4,
                          padding: "2px 7px",
                          borderRadius: 10,
                          background: `${P.accent}20`,
                          color: P.accentLight,
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        ONLINE
                      </span>
                    )}
                  </div>
                  <div
                    style={{ fontSize: 12, color: P.textMuted, marginTop: 2 }}
                  >
                    {c.institution}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      marginTop: 3,
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontSize: 11, color: P.textDim }}>
                      📍 {c.city}
                    </span>
                    <span style={{ fontSize: 11, color: P.textDim }}>
                      ⏱ {c.duration}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        color:
                          c.feeStatus === "international"
                            ? P.goldLight
                            : P.success,
                      }}
                    >
                      💰 {f === 0 ? "Free" : "£" + f.toLocaleString()}/yr
                    </span>
                    <span style={{ fontSize: 11, color: P.textDim }}>
                      📈 {c.employability}%
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: P.accentLight,
                    fontFamily: "'Trebuchet MS',sans-serif",
                    textAlign: "right",
                    whiteSpace: "nowrap",
                  }}
                >
                  Explore
                  <br />
                  details →
                </div>
              </div>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 28,
            padding: 16,
            borderRadius: 12,
            background: `${P.surface}60`,
            fontSize: 11,
            color: P.textDim,
            lineHeight: 1.5,
            textAlign: "center",
          }}
        >
          Fee status by nationality. Cost data from Numbeo/Expatistan/university
          sources. Verify with institutions. © {new Date().getFullYear()} Future
          Horizons Education v4.0
        </div>
      </div>
    </div>
  );
}
