import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { P, DL } from "../../styles/theme";
import { api } from "../../lib/api";

export default function StagingReview() {
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filter, setFilter] = useState({ status: "pending", source: "", domain: "" });
  const [selected, setSelected] = useState(new Set());
  const [detail, setDetail] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadStaging();
  }, [page, filter]);

  async function loadStaging() {
    try {
      const params = { page, limit: 25, ...filter };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const data = await api.admin.staging(params);
      setCourses(data.courses);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      console.error("Failed to load staging:", err);
    }
  }

  async function approve(id) {
    await api.admin.approve(id);
    loadStaging();
    if (detail?.id === id) setDetail(null);
  }

  async function reject(id) {
    const reason = prompt("Rejection reason:");
    if (reason === null) return;
    await api.admin.reject(id, reason);
    loadStaging();
    if (detail?.id === id) setDetail(null);
  }

  async function bulkApprove() {
    if (!selected.size) return;
    await api.admin.bulkApprove([...selected]);
    setSelected(new Set());
    loadStaging();
  }

  async function bulkReject() {
    if (!selected.size) return;
    const reason = prompt("Rejection reason for all selected:");
    if (reason === null) return;
    await api.admin.bulkReject([...selected], reason);
    setSelected(new Set());
    loadStaging();
  }

  function toggleSelect(id) {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  }

  function toggleAll() {
    if (selected.size === courses.length) setSelected(new Set());
    else setSelected(new Set(courses.map((c) => c.id)));
  }

  const selectStyle = {
    padding: "6px 10px", borderRadius: 6, background: P.surface,
    border: `1px solid ${P.surfaceLight}`, color: P.text, fontSize: 12,
    fontFamily: "'Trebuchet MS',sans-serif",
  };

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(160deg,${P.midnight},${P.navy})`, fontFamily: "'Georgia',serif", color: P.text }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 400, margin: 0, fontFamily: "'Trebuchet MS',sans-serif" }}>
              Staging <span style={{ color: P.accent, fontWeight: 700 }}>Review</span>
              <span style={{ fontSize: 14, color: P.textMuted, marginLeft: 12 }}>{total} courses</span>
            </h1>
          </div>
          <button onClick={() => navigate("/admin")} style={{ padding: "8px 14px", borderRadius: 8, background: `${P.accent}20`, border: `1px solid ${P.accent}40`, color: P.accentLight, fontSize: 12, cursor: "pointer", fontFamily: "'Trebuchet MS',sans-serif" }}>
            ← Dashboard
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          <select value={filter.status} onChange={(e) => { setFilter({ ...filter, status: e.target.value }); setPage(1); }} style={selectStyle}>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="">All</option>
          </select>
          <select value={filter.source} onChange={(e) => { setFilter({ ...filter, source: e.target.value }); setPage(1); }} style={selectStyle}>
            <option value="">All Sources</option>
            <option value="ucas">UCAS</option>
            <option value="studyportals">StudyPortals</option>
            <option value="qs_the">QS/THE</option>
            <option value="mooc">MOOC</option>
          </select>
          <select value={filter.domain} onChange={(e) => { setFilter({ ...filter, domain: e.target.value }); setPage(1); }} style={selectStyle}>
            <option value="">All Domains</option>
            {Object.entries(DL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {selected.size > 0 && (
            <>
              <span style={{ fontSize: 12, color: P.textMuted, marginLeft: 8 }}>{selected.size} selected</span>
              <button onClick={bulkApprove} style={{ padding: "6px 14px", borderRadius: 6, background: P.success, border: "none", color: P.white, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Approve Selected
              </button>
              <button onClick={bulkReject} style={{ padding: "6px 14px", borderRadius: 6, background: P.danger, border: "none", color: P.white, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                Reject Selected
              </button>
            </>
          )}
        </div>

        {/* Table */}
        <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${P.surfaceLight}` }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 150px 100px 60px 60px 120px", gap: 8, padding: "10px 14px", background: P.surface, fontSize: 11, color: P.textDim, fontFamily: "'Trebuchet MS',sans-serif", textTransform: "uppercase", letterSpacing: 0.5 }}>
            <input type="checkbox" checked={selected.size === courses.length && courses.length > 0} onChange={toggleAll} />
            <span>Course</span>
            <span>Institution</span>
            <span>Domain</span>
            <span>Conf.</span>
            <span>Quality</span>
            <span>Actions</span>
          </div>

          {/* Rows */}
          {courses.map((c) => (
            <div
              key={c.id}
              style={{
                display: "grid", gridTemplateColumns: "30px 1fr 150px 100px 60px 60px 120px",
                gap: 8, padding: "10px 14px", alignItems: "center",
                background: selected.has(c.id) ? `${P.accent}10` : `${P.navy}40`,
                borderBottom: `1px solid ${P.surfaceLight}30`, fontSize: 13,
                cursor: "pointer",
              }}
              onClick={() => setDetail(detail?.id === c.id ? null : c)}
            >
              <input type="checkbox" checked={selected.has(c.id)} onChange={(e) => { e.stopPropagation(); toggleSelect(c.id); }} />
              <div>
                <div style={{ fontWeight: 600, fontFamily: "'Trebuchet MS',sans-serif" }}>{c.title}</div>
                <div style={{ fontSize: 11, color: P.textDim }}>{c.country} • {c.city} • {c.level}</div>
              </div>
              <span style={{ fontSize: 12, color: P.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.institution_key}</span>
              <span style={{ fontSize: 11, color: P.accentLight }}>{DL[c.domain] || c.domain}</span>
              <span style={{ fontSize: 12, color: c.confidence_score >= 0.7 ? P.success : c.confidence_score >= 0.5 ? P.gold : P.danger }}>
                {Math.round((c.confidence_score || 0) * 100)}%
              </span>
              <span style={{ fontSize: 12, color: c.data_quality_score >= 0.7 ? P.success : P.gold }}>
                {Math.round((c.data_quality_score || 0) * 100)}%
              </span>
              <div style={{ display: "flex", gap: 4 }} onClick={(e) => e.stopPropagation()}>
                {c.status === "pending" && (
                  <>
                    <button onClick={() => approve(c.id)} style={{ padding: "4px 10px", borderRadius: 4, background: P.success, border: "none", color: P.white, fontSize: 11, cursor: "pointer" }}>✓</button>
                    <button onClick={() => reject(c.id)} style={{ padding: "4px 10px", borderRadius: 4, background: P.danger, border: "none", color: P.white, fontSize: 11, cursor: "pointer" }}>✗</button>
                  </>
                )}
                <span style={{ fontSize: 10, color: c.status === "approved" ? P.success : c.status === "rejected" ? P.danger : P.textDim, padding: "4px 6px" }}>
                  {c.status}
                </span>
              </div>
            </div>
          ))}

          {courses.length === 0 && (
            <div style={{ padding: 32, textAlign: "center", color: P.textDim, fontSize: 13 }}>
              No courses matching filters.
            </div>
          )}
        </div>

        {/* Detail panel */}
        {detail && (
          <div style={{ marginTop: 16, padding: 20, borderRadius: 12, background: P.surface, border: `1px solid ${P.surfaceLight}` }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px", fontFamily: "'Trebuchet MS',sans-serif" }}>
              {detail.title}
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 13, marginBottom: 16 }}>
              {[
                { l: "Institution", v: detail.institution_key },
                { l: "Country/City", v: `${detail.country}, ${detail.city}` },
                { l: "Level", v: detail.level },
                { l: "Domain", v: `${DL[detail.domain] || detail.domain} (${Math.round((detail.confidence_score || 0) * 100)}% conf.)` },
                { l: "Mode", v: detail.mode?.join(", ") },
                { l: "Duration", v: detail.duration },
                { l: "Fee (Home)", v: detail.fee_home != null ? `£${detail.fee_home}` : "N/A" },
                { l: "Fee (Intl)", v: detail.fee_intl != null ? `£${detail.fee_intl}` : "N/A" },
                { l: "Subjects", v: detail.subjects?.join(", ") },
                { l: "Source", v: detail.source_name || "Unknown" },
                { l: "Source URL", v: detail.source_url || "N/A" },
                { l: "Quality", v: `${Math.round((detail.data_quality_score || 0) * 100)}%` },
              ].map((x, i) => (
                <div key={i} style={{ padding: "6px 0", borderBottom: `1px solid ${P.surfaceLight}30` }}>
                  <span style={{ color: P.textDim, fontSize: 11, textTransform: "uppercase" }}>{x.l}: </span>
                  <span>{x.v}</span>
                </div>
              ))}
            </div>
            {detail.entry_reqs && (
              <div style={{ marginBottom: 12 }}>
                <span style={{ color: P.textDim, fontSize: 11, textTransform: "uppercase" }}>Entry Requirements: </span>
                <p style={{ fontSize: 13, lineHeight: 1.5, margin: "4px 0 0" }}>{detail.entry_reqs}</p>
              </div>
            )}
            {detail.duplicate_of && (
              <div style={{ padding: 10, borderRadius: 8, background: `${P.gold}10`, border: `1px solid ${P.gold}30`, fontSize: 12, color: P.goldLight, marginBottom: 12 }}>
                Possible duplicate of course #{detail.duplicate_of}
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ padding: "6px 14px", borderRadius: 6, background: P.surface, border: `1px solid ${P.surfaceLight}`, color: P.textMuted, fontSize: 12, cursor: page <= 1 ? "not-allowed" : "pointer" }}>
              ← Prev
            </button>
            <span style={{ fontSize: 12, color: P.textDim, padding: "6px 10px" }}>
              Page {page} of {pages}
            </span>
            <button disabled={page >= pages} onClick={() => setPage(page + 1)} style={{ padding: "6px 14px", borderRadius: 6, background: P.surface, border: `1px solid ${P.surfaceLight}`, color: P.textMuted, fontSize: 12, cursor: page >= pages ? "not-allowed" : "pointer" }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
