import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { P } from "../styles/theme";
import { api } from "../lib/api";
import ShortlistButton from "./ShortlistButton";
import { useShortlist } from "../lib/useShortlist";
import CompareDrawer from "./CompareDrawer";

const CURRENCY_OPTIONS = ["GBP", "EUR", "USD", "CHF"];
const SORT_OPTIONS = [
  { v: "", l: "Relevance" },
  { v: "affordability", l: "Most affordable" },
  { v: "roi", l: "Best ROI (5-yr salary − cost)" },
  { v: "ranking", l: "Ranking (curated only)" },
];

function CurrencyDisplay({ hit, currency }) {
  const conv = hit._converted;
  const fee = currency !== "GBP" && conv?.fees_for_filter != null
    ? `${conv.fees_for_filter.toLocaleString()} ${currency}`
    : `£${(hit.fees_for_filter || 0).toLocaleString()}`;
  return (
    <span title="Fees + 9 mo. estimated cost of living (£1,100/mo default)">
      {fee} <span style={{ color: P.textDim, fontSize: 10 }}>/yr est.</span>
    </span>
  );
}

function FacetGroup({ title, facets, selected, onChange, max = 8 }) {
  if (!facets) return null;
  const entries = Object.entries(facets).sort((a, b) => b[1] - a[1]).slice(0, max);
  if (!entries.length) return null;
  return (
    <div style={{ marginBottom: 18 }}>
      <h4 style={{
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: P.textDim,
        margin: "0 0 8px",
        fontFamily: "'Trebuchet MS',sans-serif",
      }}>{title}</h4>
      <div style={{ display: "grid", gap: 4 }}>
        {entries.map(([k, n]) => (
          <label key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", fontSize: 12 }}>
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={selected === k}
                onChange={() => onChange(selected === k ? "" : k)}
                style={{ accentColor: P.accent }}
              />
              <span style={{ color: P.text }}>{k}</span>
            </span>
            <span style={{ color: P.textDim, fontSize: 10 }}>{n}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [level, setLevel] = useState("");
  const [provenance, setProvenance] = useState("");
  const [free, setFree] = useState(false);
  const [online, setOnline] = useState(false);
  const [maxFees, setMaxFees] = useState("");
  const [sort, setSort] = useState("");
  const [currency, setCurrency] = useState("GBP");
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ hits: [], total: 0, facets: {}, processingTimeMs: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { count: shortlistCount, items: shortlistItems } = useShortlist();
  const [comparing, setComparing] = useState(false);

  const tickRef = useRef(0);

  const runSearch = useCallback(async () => {
    const tick = ++tickRef.current;
    setLoading(true);
    setError(null);
    try {
      const params = {
        q,
        page,
        page_size: 20,
        currency,
      };
      if (country) params.country = country;
      if (level) params.level = level;
      if (provenance) params.source = provenance;
      if (free) params.free = "true";
      if (online) params.online = "true";
      if (maxFees) params.max_fees = maxFees;
      if (sort) params.sort = sort;
      const res = await api.search.query(params);
      if (tick !== tickRef.current) return; // stale
      setData(res);
    } catch (e) {
      if (tick !== tickRef.current) return;
      setError(e.message || "Search failed");
    } finally {
      if (tick === tickRef.current) setLoading(false);
    }
  }, [q, country, level, provenance, free, online, maxFees, sort, currency, page]);

  // Debounce keystrokes; immediate on filter changes.
  useEffect(() => {
    const t = setTimeout(runSearch, q ? 220 : 0);
    return () => clearTimeout(t);
  }, [runSearch]);

  const { hits, total, facets, processingTimeMs, currency: respCurrency } = data;
  const totalPages = Math.ceil(total / 20);

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(160deg,${P.midnight},${P.navy})`,
      fontFamily: "'Georgia',serif",
      color: P.text,
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 400, margin: 0 }}>
              Course <span style={{ color: P.accent, fontWeight: 700 }}>Search</span>
            </h1>
            <div style={{ fontSize: 12, color: P.textMuted, marginTop: 2 }}>
              5,000+ courses · Meilisearch-backed · costs shown in {respCurrency?.code || currency}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Link
              to="/shortlist"
              style={{ fontSize: 12, color: P.danger, textDecoration: "none", padding: "8px 14px", borderRadius: 8, background: `${P.danger}10`, border: `1px solid ${P.danger}40`, fontFamily: "'Trebuchet MS',sans-serif" }}
            >
              ♥ Shortlist {shortlistCount > 0 ? `(${shortlistCount})` : ""}
            </Link>
            {shortlistCount >= 2 && (
              <button
                onClick={() => setComparing(true)}
                style={{ fontSize: 12, padding: "8px 14px", borderRadius: 8, background: `${P.success}15`, border: `1px solid ${P.success}40`, color: P.success, cursor: "pointer", fontFamily: "'Trebuchet MS',sans-serif" }}
              >
                ⚖ Compare {Math.min(shortlistCount, 4)}
              </button>
            )}
            <Link
              to="/"
              style={{ fontSize: 12, color: P.accentLight, textDecoration: "none", padding: "8px 14px", borderRadius: 8, background: `${P.accent}15`, border: `1px solid ${P.accent}30`, fontFamily: "'Trebuchet MS',sans-serif" }}
            >
              ← Home
            </Link>
          </div>
        </div>

        {/* Search bar */}
        <div style={{
          display: "flex",
          gap: 10,
          marginBottom: 14,
          flexWrap: "wrap",
        }}>
          <input
            type="search"
            placeholder="Search 5,000+ courses — try 'biology Cambridge' or 'free AI MOOC'"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            style={{
              flex: "1 1 320px",
              padding: "12px 16px",
              borderRadius: 10,
              background: P.surface,
              border: `1px solid ${P.surfaceLight}`,
              color: P.text,
              fontSize: 14,
              fontFamily: "'Trebuchet MS',sans-serif",
            }}
          />
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              background: P.surface,
              border: `1px solid ${P.surfaceLight}`,
              color: P.text,
              fontSize: 13,
              fontFamily: "'Trebuchet MS',sans-serif",
            }}
          >
            {SORT_OPTIONS.map((s) => (<option key={s.v} value={s.v}>Sort: {s.l}</option>))}
          </select>
          <select
            value={currency}
            onChange={(e) => { setCurrency(e.target.value); setPage(1); }}
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              background: P.surface,
              border: `1px solid ${P.surfaceLight}`,
              color: P.text,
              fontSize: 13,
              fontFamily: "'Trebuchet MS',sans-serif",
            }}
          >
            {CURRENCY_OPTIONS.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>

        <div className="mcm-search-layout">
          {/* Facet sidebar */}
          <aside style={{ background: P.surface, borderRadius: 12, padding: 16, height: "fit-content", border: `1px solid ${P.surfaceLight}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, margin: 0, fontFamily: "'Trebuchet MS',sans-serif" }}>Filters</h3>
              {(country || level || provenance || free || online || maxFees) && (
                <button
                  onClick={() => { setCountry(""); setLevel(""); setProvenance(""); setFree(false); setOnline(false); setMaxFees(""); setPage(1); }}
                  style={{ fontSize: 10, background: "none", border: "none", color: P.textDim, cursor: "pointer", textDecoration: "underline" }}
                >
                  reset
                </button>
              )}
            </div>

            <FacetGroup title="Country" facets={facets?.country} selected={country} onChange={(v) => { setCountry(v); setPage(1); }} />
            <FacetGroup title="Level" facets={facets?.level} selected={level} onChange={(v) => { setLevel(v); setPage(1); }} />
            <FacetGroup title="Source" facets={facets?.provenance} selected={provenance} onChange={(v) => { setProvenance(v); setPage(1); }} />

            <div style={{ marginBottom: 14 }}>
              <h4 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: P.textDim, margin: "0 0 8px", fontFamily: "'Trebuchet MS',sans-serif" }}>Format</h4>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, marginBottom: 4 }}>
                <input type="checkbox" checked={free} onChange={() => { setFree(!free); setPage(1); }} style={{ accentColor: P.success }} />
                <span>Free only</span>
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12 }}>
                <input type="checkbox" checked={online} onChange={() => { setOnline(!online); setPage(1); }} style={{ accentColor: P.accent }} />
                <span>Online only</span>
              </label>
            </div>

            <div>
              <h4 style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, color: P.textDim, margin: "0 0 6px", fontFamily: "'Trebuchet MS',sans-serif" }}>Max yearly cost ({currency})</h4>
              <input
                type="number"
                placeholder="e.g. 15000"
                value={maxFees}
                onChange={(e) => { setMaxFees(e.target.value); setPage(1); }}
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: P.midnight,
                  border: `1px solid ${P.surfaceLight}`,
                  color: P.text,
                  fontSize: 12,
                  fontFamily: "'Trebuchet MS',sans-serif",
                }}
              />
              <div style={{ fontSize: 10, color: P.textDim, marginTop: 4 }}>Filter applies in GBP (server-side).</div>
            </div>
          </aside>

          {/* Result list */}
          <main>
            <div style={{ marginBottom: 12, fontSize: 12, color: P.textMuted }}>
              {loading ? (
                <span>Searching…</span>
              ) : error ? (
                <span style={{ color: P.danger }}>Error: {error}</span>
              ) : (
                <span>
                  <strong style={{ color: P.text }}>{total.toLocaleString()}</strong> courses
                  {q ? <> for <em style={{ color: P.accentLight }}>“{q}”</em></> : null}
                  {" "}· <span style={{ color: P.textDim }}>{processingTimeMs} ms</span>
                </span>
              )}
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {hits.map((h) => {
                const provisional = h.provenance !== "curated";
                return (
                  <div
                    key={h.id}
                    onClick={() => navigate(`/course/${encodeURIComponent(h.id)}`)}
                    style={{
                      cursor: "pointer",
                      color: P.text,
                      padding: "14px 18px",
                      borderRadius: 12,
                      background: P.surface,
                      border: `1px solid ${P.surfaceLight}`,
                      display: "block",
                      transition: "border-color .15s, transform .12s",
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = P.accent; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = P.surfaceLight; }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "baseline" }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'Trebuchet MS',sans-serif" }}>
                          {h.title}
                          {provisional ? (
                            <span title={`Provisional row from ${h.provenance}`} style={{ marginLeft: 8, padding: "2px 7px", borderRadius: 10, background: `${P.gold}20`, color: P.goldLight, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>
                              {h.provenance} · provisional
                            </span>
                          ) : (
                            <span style={{ marginLeft: 8, padding: "2px 7px", borderRadius: 10, background: `${P.success}15`, color: P.success, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>
                              verified
                            </span>
                          )}
                          {h.is_free && (
                            <span style={{ marginLeft: 4, padding: "2px 7px", borderRadius: 10, background: `${P.success}25`, color: P.success, fontSize: 10, fontWeight: 700 }}>FREE</span>
                          )}
                          {h.is_online && (
                            <span style={{ marginLeft: 4, padding: "2px 7px", borderRadius: 10, background: `${P.accent}20`, color: P.accentLight, fontSize: 10, fontWeight: 700 }}>ONLINE</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: P.textMuted, marginTop: 2 }}>
                          {h.provider}
                          {h.city ? ` · ${h.city}` : ""}
                          {h.country ? `, ${h.country}` : ""}
                          {h.level ? ` · ${h.level}` : ""}
                          {h.qualification && h.qualification !== h.level ? ` · ${h.qualification}` : ""}
                        </div>
                        {h.top_career_title && (
                          <div style={{ fontSize: 11, color: P.textDim, marginTop: 4 }}>
                            💼 Leads to: <span style={{ color: P.accentLight }}>{h.top_career_title}</span>
                            {h.top_career_salary_gbp ? <> · median <strong>£{h.top_career_salary_gbp.toLocaleString()}</strong></> : null}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
                        <ShortlistButton course={h} />
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: P.goldLight, fontFamily: "'Trebuchet MS',sans-serif" }}>
                            <CurrencyDisplay hit={h} currency={respCurrency?.code || currency} />
                          </div>
                          {Number.isFinite(h.roi_score) && h.roi_score > 0 && (
                            <div style={{ fontSize: 10, color: P.success, marginTop: 4 }}>
                              ROI +£{(h.roi_score / 1000).toFixed(0)}k
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {comparing && <CompareDrawer items={shortlistItems.slice(0, 4)} onClose={() => setComparing(false)} />}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 20 }}>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  style={{ padding: "8px 14px", borderRadius: 8, background: P.surface, border: `1px solid ${P.surfaceLight}`, color: page <= 1 ? P.textDim : P.text, fontSize: 12, cursor: page <= 1 ? "default" : "pointer" }}
                >
                  ← Prev
                </button>
                <span style={{ alignSelf: "center", fontSize: 12, color: P.textMuted }}>
                  Page {page} of {totalPages.toLocaleString()}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  style={{ padding: "8px 14px", borderRadius: 8, background: P.surface, border: `1px solid ${P.surfaceLight}`, color: page >= totalPages ? P.textDim : P.text, fontSize: 12, cursor: page >= totalPages ? "default" : "pointer" }}
                >
                  Next →
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
