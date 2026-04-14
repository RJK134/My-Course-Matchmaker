import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { P } from "../../styles/theme";
import { api } from "../../lib/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [sources, setSources] = useState([]);
  const [recentRuns, setRecentRuns] = useState([]);
  const [scraping, setScraping] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [s, runs] = await Promise.all([
        api.admin.stats(),
        api.admin.latestReport(),
      ]);
      setStats(s);
      setSources(s.sources || []);
      setRecentRuns(runs);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    }
  }

  async function triggerScrape(sourceName) {
    setScraping(sourceName);
    try {
      const result = await api.admin.triggerScrape(sourceName);
      alert(`Scraper started for ${sourceName}. Run ID: ${result.runId}`);
    } catch (err) {
      alert(`Failed to start scraper: ${err.message}`);
    }
    setScraping(null);
    loadData();
  }

  const cardStyle = {
    padding: 20,
    borderRadius: 12,
    background: P.surface,
    border: `1px solid ${P.surfaceLight}`,
    textAlign: "center",
  };

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 400, margin: 0, fontFamily: "'Trebuchet MS',sans-serif" }}>
              Admin <span style={{ color: P.accent, fontWeight: 700 }}>Dashboard</span>
            </h1>
            <p style={{ color: P.textMuted, fontSize: 13, marginTop: 4 }}>
              Manage scrapers, review courses, monitor data quality
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "8px 16px", borderRadius: 8, background: `${P.accent}20`,
              border: `1px solid ${P.accent}40`, color: P.accentLight,
              fontSize: 12, cursor: "pointer", fontFamily: "'Trebuchet MS',sans-serif",
            }}
          >
            ← Back to Site
          </button>
        </div>

        {/* Stats cards */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 32 }}>
            {[
              { l: "Total Courses", v: stats.totalCourses, c: P.success },
              { l: "Institutions", v: stats.totalInstitutions, c: P.accent },
              { l: "Cities (COL)", v: stats.totalCities, c: P.accentGlow },
              { l: "Pending Review", v: stats.pendingReview, c: stats.pendingReview > 0 ? P.gold : P.textDim },
            ].map((s, i) => (
              <div key={i} style={cardStyle}>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.c, fontFamily: "'Trebuchet MS',sans-serif" }}>
                  {s.v?.toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: P.textDim, marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/admin/staging")}
            style={{
              padding: "12px 24px", borderRadius: 10,
              background: stats?.pendingReview > 0 ? `linear-gradient(135deg,${P.gold},${P.goldLight})` : P.surface,
              border: stats?.pendingReview > 0 ? "none" : `1px solid ${P.surfaceLight}`,
              color: stats?.pendingReview > 0 ? P.midnight : P.textMuted,
              fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Trebuchet MS',sans-serif",
            }}
          >
            Review Pending ({stats?.pendingReview || 0})
          </button>
        </div>

        {/* Scrape Sources */}
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px", fontFamily: "'Trebuchet MS',sans-serif" }}>
          Scrape Sources
        </h2>
        <div style={{ display: "grid", gap: 10, marginBottom: 32 }}>
          {sources.map((src) => (
            <div
              key={src.id}
              style={{
                display: "grid", gridTemplateColumns: "1fr auto auto",
                gap: 16, alignItems: "center", padding: "16px 20px",
                borderRadius: 12, background: P.surface, border: `1px solid ${P.surfaceLight}`,
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Trebuchet MS',sans-serif" }}>
                  {src.display_name}
                  <span style={{
                    marginLeft: 8, padding: "2px 8px", borderRadius: 10, fontSize: 10,
                    background: src.is_active ? `${P.success}20` : `${P.danger}20`,
                    color: src.is_active ? P.success : P.danger,
                  }}>
                    {src.is_active ? "Active" : "Disabled"}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: P.textMuted, marginTop: 4 }}>
                  Type: {src.scraper_type} • Last run: {src.last_run_at ? new Date(src.last_run_at).toLocaleDateString() : "Never"}
                  {src.last_run_status && (
                    <span style={{ color: src.last_run_status === "success" ? P.success : P.danger }}>
                      {" "}• {src.last_run_status}
                    </span>
                  )}
                  {src.last_run_count > 0 && ` • ${src.last_run_count} courses`}
                </div>
              </div>
              <button
                onClick={() => triggerScrape(src.name)}
                disabled={scraping === src.name}
                style={{
                  padding: "8px 16px", borderRadius: 8,
                  background: `linear-gradient(135deg,${P.accent},#2563EB)`,
                  border: "none", color: P.white, fontSize: 12, fontWeight: 600,
                  cursor: scraping === src.name ? "not-allowed" : "pointer",
                  opacity: scraping === src.name ? 0.5 : 1,
                  fontFamily: "'Trebuchet MS',sans-serif",
                }}
              >
                {scraping === src.name ? "Running..." : "Run Now"}
              </button>
            </div>
          ))}
        </div>

        {/* Recent Runs */}
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px", fontFamily: "'Trebuchet MS',sans-serif" }}>
          Recent Scrape Runs
        </h2>
        <div style={{ display: "grid", gap: 6 }}>
          {recentRuns.map((run) => (
            <div
              key={run.id}
              style={{
                display: "grid", gridTemplateColumns: "120px 1fr 80px 80px 80px",
                gap: 12, alignItems: "center", padding: "10px 16px",
                borderRadius: 8, background: `${P.navy}80`, fontSize: 13,
              }}
            >
              <span style={{ color: P.textMuted }}>{new Date(run.started_at).toLocaleString()}</span>
              <span>{run.display_name || run.source_name}</span>
              <span style={{ color: run.status === "success" ? P.success : run.status === "failed" ? P.danger : P.gold }}>
                {run.status}
              </span>
              <span style={{ color: P.textMuted }}>{run.courses_found || 0} found</span>
              <span style={{ color: P.success }}>{run.courses_new || 0} new</span>
            </div>
          ))}
          {recentRuns.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: P.textDim, fontSize: 13 }}>
              No scrape runs yet. Click "Run Now" on a source to start.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
