import { P } from "../styles/theme";

export default function Landing({ onStart, courseCount, institutionCount, cityCount }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg,${P.midnight},${P.navy} 40%,${P.deep})`,
        fontFamily: "'Georgia',serif",
        color: P.text,
      }}
    >
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 860,
          margin: "0 auto",
          padding: "60px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -80,
            right: -120,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: `radial-gradient(circle,${P.accent}15,transparent 70%)`,
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            display: "inline-block",
            padding: "6px 18px",
            borderRadius: 20,
            background: `${P.accent}20`,
            border: `1px solid ${P.accent}40`,
            fontSize: 13,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: P.accentLight,
            marginBottom: 28,
            fontFamily: "'Trebuchet MS',sans-serif",
          }}
        >
          Future Horizons Education
        </div>
        <h1
          style={{
            fontSize: "clamp(2.2rem,5vw,3.4rem)",
            fontWeight: 400,
            lineHeight: 1.15,
            margin: "0 0 20px",
            letterSpacing: "-0.02em",
          }}
        >
          My<span style={{ color: P.accent, fontWeight: 700 }}>Course</span>
          Matchmaker
        </h1>
        <p
          style={{
            fontSize: "clamp(1rem,2.5vw,1.25rem)",
            color: P.textMuted,
            maxWidth: 600,
            margin: "0 auto 12px",
            lineHeight: 1.65,
          }}
        >
          Find your perfect course — with detailed cost-of-living data, institution
          profiles, maps, and preparation guides.
        </p>
        <p
          style={{
            fontSize: 14,
            color: P.textDim,
            maxWidth: 540,
            margin: "0 auto 40px",
            lineHeight: 1.5,
          }}
        >
          {courseCount} courses • {institutionCount} institutions profiled •{" "}
          {cityCount} cities with cost data • Fees by nationality • Clickable
          funding links
        </p>
        <button
          onClick={onStart}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "16px 40px",
            fontSize: 17,
            fontFamily: "'Trebuchet MS',sans-serif",
            fontWeight: 600,
            color: P.white,
            background: `linear-gradient(135deg,${P.accent},#2563EB)`,
            border: "none",
            borderRadius: 12,
            cursor: "pointer",
            boxShadow: `0 4px 24px ${P.accent}40`,
            transition: "transform 0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.transform = "translateY(-2px)")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.transform = "translateY(0)")
          }
        >
          Start Matching →
        </button>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
            gap: 12,
            marginTop: 48,
          }}
        >
          {[
            { i: "🎯", l: "Smart Match", d: "Domain-priority algorithm" },
            { i: "💰", l: "Cost of Living", d: "Rent, food, transport by city" },
            { i: "🏛️", l: "Institution Profiles", d: "History, contact, rankings" },
            { i: "📍", l: "Maps & Guides", d: "OpenStreetMap locator" },
            { i: "📚", l: "Course Prep", d: "Reading lists & online prep" },
            { i: "🔗", l: "Clickable Links", d: "Apply, funding, support" },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                padding: 14,
                borderRadius: 12,
                background: `${P.surface}90`,
                border: `1px solid ${P.surfaceLight}60`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>{f.i}</div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "'Trebuchet MS',sans-serif",
                  marginBottom: 2,
                }}
              >
                {f.l}
              </div>
              <div style={{ fontSize: 10, color: P.textDim }}>{f.d}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
