import { useState } from "react";
import { P, DL } from "../styles/theme";
import { getFee } from "../lib/nationalityResolver";
import { getFund } from "../lib/fundingSources";
import { getCourseUrl, getInstData } from "../lib/courseUrl";
import { calculateMatch, identifyPrimaryDomain, tokenise } from "../lib/matching";
import { detFeeStatus } from "../lib/nationalityResolver";
import costOfLivingData from "../data/costOfLiving.json";

const COL_LOOKUP = Object.fromEntries(costOfLivingData.map((c) => [c.city, c]));

export default function CourseExplorer({ course, profile, allCourses, onBack, onSelectAlt }) {
  const [tab, setTab] = useState("costs");
  const inst = getInstData(course.institution);
  const col = COL_LOOKUP[course.city] || null;
  const fs = course.feeStatus;
  const fee = getFee(course, fs);
  const freeAlts = allCourses.filter(
    (c) => c.free && c.online && c.domain === course.domain && c.id !== course.id
  );

  const tabStyle = (active) => ({
    padding: "10px 18px",
    fontSize: 13,
    fontFamily: "'Trebuchet MS',sans-serif",
    fontWeight: 600,
    cursor: "pointer",
    borderRadius: "8px 8px 0 0",
    border: "none",
    background: active ? P.surface : "transparent",
    color: active ? P.accentLight : P.textDim,
    transition: "all 0.2s",
  });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(160deg,${P.midnight},${P.navy})`,
        fontFamily: "'Georgia',serif",
        color: P.text,
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 20px" }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: P.textDim,
            fontSize: 14,
            cursor: "pointer",
            fontFamily: "'Trebuchet MS',sans-serif",
            marginBottom: 16,
          }}
        >
          ← Back to results
        </button>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 600,
                margin: 0,
                fontFamily: "'Trebuchet MS',sans-serif",
              }}
            >
              {course.title}
            </h1>
            <p style={{ color: P.textMuted, fontSize: 15, margin: "4px 0 0" }}>
              {inst.full || course.institution}
            </p>
            <p style={{ color: P.textDim, fontSize: 12, margin: "4px 0 0" }}>
              {course.city}, {course.country} • {course.duration} •{" "}
              {course.level}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a
              href={getCourseUrl(course)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                background: `linear-gradient(135deg,${P.accent},#2563EB)`,
                color: P.white,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                fontFamily: "'Trebuchet MS',sans-serif",
              }}
            >
              Apply / Course Page →
            </a>
            {inst.url && (
              <a
                href={inst.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  background: P.surface,
                  border: `1px solid ${P.surfaceLight}`,
                  color: P.accentLight,
                  fontSize: 13,
                  textDecoration: "none",
                  fontFamily: "'Trebuchet MS',sans-serif",
                }}
              >
                University Website
              </a>
            )}
          </div>
        </div>

        {/* TAB BAR */}
        <div
          style={{
            display: "flex",
            gap: 4,
            borderBottom: `2px solid ${P.surfaceLight}`,
            marginBottom: 0,
          }}
        >
          {[
            { k: "costs", l: "💰 Costs & Living" },
            { k: "inst", l: "🏛️ Institution" },
            { k: "prep", l: "📚 Preparation" },
            { k: "map", l: "📍 Location & Map" },
            { k: "support", l: "🤝 Support" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              style={tabStyle(tab === t.k)}
            >
              {t.l}
            </button>
          ))}
        </div>

        <div
          style={{
            background: P.surface,
            borderRadius: "0 0 12px 12px",
            padding: 24,
            minHeight: 400,
          }}
        >
          {/* COSTS TAB */}
          {tab === "costs" && (
            <div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  margin: "0 0 16px",
                  fontFamily: "'Trebuchet MS',sans-serif",
                }}
              >
                Cost Breakdown for {profile.nationality} Students
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    background: P.navy,
                    border: `1px solid ${P.surfaceLight}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: P.textDim,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Tuition Fee/yr ({fs === "ruk" ? "rest-of-UK" : fs})
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: P.goldLight,
                      fontFamily: "'Trebuchet MS',sans-serif",
                    }}
                  >
                    {fee === 0 ? "FREE" : "£" + fee.toLocaleString()}
                  </div>
                </div>
                <div
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    background: P.navy,
                    border: `1px solid ${P.surfaceLight}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: P.textDim,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                    }}
                  >
                    Est. Total Cost ({course.duration})
                  </div>
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: P.goldLight,
                      fontFamily: "'Trebuchet MS',sans-serif",
                    }}
                  >
                    {(() => {
                      const y = parseInt(course.duration) || 1;
                      const t = (fee + (course.livingCost || 0)) * y;
                      return t === 0 ? "FREE" : "£" + t.toLocaleString();
                    })()}
                  </div>
                </div>
              </div>

              {col ? (
                <div>
                  <h4
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      margin: "0 0 12px",
                      fontFamily: "'Trebuchet MS',sans-serif",
                    }}
                  >
                    Monthly Living Costs in {course.city}
                  </h4>
                  <div style={{ fontSize: 12, color: P.textDim, marginBottom: 12 }}>
                    {col.note}
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {[
                      { l: "🏠 Rent (1-bed/studio)", v: col.rent },
                      { l: "🛒 Food & Groceries", v: col.food },
                      { l: "🚌 Transport", v: col.transport },
                      { l: "💡 Utilities (elec/gas/water/internet)", v: col.utils },
                      { l: "🎭 Misc (social/clothes/books)", v: col.misc },
                    ].map((r, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          borderRadius: 8,
                          background: `${P.navy}80`,
                        }}
                      >
                        <span style={{ fontSize: 14 }}>{r.l}</span>
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: P.accentLight,
                            fontFamily: "'Trebuchet MS',sans-serif",
                          }}
                        >
                          {col.currency}
                          {r.v.toLocaleString()}/mo
                        </span>
                      </div>
                    ))}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: 8,
                        background: `${P.accent}15`,
                        border: `1px solid ${P.accent}30`,
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 700 }}>
                        Monthly Total
                      </span>
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: P.gold,
                          fontFamily: "'Trebuchet MS',sans-serif",
                        }}
                      >
                        {col.currency}
                        {(col.rent + col.food + col.transport + col.utils + col.misc).toLocaleString()}
                        /mo
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "12px 14px",
                        borderRadius: 8,
                        background: `${P.gold}10`,
                        border: `1px solid ${P.gold}25`,
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 700 }}>
                        Annual Living Cost
                      </span>
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: P.goldLight,
                          fontFamily: "'Trebuchet MS',sans-serif",
                        }}
                      >
                        {col.currency}
                        {((col.rent + col.food + col.transport + col.utils + col.misc) * 12).toLocaleString()}
                        /yr
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: 16,
                      fontSize: 12,
                      color: P.textDim,
                      lineHeight: 1.5,
                    }}
                  >
                    Sources:{" "}
                    <a href="https://www.numbeo.com/cost-of-living/" target="_blank" rel="noopener noreferrer" style={{ color: P.accentLight }}>Numbeo</a>
                    {" • "}
                    <a href="https://www.expatistan.com/cost-of-living/" target="_blank" rel="noopener noreferrer" style={{ color: P.accentLight }}>Expatistan</a>
                    {" • "}
                    <a href="https://livingcost.org/cost" target="_blank" rel="noopener noreferrer" style={{ color: P.accentLight }}>LivingCost.org</a>
                    {" • Student union surveys. Figures are estimates — verify locally."}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: 20,
                    borderRadius: 10,
                    background: `${P.gold}10`,
                    fontSize: 13,
                    color: P.goldLight,
                  }}
                >
                  Cost of living data not yet available for {course.city}. Check{" "}
                  <a
                    href={`https://www.numbeo.com/cost-of-living/in/${encodeURIComponent(course.city)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: P.accentLight }}
                  >
                    Numbeo
                  </a>{" "}
                  for estimates.
                </div>
              )}

              {/* FUNDING */}
              <h4
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  margin: "24px 0 12px",
                  fontFamily: "'Trebuchet MS',sans-serif",
                }}
              >
                Funding Sources
              </h4>
              <div style={{ display: "grid", gap: 6 }}>
                {getFund(course.country, fs, profile.nationality).map((f, i) => (
                  <a
                    key={i}
                    href={f.u}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 13,
                      color: P.accentLight,
                      textDecoration: "none",
                      padding: "8px 12px",
                      borderRadius: 6,
                      background: `${P.navy}80`,
                      display: "block",
                      lineHeight: 1.4,
                    }}
                  >
                    🔗 {f.t}
                  </a>
                ))}
              </div>

              {/* FREE ALTS */}
              {freeAlts.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <h4
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      margin: "0 0 8px",
                      fontFamily: "'Trebuchet MS',sans-serif",
                      color: P.success,
                    }}
                  >
                    💡 Free Online Alternatives
                  </h4>
                  <div style={{ display: "grid", gap: 8 }}>
                    {freeAlts.map((a) => (
                      <div
                        key={a.id}
                        onClick={() => onSelectAlt(a)}
                        style={{
                          padding: "10px 14px",
                          borderRadius: 8,
                          background: `${P.navy}80`,
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            fontFamily: "'Trebuchet MS',sans-serif",
                          }}
                        >
                          {a.title}{" "}
                          <span style={{ color: P.success, fontSize: 11 }}>
                            FREE
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: P.textMuted }}>
                          {a.institution} • {a.duration}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* INSTITUTION TAB */}
          {tab === "inst" && (
            <div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  margin: "0 0 16px",
                  fontFamily: "'Trebuchet MS',sans-serif",
                }}
              >
                About {inst.full || course.institution}
              </h3>
              {inst.desc && (
                <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>
                  {inst.desc}
                </p>
              )}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                {[
                  inst.type && { l: "Type", v: inst.type },
                  inst.founded && { l: "Founded", v: inst.founded },
                  { l: "Location", v: `${course.city}, ${course.country}` },
                  inst.students && {
                    l: "Students",
                    v: inst.students.toLocaleString(),
                  },
                ]
                  .filter(Boolean)
                  .map((x, i) => (
                    <div
                      key={i}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: `${P.navy}80`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: P.textDim,
                          textTransform: "uppercase",
                        }}
                      >
                        {x.l}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                        {x.v}
                      </div>
                    </div>
                  ))}
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {inst.url && (
                  <a href={inst.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                    🌐 University Website: {inst.url}
                  </a>
                )}
                {inst.apply && (
                  <a href={inst.apply} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                    📝 Apply / Course Finder
                  </a>
                )}
                {inst.contact && (
                  <div style={{ fontSize: 13, color: P.text, padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                    📧 Contact: <a href={`mailto:${inst.contact}`} style={{ color: P.accentLight }}>{inst.contact}</a>
                  </div>
                )}
                {(course.country === "UK" || course.country === "Scotland") && (
                  <a href="https://discoveruni.gov.uk/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                    📊 DiscoverUni — official UK course data & student satisfaction
                  </a>
                )}
                <a href={`https://www.topuniversities.com/universities/${encodeURIComponent((inst.full || course.institution).toLowerCase().replace(/\s+/g, "-"))}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                  🏆 QS World University Rankings Profile
                </a>
                <a href="https://www.timeshighereducation.com/world-university-rankings" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                  📈 THE World University Rankings
                </a>
              </div>
            </div>
          )}

          {/* PREPARATION TAB */}
          {tab === "prep" && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px", fontFamily: "'Trebuchet MS',sans-serif" }}>
                Preparing for {course.title}
              </h3>
              <div style={{ padding: 16, borderRadius: 10, background: `${P.navy}80`, marginBottom: 16 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px", fontFamily: "'Trebuchet MS',sans-serif" }}>Entry Requirements</h4>
                <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>{course.entryReqs}</p>
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px", fontFamily: "'Trebuchet MS',sans-serif" }}>📖 Recommended Preparation</h4>
              <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
                <a href={`https://www.coursera.org/search?query=${encodeURIComponent(course.subjects.slice(0, 3).join(" "))}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                  🎓 Coursera — search "{course.subjects.slice(0, 3).join(", ")}" introductory courses
                </a>
                <a href={`https://www.edx.org/search?q=${encodeURIComponent(course.subjects.slice(0, 2).join(" "))}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                  🎓 edX — search "{course.subjects.slice(0, 2).join(", ")}" free courses
                </a>
                <a href={`https://www.futurelearn.com/search?q=${encodeURIComponent(course.subjects[0])}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                  🎓 FutureLearn — "{course.subjects[0]}" short courses
                </a>
                <a href={`https://www.khanacademy.org/search?search_again=1&page_search_query=${encodeURIComponent(course.subjects[0])}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                  📚 Khan Academy — free foundational learning
                </a>
                <a href={`https://www.google.com/search?q=best+books+for+studying+${encodeURIComponent(course.subjects.slice(0, 2).join("+"))}+at+university`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                  📚 Recommended reading lists for {DL[course.domain] || "this subject"}
                </a>
                {(course.country === "UK" || course.country === "Scotland") && (
                  <a href="https://nationalcareers.service.gov.uk/find-a-course" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                    🇬🇧 National Careers Service — find preparatory courses in England
                  </a>
                )}
                {course.level === "undergraduate" && (
                  <a href="https://www.accesstohe.ac.uk/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                    🎓 Access to Higher Education Diplomas — alternative entry route
                  </a>
                )}
              </div>
              <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px", fontFamily: "'Trebuchet MS',sans-serif" }}>🎯 Career Pathways</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {course.careerPaths.map((c, i) => (
                  <span key={i} style={{ padding: "6px 14px", borderRadius: 20, background: `${P.accent}20`, border: `1px solid ${P.accent}30`, fontSize: 12, color: P.accentLight }}>{c}</span>
                ))}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: P.success }}>
                {course.avgSalary} expected salary • {course.employability}% employability
              </div>
            </div>
          )}

          {/* MAP TAB */}
          {tab === "map" && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px", fontFamily: "'Trebuchet MS',sans-serif" }}>
                Location: {course.city}, {course.country}
              </h3>
              {inst.lat && inst.lng ? (
                <div style={{ marginBottom: 16 }}>
                  <iframe
                    title="map"
                    width="100%"
                    height="350"
                    frameBorder="0"
                    style={{ borderRadius: 12, border: `1px solid ${P.surfaceLight}` }}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${inst.lng - 0.02},${inst.lat - 0.015},${inst.lng + 0.02},${inst.lat + 0.015}&layer=mapnik&marker=${inst.lat},${inst.lng}`}
                  />
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <a href={`https://www.google.com/maps/search/${encodeURIComponent(inst.full || course.institution)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: P.accentLight, padding: "6px 12px", borderRadius: 6, background: `${P.navy}80`, textDecoration: "none" }}>
                      Open in Google Maps
                    </a>
                    <a href={`https://www.openstreetmap.org/?mlat=${inst.lat}&mlon=${inst.lng}#map=15/${inst.lat}/${inst.lng}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: P.accentLight, padding: "6px 12px", borderRadius: 6, background: `${P.navy}80`, textDecoration: "none" }}>
                      Open in OpenStreetMap
                    </a>
                  </div>
                </div>
              ) : (
                <div style={{ padding: 20, borderRadius: 10, background: `${P.navy}80`, marginBottom: 16, textAlign: "center" }}>
                  <a href={`https://www.google.com/maps/search/${encodeURIComponent((inst.full || course.institution) + " " + course.city)}`} target="_blank" rel="noopener noreferrer" style={{ color: P.accentLight, fontSize: 14 }}>
                    📍 View {inst.full || course.institution} on Google Maps
                  </a>
                </div>
              )}
              <h4 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 8px", fontFamily: "'Trebuchet MS',sans-serif" }}>🏙️ Area Guides</h4>
              <div style={{ display: "grid", gap: 8 }}>
                <a href={`https://www.google.com/search?q=${encodeURIComponent(course.city + " student area guide")}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                  🔍 {course.city} student area guide
                </a>
                <a href={`https://www.numbeo.com/cost-of-living/in/${encodeURIComponent(course.city)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                  💰 Numbeo — {course.city} cost of living index
                </a>
                <a href={`https://www.google.com/search?q=${encodeURIComponent(course.city + " student accommodation")}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                  🏠 Student accommodation in {course.city}
                </a>
                <a href={`https://www.google.com/search?q=${encodeURIComponent(course.city + " public transport student")}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                  🚌 Public transport in {course.city}
                </a>
                {(course.country === "UK" || course.country === "Scotland") && (
                  <a href={`https://www.studentcrowd.com/best-cities-s1008?q=${encodeURIComponent(course.city)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                    ⭐ StudentCrowd — {course.city} student reviews
                  </a>
                )}
              </div>
            </div>
          )}

          {/* SUPPORT TAB */}
          {tab === "support" && (
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 16px", fontFamily: "'Trebuchet MS',sans-serif" }}>
                Student Support Resources
              </h3>
              <div style={{ display: "grid", gap: 10 }}>
                {inst.contact && (
                  <div style={{ padding: 14, borderRadius: 8, background: `${P.navy}80` }}>
                    <div style={{ fontSize: 11, color: P.textDim, textTransform: "uppercase" }}>Admissions Contact</div>
                    <a href={`mailto:${inst.contact}`} style={{ fontSize: 14, color: P.accentLight, textDecoration: "none" }}>{inst.contact}</a>
                  </div>
                )}
                {inst.url && (
                  <a href={inst.url + "/student-life"} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                    🎒 Student life at {course.institution}
                  </a>
                )}
                <a href={`https://www.google.com/search?q=${encodeURIComponent(course.institution + " student support services")}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                  🤝 Student support services
                </a>
                <a href={`https://www.google.com/search?q=${encodeURIComponent(course.institution + " students union")}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                  🗳️ Students' Union
                </a>
                <a href={`https://www.google.com/search?q=${encodeURIComponent(course.institution + " international students office")}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                  🌍 International Students Office
                </a>
                <a href={`https://www.google.com/search?q=${encodeURIComponent(course.institution + " disability support")}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                  ♿ Disability & Accessibility Support
                </a>
                <a href={`https://www.google.com/search?q=${encodeURIComponent(course.institution + " mental health counselling")}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                  💚 Mental Health & Counselling
                </a>
                {course.country === "UK" && (
                  <a href="https://www.studentminds.org.uk/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                    💚 Student Minds — UK student mental health charity
                  </a>
                )}
                <a href={`https://www.google.com/search?q=${encodeURIComponent(course.city + " GP doctor register student")}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                  🏥 Register with a doctor/GP in {course.city}
                </a>
                {course.country !== "UK" && course.country !== "Scotland" && course.country !== "Online" && (
                  <a href={`https://www.google.com/search?q=${encodeURIComponent(course.country + " student visa requirements")}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: P.accentLight, textDecoration: "none", padding: "10px 14px", borderRadius: 6, background: `${P.navy}80` }}>
                    🛂 Visa requirements for {course.country}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
