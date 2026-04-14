import { P } from "../styles/theme";

export default function LoadingScreen({ name }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg,${P.midnight},${P.navy})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        fontFamily: "'Georgia',serif",
        color: P.text,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          border: `3px solid ${P.surfaceLight}`,
          borderTopColor: P.accent,
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          marginBottom: 28,
        }}
      />
      <h2 style={{ fontSize: 22, fontWeight: 400, margin: "0 0 12px" }}>
        Analysing your profile, {name}...
      </h2>
      <p
        style={{
          color: P.textMuted,
          fontSize: 14,
          textAlign: "center",
          maxWidth: 400,
        }}
      >
        Matching courses, calculating fees, gathering cost-of-living data...
      </p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
