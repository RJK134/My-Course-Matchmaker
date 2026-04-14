import { P } from "../../styles/theme";

export default function Checkbox({ c, o, l, d }) {
  return (
    <div
      onClick={() => o(!c)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "12px 16px",
        borderRadius: 10,
        background: c ? `${P.accent}12` : `${P.surface}80`,
        border: `1px solid ${c ? P.accent + "40" : P.surfaceLight}`,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          border: `2px solid ${c ? P.accent : P.surfaceLight}`,
          background: c ? P.accent : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {c && (
          <span style={{ color: P.white, fontSize: 12, fontWeight: 700 }}>
            ✓
          </span>
        )}
      </div>
      <div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "'Trebuchet MS',sans-serif",
          }}
        >
          {l}
        </div>
        {d && (
          <div style={{ fontSize: 12, color: P.textDim, marginTop: 2 }}>
            {d}
          </div>
        )}
      </div>
    </div>
  );
}
