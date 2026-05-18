import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { P } from "../styles/theme";
import { api } from "../lib/api";
import { useAppContext } from "../context/AppContext";
import { detFeeStatus } from "../lib/nationalityResolver";
import { calculateMatch } from "../lib/matching";
import CourseExplorer from "./CourseExplorer";
import LoadingScreen from "./LoadingScreen";

// Adapt a Meilisearch hit (rich, with provenance) into the shape the
// CourseExplorer expects (legacy hand-curated JSON shape). Lake hits are
// sparse — we fill in honest unknowns so the Explorer still renders.
function hitToCourseShape(hit) {
  const isLake = hit.provenance && hit.provenance !== "curated";
  return {
    id: hit.canonical_id || hit.id,
    title: hit.title,
    institution: hit.provider || hit.institution_full_name || "Unknown",
    country: hit.country || "—",
    city: hit.city || "—",
    level: hit.level || "undergraduate",
    mode: Array.isArray(hit.mode) ? hit.mode : ["full-time"],
    domain: hit.domain || hit.subject_area || "other",
    subjects: Array.isArray(hit.subjects) && hit.subjects.length
      ? hit.subjects
      : (hit.subject_area ? [hit.subject_area] : []),
    feeHome: hit.fee_home ?? null,
    feeIntl: hit.fee_intl ?? null,
    feeScotland: hit.fee_scotland ?? null,
    livingCost: null,
    duration: hit.duration || "—",
    ranking: hit.ranking_band && hit.ranking_band !== 999 ? hit.ranking_band : null,
    entryReqs: "Check institution",
    careerPaths: Array.isArray(hit.career_paths) ? hit.career_paths : [],
    avgSalary: hit.avg_salary_subject_gbp ? `£${hit.avg_salary_subject_gbp.toLocaleString()}` : null,
    employability: hit.employability ?? null,
    online: !!hit.is_online,
    free: !!hit.is_free,
    provenance: hit.provenance || "curated",
    sourceUrl: hit.url,
    lastSeenAt: hit.last_seen_at,
    isProvisional: isLake,
  };
}

export default function CourseDetailFromSearch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useAppContext();
  const [course, setCourse] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let active = true;
    setStatus("loading");
    // The id is the Meilisearch id (e.g. "curated-54" or "lake-...slug...").
    // Search by an unscoped string then pick the exact id match.
    api.search
      .query({ q: id, page_size: 50 })
      .then((res) => {
        if (!active) return;
        const hit = res.hits.find((h) => String(h.id) === String(id));
        if (hit) {
          setCourse(hitToCourseShape(hit));
          setStatus("ok");
        } else {
          // Fallback: look in already-loaded catalogue
          const found = state.allCourses.find((c) => String(c.id) === String(id));
          if (found) {
            setCourse(found);
            setStatus("ok");
          } else {
            setStatus("not-found");
          }
        }
      })
      .catch(() => {
        // Total offline — try catalogue
        const found = state.allCourses.find((c) => String(c.id) === String(id));
        if (found) {
          setCourse(found);
          setStatus("ok");
        } else {
          setStatus("not-found");
        }
      });
    return () => { active = false; };
  }, [id, state.allCourses]);

  if (status === "loading") return <LoadingScreen name="Course" />;
  if (status === "not-found") {
    return (
      <div style={{ minHeight: "100vh", background: P.midnight, color: P.text, padding: 40, fontFamily: "'Georgia',serif" }}>
        <h1>Course not found</h1>
        <p style={{ color: P.textMuted }}>
          We couldn't find a course with id <code>{id}</code>. Try the{" "}
          <button onClick={() => navigate("/search")} style={{ color: P.accentLight, background: "none", border: "none", textDecoration: "underline", cursor: "pointer" }}>search page</button>.
        </p>
      </div>
    );
  }

  const profile = state.profile || { nationality: "—", residence: "—", ukNation: null, subjects: "" };
  const feeStatus = detFeeStatus(profile.nationality, profile.residence, course.country, profile.ukNation);
  const match = calculateMatch(course, profile);
  const enriched = { ...course, feeStatus, matchPercent: match.total, matchBreakdown: match.breakdown };

  return (
    <CourseExplorer
      course={enriched}
      profile={profile}
      allCourses={state.allCourses || []}
      onBack={() => navigate(-1)}
      onSelectAlt={(alt) => navigate(`/course/${encodeURIComponent(alt.id)}`)}
    />
  );
}
