import { useState } from "react";
import { P, iS, cS, cA, DL } from "../styles/theme";
import { resolveNat, NATIONALITIES } from "../lib/nationalityResolver";
import { tokenise, identifyPrimaryDomain } from "../lib/matching";
import FormGroup from "./ui/FormGroup";
import Checkbox from "./ui/Checkbox";

export default function Questionnaire({ profile, onUpdate, onGenerate, onBack }) {
  const [step, setStep] = useState(1);
  const totalSteps = 7;

  const up = (k, v) => onUpdate({ ...profile, [k]: v });
  const togMode = (m) =>
    onUpdate({
      ...profile,
      modes: profile.modes.includes(m)
        ? profile.modes.filter((x) => x !== m)
        : [...profile.modes, m],
    });

  const dName = profile.name.trim()
    ? profile.name.trim().split(/\s+/)[0]
    : "Student";

  const steps = [
    null,
    {
      tt: "Let's get to know you",
      st: "We personalise your report and calculate fees based on your nationality.",
      ct: (
        <div style={{ display: "grid", gap: 20 }}>
          <FormGroup l="Your name or nickname" h="For personalising your report.">
            <input
              type="text"
              value={profile.name}
              onChange={(e) => up("name", e.target.value)}
              placeholder="e.g. Richard, Sam..."
              style={iS}
            />
          </FormGroup>
          <FormGroup l="Your nationality" h="Primary factor for fee status.">
            <input
              list="nl"
              value={profile.nationality}
              onChange={(e) => {
                up("nationality", e.target.value);
                const r = resolveNat(e.target.value);
                if (r !== "UK") up("ukNation", "");
              }}
              placeholder="e.g. British, German, Indian..."
              style={iS}
            />
            <datalist id="nl">
              {NATIONALITIES.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            {profile.nationality && resolveNat(profile.nationality) && (
              <div
                style={{
                  marginTop: 6,
                  padding: "6px 12px",
                  borderRadius: 6,
                  background: `${P.success}12`,
                  border: `1px solid ${P.success}30`,
                  fontSize: 12,
                  color: P.success,
                }}
              >
                ✓ {resolveNat(profile.nationality)}
              </div>
            )}
          </FormGroup>
          {resolveNat(profile.nationality) === "UK" && (
            <FormGroup
              l="Which part of the UK?"
              h="Scottish-domiciled: FREE tuition at Scottish universities via SAAS. England/Wales/NI pay £9,250."
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: 8,
                }}
              >
                {["England", "Scotland", "Wales", "Northern Ireland"].map(
                  (n) => (
                    <button
                      key={n}
                      onClick={() => up("ukNation", n)}
                      style={{
                        ...cS,
                        ...(profile.ukNation === n ? cA : {}),
                      }}
                    >
                      {n}
                    </button>
                  )
                )}
              </div>
              {profile.ukNation === "Scotland" && (
                <div
                  style={{
                    marginTop: 8,
                    padding: "6px 12px",
                    borderRadius: 6,
                    background: `${P.gold}25`,
                    border: `1px solid ${P.gold}40`,
                    fontSize: 12,
                    color: P.goldLight,
                  }}
                >
                  🏴 Scottish: FREE tuition at Scottish universities via SAAS
                </div>
              )}
              {profile.ukNation === "England" && (
                <div
                  style={{
                    marginTop: 8,
                    padding: "6px 12px",
                    borderRadius: 6,
                    background: `${P.accent}15`,
                    border: `1px solid ${P.accent}30`,
                    fontSize: 12,
                    color: P.accentLight,
                  }}
                >
                  🏴󠁧󠁢󠁥󠁮󠁧󠁿 England: £9,250/yr tuition fees. Student Finance England loans available.
                </div>
              )}
              {profile.ukNation === "Wales" && (
                <div
                  style={{
                    marginTop: 8,
                    padding: "6px 12px",
                    borderRadius: 6,
                    background: `${P.accent}15`,
                    border: `1px solid ${P.accent}30`,
                    fontSize: 12,
                    color: P.accentLight,
                  }}
                >
                  🏴󠁧󠁢󠁷󠁬󠁳󠁿 Wales: Up to £9,250/yr. Student Finance Wales grants may reduce costs.
                </div>
              )}
              {profile.ukNation === "Northern Ireland" && (
                <div
                  style={{
                    marginTop: 8,
                    padding: "6px 12px",
                    borderRadius: 6,
                    background: `${P.accent}15`,
                    border: `1px solid ${P.accent}30`,
                    fontSize: 12,
                    color: P.accentLight,
                  }}
                >
                  ☘️ Northern Ireland: Up to £9,250/yr. Student Finance NI available.
                </div>
              )}
            </FormGroup>
          )}
          <FormGroup
            l="Country you live in (optional)"
            h="For residency-based exemptions (e.g. US green card)."
          >
            <input
              list="rl"
              value={profile.residence}
              onChange={(e) => up("residence", e.target.value)}
              placeholder="e.g. Switzerland, UK..."
              style={iS}
            />
            <datalist id="rl">
              {NATIONALITIES.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </FormGroup>
        </div>
      ),
    },
    {
      tt: "What do you want to study?",
      st: "Primary matching factor (55% weight).",
      ct: (
        <div style={{ display: "grid", gap: 20 }}>
          <FormGroup
            l="Primary subject"
            h="e.g. 'Theatre and acting', 'Marine biology'"
          >
            <textarea
              value={profile.subjects}
              onChange={(e) => up("subjects", e.target.value)}
              placeholder="e.g. Theatre, acting and performing arts"
              rows={3}
              style={iS}
            />
            {profile.subjects.trim().length > 0 &&
              (() => {
                const t = tokenise(profile.subjects);
                const i = identifyPrimaryDomain(t);
                return i.primary ? (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "8px 14px",
                      borderRadius: 8,
                      background: `${P.success}12`,
                      border: `1px solid ${P.success}30`,
                      fontSize: 12,
                      color: P.success,
                    }}
                  >
                    🎯 {DL[i.primary]}
                    {i.secondary.length > 0 && (
                      <span style={{ color: P.textMuted }}>
                        {" "}
                        + {i.secondary.map((d) => DL[d]).join(", ")}
                      </span>
                    )}
                  </div>
                ) : null;
              })()}
          </FormGroup>
          <FormGroup l="Level">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: 8,
              }}
            >
              {[
                { v: "undergraduate", l: "UG" },
                { v: "postgraduate", l: "PG" },
                { v: "certificate", l: "Cert" },
                { v: "any", l: "Any" },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => up("level", o.v)}
                  style={{ ...cS, ...(profile.level === o.v ? cA : {}) }}
                >
                  {o.l}
                </button>
              ))}
            </div>
          </FormGroup>
          <FormGroup l="Mode">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))",
                gap: 8,
              }}
            >
              {["full-time", "part-time", "face-to-face", "online"].map((m) => (
                <button
                  key={m}
                  onClick={() => togMode(m)}
                  style={{
                    ...cS,
                    ...(profile.modes.includes(m) ? cA : {}),
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </FormGroup>
        </div>
      ),
    },
    {
      tt: "Interests & skills",
      st: "Refines within your primary field.",
      ct: (
        <div style={{ display: "grid", gap: 20 }}>
          <FormGroup l="Broader interests">
            <textarea
              value={profile.interests}
              onChange={(e) => up("interests", e.target.value)}
              placeholder="e.g. digital performance, community work..."
              rows={3}
              style={iS}
            />
          </FormGroup>
          <FormGroup l="Skills">
            <textarea
              value={profile.skills}
              onChange={(e) => up("skills", e.target.value)}
              placeholder="e.g. creative thinking, collaboration..."
              rows={3}
              style={iS}
            />
          </FormGroup>
        </div>
      ),
    },
    {
      tt: "Learning style",
      st: "Helps match teaching approaches.",
      ct: (
        <FormGroup l="How do you learn best?">
          <textarea
            value={profile.learningStyle}
            onChange={(e) => up("learningStyle", e.target.value)}
            placeholder="e.g. Hands-on, visual, collaborative..."
            rows={4}
            style={iS}
          />
        </FormGroup>
      ),
    },
    {
      tt: "Location",
      st: "Where would you like to study?",
      ct: (
        <div style={{ display: "grid", gap: 20 }}>
          <FormGroup l="Preferred locations">
            <textarea
              value={profile.locations}
              onChange={(e) => up("locations", e.target.value)}
              placeholder="e.g. UK, Germany, Netherlands..."
              rows={2}
              style={iS}
            />
          </FormGroup>
          <FormGroup l="Options">
            <div style={{ display: "grid", gap: 10 }}>
              <Checkbox
                c={profile.searchGlobal}
                o={(v) => up("searchGlobal", v)}
                l="Worldwide"
                d="All countries"
              />
              <Checkbox
                c={profile.searchOnline}
                o={(v) => up("searchOnline", v)}
                l="Include online"
                d="MOOCs, Coursera, edX"
              />
              <Checkbox
                c={profile.searchFree}
                o={(v) => up("searchFree", v)}
                l="Free / low-cost"
                d="Tuition-free unis, free MOOCs"
              />
            </div>
          </FormGroup>
        </div>
      ),
    },
    {
      tt: "Extra-curricular",
      st: "Anything else?",
      ct: (
        <FormGroup l="Extra-curricular">
          <textarea
            value={profile.extraCurricular}
            onChange={(e) => up("extraCurricular", e.target.value)}
            placeholder="e.g. Theatre, volunteering..."
            rows={3}
            style={iS}
          />
        </FormGroup>
      ),
    },
    {
      tt: `Review, ${dName}`,
      st: "Check then generate.",
      ct: (
        <div style={{ display: "grid", gap: 8 }}>
          {[
            { l: "Name", v: profile.name },
            {
              l: "Nationality",
              v:
                profile.nationality +
                (profile.ukNation ? ` (${profile.ukNation})` : ""),
            },
            { l: "Residence", v: profile.residence },
            { l: "Subject", v: profile.subjects },
            { l: "Level", v: profile.level || "Any" },
            { l: "Mode", v: profile.modes.length ? profile.modes.join(", ") : "Any" },
            { l: "Interests", v: profile.interests },
            { l: "Skills", v: profile.skills },
            { l: "Learning", v: profile.learningStyle },
            { l: "Location", v: profile.locations || "Worldwide" },
            { l: "Options", v: [
              profile.searchGlobal && "Worldwide",
              profile.searchOnline && "Online",
              profile.searchFree && "Free/low-cost",
            ].filter(Boolean).join(", ") },
            { l: "Activities", v: profile.extraCurricular },
          ].map((x, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "100px 1fr",
                gap: 12,
                padding: "6px 0",
                borderBottom: `1px solid ${P.surfaceLight}40`,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: P.textDim,
                  textTransform: "uppercase",
                  fontFamily: "'Trebuchet MS',sans-serif",
                }}
              >
                {x.l}
              </div>
              <div style={{ fontSize: 13 }}>{x.v || "—"}</div>
            </div>
          ))}
          {(() => {
            const t = tokenise(profile.subjects);
            const i = identifyPrimaryDomain(t);
            return i.primary ? (
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  borderRadius: 10,
                  background: `${P.success}10`,
                  fontSize: 13,
                  color: P.success,
                }}
              >
                <strong>Domain:</strong> {DL[i.primary]} •{" "}
                <strong>Fees:</strong> {profile.nationality}
                {profile.ukNation ? ` (${profile.ukNation})` : ""}
              </div>
            ) : null;
          })()}
        </div>
      ),
    },
  ];

  const cur = steps[step];
  const ok =
    step === 7 ||
    (step === 1 &&
      profile.name.trim().length > 0 &&
      profile.nationality.trim().length > 0 &&
      (resolveNat(profile.nationality) !== "UK" ||
        profile.ukNation.length > 0)) ||
    (step === 2 && profile.subjects.trim().length > 0) ||
    (step > 2 && step < 7);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg,${P.midnight},${P.navy})`,
        fontFamily: "'Georgia',serif",
        color: P.text,
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 36,
          }}
        >
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : onBack())}
            style={{
              background: "none",
              border: "none",
              color: P.textDim,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "'Trebuchet MS',sans-serif",
            }}
          >
            ← {step === 1 ? "Home" : "Back"}
          </button>
          <div
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: P.surfaceLight,
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 2,
                background: `linear-gradient(90deg,${P.accent},${P.accentLight})`,
                width: `${(step / totalSteps) * 100}%`,
                transition: "width 0.4s",
              }}
            />
          </div>
          <span
            style={{
              fontSize: 12,
              color: P.textDim,
              fontFamily: "'Trebuchet MS',sans-serif",
            }}
          >
            {step}/{totalSteps}
          </span>
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 400, margin: "0 0 6px" }}>
          {cur.tt}
        </h2>
        <p
          style={{
            fontSize: 13,
            color: P.textMuted,
            margin: "0 0 24px",
          }}
        >
          {cur.st}
        </p>
        {cur.ct}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 28,
          }}
        >
          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!ok}
              style={{
                padding: "12px 28px",
                fontSize: 14,
                fontFamily: "'Trebuchet MS',sans-serif",
                fontWeight: 600,
                color: P.white,
                background: ok
                  ? `linear-gradient(135deg,${P.accent},#2563EB)`
                  : P.surfaceLight,
                border: "none",
                borderRadius: 10,
                cursor: ok ? "pointer" : "not-allowed",
                opacity: ok ? 1 : 0.5,
              }}
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={onGenerate}
              style={{
                padding: "12px 32px",
                fontSize: 14,
                fontFamily: "'Trebuchet MS',sans-serif",
                fontWeight: 600,
                color: P.midnight,
                background: `linear-gradient(135deg,${P.gold},${P.goldLight})`,
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                boxShadow: `0 4px 20px ${P.gold}40`,
              }}
            >
              🎯 Generate {dName}'s Matches
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
