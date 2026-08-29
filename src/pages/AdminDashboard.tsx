import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";
import {
  SECTORS, MAHARASHTRA_DISTRICTS, SECTOR_SKILLS, DISTRICT_DEMAND,
  MOCK_STUDENTS, MOCK_INSTITUTES, MOCK_EMPLOYERS, MOCK_VACANCIES,
  getDemandColor, getTrendIcon, getTrendClass, getSkillGapForSector,
  type Sector, type District,
} from "../data";

interface Props {
  onLogout: () => void;
}

type Tab = "users" | "demand" | "gap" | "vacancies" | "institutes";

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: "users",      label: "User Management",          icon: "👥" },
  { id: "demand",     label: "Industry Demand Analytics", icon: "📊" },
  { id: "gap",        label: "Skill Gap Analysis",        icon: "✦" },
  { id: "vacancies",  label: "Vacancy Management",        icon: "📋" },
  { id: "institutes", label: "Institute Verification",    icon: "🏫" },
];

const PURPLE = "#3b1e6e";
const PURPLE_LIGHT = "#7c3aed";

export default function AdminDashboard({ onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("users");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userType, setUserType] = useState<"students" | "institutes" | "employers">("students");
  const [demandSector, setDemandSector] = useState<Sector>("IT & Communication");
  const [demandDistrict, setDemandDistrict] = useState<District>("Pune");
  const [gapSector, setGapSector] = useState<Sector>("IT & Communication");
  const [gapDistrict, setGapDistrict] = useState<District>("Pune");
  const [, forceUpdate] = useState(0);

  // Institute verification action
  function toggleVerification(id: string) {
    const inst = MOCK_INSTITUTES.find((i) => i.instituteId === id);
    if (inst) { inst.verified = !inst.verified; forceUpdate((n) => n + 1); }
  }

  // Data
  const gapData = getSkillGapForSector(gapSector, gapDistrict);

  const districtDemandData = [...MAHARASHTRA_DISTRICTS]
    .map((d) => ({ name: d, score: DISTRICT_DEMAND[d] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 15);

  const sectorDemandData = SECTORS.map((s) => ({
    name: s.split(" & ")[0].split(" ")[0],
    full: s,
    demand: Math.round(SECTOR_SKILLS[s].filter((sk) => sk.trend === "rising").length / SECTOR_SKILLS[s].length * 100),
  }));

  const demandSectorSkills = SECTOR_SKILLS[demandSector];
  const topDemandSkills = [...demandSectorSkills].sort((a, b) => b.demand - a.demand).slice(0, 8);

  // Vacancy health
  const lowPlacementVacancies = MOCK_VACANCIES.filter((v) => v.filled === 0 || (v.vacancies > 0 && v.filled / v.vacancies < 0.3));
  const highPlacementVacancies = MOCK_VACANCIES.filter((v) => v.vacancies > 0 && v.filled / v.vacancies >= 0.3);

  const userPie = [
    { name: "Students", value: MOCK_STUDENTS.length },
    { name: "Institutes", value: MOCK_INSTITUTES.length },
    { name: "Employers", value: MOCK_EMPLOYERS.length },
  ];
  const pieColors = [PURPLE, "#f4a42b", "#1a7a6e"];

  return (
    <div className="min-h-full flex" style={{ background: "#f5f7fb" }}>
      {/* Sidebar */}
      <aside className={`flex-shrink-0 flex flex-col transition-all duration-300 ${sidebarOpen ? "w-64" : "w-16"}`}
        style={{ background: "#1a0a2e", minHeight: "100vh", position: "sticky", top: 0, maxHeight: "100vh", overflowY: "auto" }}>
        <div className="p-4 flex items-center gap-3 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm" style={{ background: "#f4a42b" }}>⚙️</div>
          {sidebarOpen && <span className="text-white font-bold text-sm">SkillBridge Admin</span>}
        </div>

        {sidebarOpen && (
          <div className="px-4 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <div className="text-white text-sm font-semibold">Super Admin</div>
            <div className="text-xs mt-0.5" style={{ color: "#c4b5fd" }}>admin@skillbridge.gov.in</div>
            <div className="mt-2 px-2 py-0.5 rounded-full text-xs w-fit font-medium" style={{ background: "rgba(244,164,43,0.2)", color: "#fbbf24" }}>
              Government of Maharashtra
            </div>
          </div>
        )}

        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {NAV.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${tab === item.id ? "bg-amber-400/20 text-amber-300 border-r-2 border-amber-400" : "text-purple-200 hover:bg-white/10 hover:text-white"}`}>
              <span className="flex-shrink-0 w-5 text-center">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 space-y-2 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-purple-300 hover:text-white hover:bg-white/10 transition-all">
            <span>{sidebarOpen ? "◀" : "▶"}</span>
            {sidebarOpen && "Collapse"}
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-300 hover:text-white hover:bg-red-500/20 transition-all">
            <span>⎋</span>
            {sidebarOpen && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-8 page-enter">

        {/* ── USER MANAGEMENT ───────────────────────────────────────── */}
        {tab === "users" && (
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#111827", fontFamily: "var(--font-serif)" }}>User Management</h1>
            <p className="text-sm mb-6" style={{ color: "#6b7280" }}>View and manage all registered users across SkillBridge</p>

            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Students", value: MOCK_STUDENTS.length, icon: "🎓", color: PURPLE, bg: "#f5f3ff" },
                { label: "Training Institutes", value: MOCK_INSTITUTES.length, icon: "🏫", color: "#1a7a6e", bg: "#f0fdf4" },
                { label: "Registered Employers", value: MOCK_EMPLOYERS.length, icon: "🏢", color: "#0f2942", bg: "#eff6ff" },
                { label: "Total Platform Users", value: MOCK_STUDENTS.length + MOCK_INSTITUTES.length + MOCK_EMPLOYERS.length, icon: "👥", color: "#d97706", bg: "#fffbeb" },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl p-5 shadow-sm" style={{ background: c.bg, border: `1px solid ${c.color}20` }}>
                  <div className="text-2xl mb-1">{c.icon}</div>
                  <div className="text-2xl font-bold mb-0.5" style={{ color: c.color }}>{c.value}</div>
                  <div className="text-xs font-medium" style={{ color: "#6b7280" }}>{c.label}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: "1fr 1.5fr" }}>
              <div className="rounded-2xl p-6 bg-white shadow-sm">
                <h3 className="font-semibold mb-4 text-sm" style={{ color: "#111827" }}>User Distribution</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={userPie} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={3} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {userPie.map((_, i) => <Cell key={i} fill={pieColors[i]}/>)}
                    </Pie>
                    <Tooltip/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-2xl p-6 bg-white shadow-sm">
                <h3 className="font-semibold mb-4 text-sm" style={{ color: "#111827" }}>Sector Distribution (Students)</h3>
                <div className="space-y-2">
                  {SECTORS.slice(0, 5).map((s) => {
                    const count = MOCK_STUDENTS.filter((st) => st.sector === s).length;
                    return (
                      <div key={s} className="flex items-center gap-3">
                        <span className="text-xs w-40 truncate shrink-0" style={{ color: "#374151" }}>{s}</span>
                        <div className="flex-1 h-2 rounded-full" style={{ background: "#e5e7eb" }}>
                          <div className="h-2 rounded-full" style={{ width: `${count > 0 ? 100 : 5}%`, background: PURPLE }}/>
                        </div>
                        <span className="text-xs font-mono w-5 text-right" style={{ color: PURPLE }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* User type tabs */}
            <div className="flex gap-2 mb-4">
              {(["students", "institutes", "employers"] as const).map((t) => (
                <button key={t} onClick={() => setUserType(t)}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize"
                  style={userType === t ? { background: PURPLE, color: "#fff" } : { background: "#fff", color: "#374151", border: "1px solid #e5e7eb" }}>
                  {t === "students" ? `Students (${MOCK_STUDENTS.length})` : t === "institutes" ? `Institutes (${MOCK_INSTITUTES.length})` : `Employers (${MOCK_EMPLOYERS.length})`}
                </button>
              ))}
            </div>

            {/* Students table */}
            {userType === "students" && (
              <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                      {["Username", "Age", "Education", "College", "Location", "Sector", "Skills"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6b7280" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_STUDENTS.map((s, i) => (
                      <tr key={s.username} style={{ borderBottom: i < MOCK_STUDENTS.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                        <td className="px-4 py-3 font-medium" style={{ color: "#111827" }}>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: PURPLE }}>
                              {s.username[0].toUpperCase()}
                            </div>
                            {s.username}
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ color: "#374151" }}>{s.age}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#374151" }}>{s.education}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#374151" }}>{s.college}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#374151" }}>📍 {s.location}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#374151" }}>{s.sector.split(" ")[0]}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {s.skills.slice(0, 2).map((sk) => (
                              <span key={sk} className="px-1.5 py-0.5 rounded text-xs" style={{ background: "#eff6ff", color: "#1d4ed8" }}>{sk}</span>
                            ))}
                            {s.skills.length > 2 && <span className="text-xs" style={{ color: "#9ca3af" }}>+{s.skills.length - 2}</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Institutes table */}
            {userType === "institutes" && (
              <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                      {["Institute", "ID", "District", "Courses", "Verification", "Registered"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6b7280" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_INSTITUTES.map((inst, i) => (
                      <tr key={inst.instituteId} style={{ borderBottom: i < MOCK_INSTITUTES.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                        <td className="px-4 py-3 font-medium text-sm" style={{ color: "#111827" }}>{inst.instituteName}</td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: "#6b7280" }}>{inst.instituteId}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#374151" }}>📍 {inst.district}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#374151" }}>{inst.courses.length} courses</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={inst.verified ? { background: "#f0fdf4", color: "#16a34a" } : { background: "#fff7ed", color: "#c2410c" }}>
                            {inst.verified ? "✓ Verified" : "⏳ Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#9ca3af" }}>{inst.registeredOn}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Employers table */}
            {userType === "employers" && (
              <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e5e7eb" }}>
                      {["Company", "HR Contact", "Sector", "Locations", "Vacancies", "Verification"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: "#6b7280" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_EMPLOYERS.map((emp, i) => (
                      <tr key={emp.email} style={{ borderBottom: i < MOCK_EMPLOYERS.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                        <td className="px-4 py-3 font-medium" style={{ color: "#111827" }}>{emp.companyName}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#374151" }}>{emp.hrName}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#374151" }}>{emp.sector.split(" ")[0]}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#374151" }}>{emp.locations.slice(0, 2).join(", ")}{emp.locations.length > 2 ? ` +${emp.locations.length - 2}` : ""}</td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: "#374151" }}>{MOCK_VACANCIES.filter((v) => v.employerEmail === emp.email).length}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={emp.verified ? { background: "#f0fdf4", color: "#16a34a" } : { background: "#fff7ed", color: "#c2410c" }}>
                            {emp.verified ? "✓ Verified" : "⏳ Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── INDUSTRY DEMAND ANALYTICS ─────────────────────────────── */}
        {tab === "demand" && (
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#111827", fontFamily: "var(--font-serif)" }}>Industry Demand Analytics</h1>
            <p className="text-sm mb-6" style={{ color: "#6b7280" }}>Real-time skill demand across Maharashtra districts and sectors</p>

            {/* Filters */}
            <div className="flex gap-4 mb-8 flex-wrap">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Filter by Sector</label>
                <select value={demandSector} onChange={(e) => setDemandSector(e.target.value as Sector)}
                  className="px-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none" style={{ borderColor: "#d1d5db", minWidth: "220px" }}>
                  {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Filter by District</label>
                <select value={demandDistrict} onChange={(e) => setDemandDistrict(e.target.value as District)}
                  className="px-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none" style={{ borderColor: "#d1d5db", minWidth: "180px" }}>
                  {MAHARASHTRA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <div className="px-4 py-2.5 rounded-xl text-sm font-medium" style={{ background: "#f5f3ff", color: PURPLE, border: `1px solid ${PURPLE}30` }}>
                  Demand Score: <strong>{DISTRICT_DEMAND[demandDistrict]}/100</strong>
                </div>
              </div>
            </div>

            <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {/* Top districts */}
              <div className="rounded-2xl p-6 bg-white shadow-sm">
                <h3 className="font-semibold mb-4 text-sm" style={{ color: "#111827" }}>Top 15 Districts by Demand</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={districtDemandData} layout="vertical" margin={{ left: 110, right: 20 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => v + "%"}/>
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110}/>
                    <Tooltip formatter={(v) => [v + "/100", "Demand Score"]}/>
                    <Bar dataKey="score" radius={[0, 5, 5, 0]}>
                      {districtDemandData.map((d, i) => <Cell key={i} fill={d.name === demandDistrict ? "#f4a42b" : PURPLE} opacity={d.name === demandDistrict ? 1 : 0.65}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Sector demand chart */}
              <div className="rounded-2xl p-6 bg-white shadow-sm">
                <h3 className="font-semibold mb-4 text-sm" style={{ color: "#111827" }}>Sector Rising-Skill Rate</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={sectorDemandData} layout="vertical" margin={{ left: 70, right: 20 }}>
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => v + "%"}/>
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70}/>
                    <Tooltip formatter={(v, _, p) => [v + "%", p.payload.full]}/>
                    <Bar dataKey="demand" radius={[0, 5, 5, 0]}>
                      {sectorDemandData.map((d, i) => <Cell key={i} fill={d.full === demandSector ? "#f4a42b" : PURPLE} opacity={d.full === demandSector ? 1 : 0.65}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Skill list for selected sector */}
            <div className="rounded-2xl p-6 bg-white shadow-sm">
              <h3 className="font-semibold mb-4 text-sm" style={{ color: "#111827" }}>
                Top Skills — {demandSector} in {demandDistrict}
              </h3>
              <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
                {topDemandSkills.map((s) => (
                  <div key={s.name} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#f8fafc" }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-sm flex-shrink-0"
                      style={{ background: getDemandColor(s.demand) + "20", color: getDemandColor(s.demand) }}>{s.demand}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate" style={{ color: "#111827" }}>{s.name}</div>
                      <div className={`text-xs ${getTrendClass(s.trend)}`}>{getTrendIcon(s.trend)} {s.trend}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SKILL GAP ANALYSIS ────────────────────────────────────── */}
        {tab === "gap" && (
          <div>
            <div className="rounded-2xl p-6 mb-6 text-white" style={{ background: `linear-gradient(135deg, ${PURPLE} 0%, #7c3aed 100%)` }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: "rgba(244,164,43,0.3)" }}>✦</div>
                <div>
                  <h1 className="text-xl font-bold font-serif">Skill Gap Analysis</h1>
                  <p className="text-xs text-purple-200">Select sector + district to view gaps and training needs</p>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-8 flex-wrap">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Sector</label>
                <select value={gapSector} onChange={(e) => setGapSector(e.target.value as Sector)}
                  className="px-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none" style={{ borderColor: "#d1d5db", minWidth: "220px" }}>
                  {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Maharashtra District</label>
                <select value={gapDistrict} onChange={(e) => setGapDistrict(e.target.value as District)}
                  className="px-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none" style={{ borderColor: "#d1d5db", minWidth: "180px" }}>
                  {MAHARASHTRA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            {/* Gap summary cards */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Min Skill Gap", value: Math.min(...gapData.map((g) => g.gap)), skill: gapData.reduce((a, b) => b.gap < a.gap ? b : a).name, color: "#16a34a", bg: "#f0fdf4" },
                { label: "Max Skill Gap", value: Math.max(...gapData.map((g) => g.gap)), skill: gapData.reduce((a, b) => b.gap > a.gap ? b : a).name, color: "#dc2626", bg: "#fef2f2" },
                { label: "Avg Skill Gap", value: Math.round(gapData.reduce((a, b) => a + b.gap, 0) / gapData.length), skill: `Across ${gapData.length} skills`, color: "#d97706", bg: "#fffbeb" },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl p-5 shadow-sm" style={{ background: c.bg, border: `1px solid ${c.color}20` }}>
                  <div className="text-3xl font-bold mb-1" style={{ color: c.color }}>{c.value}</div>
                  <div className="font-semibold text-sm mb-0.5" style={{ color: "#374151" }}>{c.label}</div>
                  <div className="text-xs truncate" style={{ color: "#9ca3af" }}>{c.skill}</div>
                </div>
              ))}
            </div>

            {/* Gap chart */}
            <div className="rounded-2xl p-6 bg-white shadow-sm mb-6">
              <h3 className="font-semibold mb-1 text-sm" style={{ color: "#111827" }}>Skill Gap vs Supply — {gapSector} in {gapDistrict}</h3>
              <p className="text-xs mb-4" style={{ color: "#9ca3af" }}>Higher gap = greater training need</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={gapData.slice(0, 8)} layout="vertical" margin={{ left: 160, right: 60 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => v + "%"}/>
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={160}/>
                  <Tooltip/>
                  <Bar dataKey="demand" name="Demand" fill={PURPLE} radius={[0, 4, 4, 0]} opacity={0.8}/>
                  <Bar dataKey="supply" name="Supply (Est.)" fill="#f4a42b" radius={[0, 4, 4, 0]} opacity={0.8}/>
                  <Legend wrapperStyle={{ fontSize: "12px" }}/>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gap detail list */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm" style={{ color: "#111827" }}>Areas Needing Training Intervention</h3>
              {gapData.filter((g) => g.gap > 20).map((s, i) => (
                <div key={s.name} className="rounded-xl p-4 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: i < 2 ? "#dc2626" : "#d97706" }}>{i + 1}</div>
                      <span className="font-semibold text-sm" style={{ color: "#111827" }}>{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#fef2f2", color: "#dc2626" }}>Gap: {s.gap}%</span>
                      <span className={`text-xs font-medium ${getTrendClass(s.trend)}`}>{getTrendIcon(s.trend)} {s.trend}</span>
                    </div>
                  </div>
                  <div className="grid gap-1.5">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="w-16 shrink-0 text-right" style={{ color: "#6b7280" }}>Demand</span>
                      <div className="flex-1 h-2 rounded-full" style={{ background: "#e5e7eb" }}>
                        <div className="h-2 rounded-full" style={{ width: `${s.demand}%`, background: PURPLE }}/>
                      </div>
                      <span className="w-8 font-mono text-right" style={{ color: PURPLE }}>{s.demand}%</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="w-16 shrink-0 text-right" style={{ color: "#6b7280" }}>Supply</span>
                      <div className="flex-1 h-2 rounded-full" style={{ background: "#e5e7eb" }}>
                        <div className="h-2 rounded-full" style={{ width: `${s.supply}%`, background: "#f4a42b" }}/>
                      </div>
                      <span className="w-8 font-mono text-right" style={{ color: "#d97706" }}>{s.supply}%</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs px-3 py-1.5 rounded-xl" style={{ background: "#f5f3ff", color: PURPLE }}>
                    💡 Recommend institutes in {gapDistrict} to add <strong>{s.name}</strong> to curriculum.
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── VACANCY MANAGEMENT ────────────────────────────────────── */}
        {tab === "vacancies" && (
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#111827", fontFamily: "var(--font-serif)" }}>Vacancy Management</h1>
            <p className="text-sm mb-6" style={{ color: "#6b7280" }}>All employer vacancies — identify roles with low or no placement outcomes</p>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Vacancies", value: MOCK_VACANCIES.length, color: PURPLE, bg: "#f5f3ff" },
                { label: "Total Openings", value: MOCK_VACANCIES.reduce((a, v) => a + v.vacancies, 0), color: "#0f2942", bg: "#eff6ff" },
                { label: "Positions Filled", value: MOCK_VACANCIES.reduce((a, v) => a + v.filled, 0), color: "#16a34a", bg: "#f0fdf4" },
                { label: "Low Placement (<30%)", value: lowPlacementVacancies.length, color: "#dc2626", bg: "#fef2f2" },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl p-5 shadow-sm" style={{ background: c.bg, border: `1px solid ${c.color}20` }}>
                  <div className="text-2xl font-bold mb-0.5" style={{ color: c.color }}>{c.value}</div>
                  <div className="text-xs font-medium" style={{ color: "#6b7280" }}>{c.label}</div>
                </div>
              ))}
            </div>

            {/* Low placement */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2" style={{ color: "#dc2626" }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs" style={{ background: "#dc2626" }}>!</span>
                Low / No Placement Vacancies ({lowPlacementVacancies.length})
              </h3>
              <div className="space-y-3">
                {lowPlacementVacancies.map((v) => (
                  <div key={v.id} className="rounded-xl p-4 bg-white shadow-sm border-l-4" style={{ borderLeftColor: "#dc2626" }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-sm" style={{ color: "#111827" }}>{v.jobRole}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
                          {v.companyName} · {v.location} · {v.employmentType} · ₹{v.salaryMin}–{v.salaryMax}L
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {v.requiredSkills.map((s) => <span key={s} className="px-2 py-0.5 rounded-full text-xs" style={{ background: "#fef2f2", color: "#dc2626" }}>{s}</span>)}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="font-bold text-lg" style={{ color: "#dc2626" }}>{v.filled}/{v.vacancies}</div>
                        <div className="text-xs" style={{ color: "#9ca3af" }}>filled</div>
                        <div className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{v.applicants} applicants</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs px-3 py-1.5 rounded-xl" style={{ background: "#fff7ed", color: "#c2410c" }}>
                      ⚠ {v.filled === 0 ? "No positions filled yet" : `Only ${Math.round(v.filled / v.vacancies * 100)}% filled`} — Review required skills or liaise with training institutes.
                    </div>
                  </div>
                ))}
                {lowPlacementVacancies.length === 0 && (
                  <div className="rounded-xl p-6 bg-white shadow-sm text-center text-sm" style={{ color: "#9ca3af" }}>All vacancies have adequate placement outcomes.</div>
                )}
              </div>
            </div>

            {/* High placement */}
            <div>
              <h3 className="font-semibold mb-3 text-sm flex items-center gap-2" style={{ color: "#16a34a" }}>
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs" style={{ background: "#16a34a" }}>✓</span>
                Well-Performing Vacancies ({highPlacementVacancies.length})
              </h3>
              <div className="space-y-3">
                {highPlacementVacancies.map((v) => (
                  <div key={v.id} className="rounded-xl p-4 bg-white shadow-sm border-l-4" style={{ borderLeftColor: "#16a34a" }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm" style={{ color: "#111827" }}>{v.jobRole}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{v.companyName} · {v.location} · {v.employmentType}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg" style={{ color: "#16a34a" }}>{v.filled}/{v.vacancies}</div>
                        <div className="text-xs" style={{ color: "#9ca3af" }}>filled</div>
                      </div>
                    </div>
                    <div className="mt-2 w-full h-2 rounded-full" style={{ background: "#e5e7eb" }}>
                      <div className="h-2 rounded-full" style={{ width: `${Math.round(v.filled / v.vacancies * 100)}%`, background: "#16a34a" }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── INSTITUTE VERIFICATION ────────────────────────────────── */}
        {tab === "institutes" && (
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#111827", fontFamily: "var(--font-serif)" }}>Institute Verification</h1>
            <p className="text-sm mb-6" style={{ color: "#6b7280" }}>Review and verify registered training institutes</p>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Total Institutes", value: MOCK_INSTITUTES.length, color: PURPLE, bg: "#f5f3ff" },
                { label: "Verified", value: MOCK_INSTITUTES.filter((i) => i.verified).length, color: "#16a34a", bg: "#f0fdf4" },
                { label: "Pending Verification", value: MOCK_INSTITUTES.filter((i) => !i.verified).length, color: "#dc2626", bg: "#fef2f2" },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl p-5 shadow-sm" style={{ background: c.bg, border: `1px solid ${c.color}20` }}>
                  <div className="text-2xl font-bold mb-0.5" style={{ color: c.color }}>{c.value}</div>
                  <div className="text-xs font-medium" style={{ color: "#6b7280" }}>{c.label}</div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {MOCK_INSTITUTES.map((inst) => (
                <div key={inst.instituteId} className="rounded-2xl p-6 bg-white shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                        style={{ background: inst.verified ? "#16a34a" : "#d97706" }}>
                        {inst.instituteName[0]}
                      </div>
                      <div>
                        <div className="font-bold text-sm" style={{ color: "#111827" }}>{inst.instituteName}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
                          ID: <span className="font-mono">{inst.instituteId}</span> · 📍 {inst.district}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={inst.verified ? { background: "#f0fdf4", color: "#16a34a" } : { background: "#fff7ed", color: "#c2410c" }}>
                        {inst.verified ? "✓ Verified" : "⏳ Pending"}
                      </span>
                      <button onClick={() => toggleVerification(inst.instituteId)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                        style={inst.verified ? { background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" } : { background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}>
                        {inst.verified ? "Revoke" : "Approve ✓"}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                    <div>
                      <div className="text-xs font-medium mb-0.5" style={{ color: "#9ca3af" }}>Email</div>
                      <div className="text-sm" style={{ color: "#374151" }}>{inst.email}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium mb-0.5" style={{ color: "#9ca3af" }}>Phone</div>
                      <div className="text-sm" style={{ color: "#374151" }}>{inst.phone}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium mb-0.5" style={{ color: "#9ca3af" }}>Registered</div>
                      <div className="text-sm" style={{ color: "#374151" }}>{inst.registeredOn}</div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-xs font-medium mb-1" style={{ color: "#9ca3af" }}>Address</div>
                    <div className="text-sm" style={{ color: "#374151" }}>{inst.address}</div>
                  </div>

                  <div className="mb-4">
                    <div className="text-xs font-medium mb-2" style={{ color: "#9ca3af" }}>Courses Offered ({inst.courses.length})</div>
                    <div className="flex flex-wrap gap-1.5">
                      {inst.courses.map((c) => (
                        <span key={c} className="px-2.5 py-1 rounded-full text-xs" style={{ background: "#f1f5f9", color: "#475569" }}>{c}</span>
                      ))}
                    </div>
                  </div>

                  {/* Certificate */}
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#f8fafc", border: "1px solid #e5e7eb" }}>
                    <span className="text-xl">📄</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: "#374151" }}>{inst.certFileName}</div>
                      <div className="text-xs" style={{ color: "#9ca3af" }}>Uploaded registration / verification certificate</div>
                    </div>
                    <button className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:opacity-90"
                      style={{ background: PURPLE, color: "#fff" }}>
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
