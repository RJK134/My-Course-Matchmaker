import { P } from "../styles/theme";

export default function MatchBadge({ p, s = "sm" }) {
  const sz = s === "lg" ? 56 : 48;
  const fs = s === "lg" ? 16 : 14;
  const c = p >= 80 ? P.success : p >= 60 ? P.accent : p >= 40 ? P.gold : P.danger;

  return (
    <div
      style={{
        width: sz,
        height: sz,
        borderRadius: "50%",
        border: `3px solid ${c}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: fs,
          fontWeight: 700,
          color: c,
          fontFamily: "'Trebuchet MS',sans-serif",
        }}
      >
        {p}%
      </span>
    </div>
  );
}
