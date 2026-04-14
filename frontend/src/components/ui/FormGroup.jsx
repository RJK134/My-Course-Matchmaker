import { P } from "../../styles/theme";

export default function FormGroup({ l, h, children }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 14,
          fontWeight: 600,
          marginBottom: h ? 2 : 8,
          fontFamily: "'Trebuchet MS',sans-serif",
          color: P.text,
        }}
      >
        {l}
      </label>
      {h && (
        <div style={{ fontSize: 12, color: P.textDim, marginBottom: 8 }}>
          {h}
        </div>
      )}
      {children}
    </div>
  );
}
