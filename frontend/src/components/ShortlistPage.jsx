import { useState } from "react";
import { Link } from "react-router-dom";
import { P } from "../styles/theme";
import { useShortlist } from "../lib/useShortlist";
import CompareDrawer from "./CompareDrawer";

export default function ShortlistPage() {
  const { items, remove, clear, count } = useShortlist();
  const [comparing, setComparing] = useState(false);

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(160deg,${P.midnight},${P.navy})`,
      fontFamily: "'Georgia',serif",
      color: P.text,
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 400, margin: 0 }}>
              Your <span style={{ color: P.danger, fontWeight: 700 }}>Shortlist</span>
            </h1>
            <div style={{ fontSize: 12, color: P.textMuted, marginTop: 2 }}>
              {count === 0
                ? "No saved courses yet — tap ♡ on any search result."
                : `${count} saved course${count === 1 ? "" : "s"} · stored locally on this device`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link
              to="/search"
              style={{ fontSize: 12, color: P.accentLight, textDecoration: "none", padding: "8px 14px", borderRadius: 8, background: `${P.accent}15`, border: `1px solid ${P.accent}30`, fontFamily: "'Trebuchet MS',sans-serif" }}
            >
              🔍 Browse search
            </Link>
            {count >= 2 && (
              <button
                onClick={() => setComparing(true)}
                style={{ fontSize: 12, padding: "8px 14px", borderRadius: 8, background: `${P.success}20`, border: `1px solid ${P.success}40`, color: P.success, cursor: "pointer", fontFamily: "'Trebuchet MS',sans-serif" }}
              >
                ⚖ Compare {Math.min(count, 4)}
              </button>
            )}
            {count > 0 && (
              <button
                onClick={() => { if (confirm(`Clear all ${count} saved courses?`)) clear(); }}
                style={{ fontSize: 12, padding: "8px 14px", borderRadius: 8, background: P.surface, border: `1px solid ${P.surfaceLight}`, color: P.textMuted, cursor: "pointer", fontFamily: "'Trebuchet MS',sans-serif" }}
              >
                Clear all
              </button>
            )}
            <Link
              to="/"
              style={{ fontSize: 12, color: P.textMuted, textDecoration: "none", padding: "8px 14px", borderRadius: 8, background: P.surface, border: `1px solid ${P.surfaceLight}`, fontFamily: "'Trebuchet MS',sans-serif" }}
            >
              ← Home
            </Link>
          </div>
        </div>

        {count === 0 ? (
          <div style={{ marginTop: 60, textAlign: "center", color: P.textDim, fontSize: 14 }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>♡</div>
            Your shortlist is empty. Open <Link to="/search" style={{ color: P.accentLight }}>Search</Link> and tap ♡ on any course to save it.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((c) => (
              <div key={c.id} style={{
                padding: "14px 18px",
                borderRadius: 12,
                background: P.surface,
                border: `1px solid ${P.surfaceLight}`,
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                gap: 12,
                alignItems: "center",
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Trebuchet MS',sans-serif" }}>{c.title}</div>
                  <div style={{ fontSize: 12, color: P.textMuted, marginTop: 2 }}>
                    {c.provider} · {c.city || "—"}, {c.country || "—"}
                  </div>
                  <div style={{ fontSize: 10, color: P.textDim, marginTop: 4 }}>
                    saved {new Date(c.addedAt).toLocaleDateString()}
                  </div>
                </div>
                {c.fees_for_filter != null && (
                  <div style={{ fontSize: 13, color: P.goldLight, fontFamily: "'Trebuchet MS',sans-serif", textAlign: "right" }}>
                    £{c.fees_for_filter.toLocaleString()}<br/><span style={{ fontSize: 10, color: P.textDim }}>/yr est.</span>
                  </div>
                )}
                <div style={{ display: "flex", gap: 6, flexDirection: "column" }}>
                  <Link
                    to={`/course/${encodeURIComponent(c.id)}`}
                    style={{ fontSize: 11, color: P.accentLight, textDecoration: "none", padding: "6px 10px", borderRadius: 6, background: `${P.accent}15`, border: `1px solid ${P.accent}30`, fontFamily: "'Trebuchet MS',sans-serif", textAlign: "center" }}
                  >
                    Open
                  </Link>
                  <button
                    onClick={() => remove(c.id)}
                    style={{ fontSize: 11, color: P.textMuted, padding: "6px 10px", borderRadius: 6, background: "transparent", border: `1px solid ${P.surfaceLight}`, cursor: "pointer", fontFamily: "'Trebuchet MS',sans-serif" }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {comparing && <CompareDrawer items={items.slice(0, 4)} onClose={() => setComparing(false)} />}
      </div>
    </div>
  );
}
