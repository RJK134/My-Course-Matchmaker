import { P } from "../styles/theme";
import { useShortlist } from "../lib/useShortlist";

export default function ShortlistButton({ course, size = "sm" }) {
  const { has, toggle } = useShortlist();
  const active = has(course.id);
  const px = size === "lg" ? 12 : 6;
  const fontSize = size === "lg" ? 16 : 12;
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(course);
      }}
      title={active ? "Remove from shortlist" : "Save to shortlist"}
      aria-label={active ? "Remove from shortlist" : "Save to shortlist"}
      style={{
        background: active ? `${P.danger}25` : "transparent",
        border: `1px solid ${active ? P.danger : P.surfaceLight}`,
        color: active ? P.danger : P.textMuted,
        cursor: "pointer",
        padding: `${px}px ${px + 4}px`,
        borderRadius: 8,
        fontSize,
        fontFamily: "'Trebuchet MS',sans-serif",
        transition: "all .15s",
      }}
      onMouseOver={(e) => {
        if (!active) e.currentTarget.style.color = P.danger;
      }}
      onMouseOut={(e) => {
        if (!active) e.currentTarget.style.color = P.textMuted;
      }}
    >
      {active ? "♥" : "♡"}
    </button>
  );
}
