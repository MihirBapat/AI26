import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, PieChart, Pie, Legend,
} from "recharts";
import {
  type Institute, SECTORS, MAHARASHTRA_DISTRICTS, SECTOR_SKILLS,
  DISTRICT_DEMAND, PLACEMENT_OUTCOMES, getDemandColor, getTrendIcon,
  getTrendClass, analyzeCurriculum, type Sector, type District,
} from "../data";

interface Props {
  institute: Institute;
  onLogout: () => void;
}

type ActiveTab = "dashboard" | "demand" | "emerging" | "placement" | "ai-curriculum";

const NAV_ITEMS: { id: ActiveTab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Overview", icon: "⬡" },
  { id: "demand", label: "Industry Demand", icon: "📊" },
  { id: "emerging", label: "Emerging Skills", icon: "🚀" },
  { id: "placement", label: "Placement Outcomes", icon: "🎓" },
  { id: "ai-curriculum", label: "AI Curriculum Advisor", icon: "✦" },
];

const SECTOR_COLORS = ["#1d3461","#2a4a8a","#f4a42b","#1a7a6e","#16a34a","#d97706","#dc2626","#7c3aed","#0891b2","#be185d"];

export default function InstituteDashboard({ institute, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSector, setSelectedSector] = useState<Sector>("IT & Communication");
  const [selectedDistrict, setSelectedDistrict] = useState<District>("Pune");

  const sectorSkills = SECTOR_SKILLS[selectedSector];
  const placement = PLACEMENT_OUTCOMES[selectedSector];
  const curriculum = analyzeCurriculum(institute, selectedSector);

  const topSkills = [...sectorSkills].sort((a, b) => b.demand - a.demand).slice(0, 8);
  const emergingSkills = sectorSkills.filter((s) => s.trend === "rising").sort((a, b) => b.demand - a.demand);

  const allSectorDemandData = SECTORS.map((s, i) => ({
    name: s.split(" ")[0],
    fullName: s,
    demand: Math.round(SECTOR_SKILLS[s].filter((sk) => sk.trend === "rising").length / SECTOR_SKILLS[s].length * 100),
    color: SECTOR_COLORS[i],
  }));

  const placementTrendData = [
    { month: "Jan", placed: Math.round(placement.placed * 0.85) },
    { month: "Feb", placed: Math.round(placement.placed * 0.88) },
    { month: "Mar", placed: Math.round(placement.placed * 0.90) },
    { month: "Apr", placed: Math.round(placement.placed * 0.87) },
    { month: "May", placed: Math.round(placement.placed * 0.92) },
    { month: "Jun", placed: placement.placed },
  ];

  const pieData = [
    { name: "Current & Relevant", value: curriculum.current.length },
    { name: "Outdated / Low Demand", value: curriculum.outdated.length },
    { name: "Not Covered", value: curriculum.recommended.length },
  ].filter((d) => d.value > 0);
  const pieColors = ["#16a34a", "#dc2626", "#1d3461"];

  return (
    <div className="min-h-full flex" style={{ background: "#f5f7fb" }}>
      {/* Sidebar */}
      <aside className={`flex-shrink-0 flex flex-col transition-all duration-300 ${sidebarOpen ? "w-60" : "w-16"}`}
        style={{ background: "#1a4a3a", minHeight: "100vh", position: "sticky", top: 0, maxHeight: "100vh", overflowY: "auto" }}>
        <div className="p-4 flex items-center gap-3 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm" style={{ background: "#f4a42b" }}>
            🏫
          </div>
          {sidebarOpen && <span className="text-white font-bold text-sm">SkillBridge</span>}
        </div>

        {sidebarOpen && (
          <div className="px-4 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <div className="text-white text-sm font-semibold truncate">{institute.instituteName}</div>
            <div className="text-xs truncate mt-0.5" style={{ color: "#6ee7b7" }}>{institute.instituteId}</div>
            <div className="mt-2 text-xs" style={{ color: "#6ee7b7" }}>{institute.courses.length} courses offered</div>
          </div>
        )}

        <nav className="flex-1 py-3 px-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${activeTab === item.id ? "bg-amber-400/20 text-amber-300 border-r-2 border-amber-400" : "text-green-200 hover:bg-white/10 hover:text-white"}`}
            >
              <span className="flex-shrink-0 w-5 text-center">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-3 space-y-2 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-green-300 hover:text-white hover:bg-white/10 transition-all">
            <span>{sidebarOpen ? "◀" : "▶"}</span>
            {sidebarOpen && "Collapse"}
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-300 hover:text-white hover:bg-red-500/20 transition-all">
            <span>⎋</span>
            {sidebarOpen && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8 page-enter">
        {/* Filter bar */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Sector</label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value as Sector)}
              className="px-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-200"
              style={{ borderColor: "#d1d5db", minWidth: "220px" }}
            >
              {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "#6b7280" }}>Maharashtra District</label>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value as District)}
              className="px-4 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-200"
              style={{ borderColor: "#d1d5db", minWidth: "180px" }}
            >
              {MAHARASHTRA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <div className="px-4 py-2.5 rounded-xl text-sm font-medium" style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}>
              District Demand: <strong>{DISTRICT_DEMAND[selectedDistrict]}/100</strong>
            </div>
          </div>
        </div>

        {/* Overview */}
        {activeTab === "dashboard" && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-1" style={{ color: "#111827", fontFamily: "var(--font-serif)" }}>
                Institute Dashboard
              </h1>
              <p className="text-sm" style={{ color: "#6b7280" }}>
                {institute.instituteName} · Viewing: <strong>{selectedSector}</strong> in <strong>{selectedDistrict}</strong>
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: "Courses Offered", value: institute.courses.length, icon: "📚", color: "#1a7a6e", bg: "#f0fdf4" },
                { label: "Placement Rate", value: `${placement.placed}%`, icon: "🎓", color: "#16a34a", bg: "#dcfce7" },
                { label: "Avg Package", value: `₹${placement.avgPackage}L`, icon: "💰", color: "#d97706", bg: "#fffbeb" },
                { label: "Industry Demand", value: `${DISTRICT_DEMAND[selectedDistrict]}/100`, icon: "📈", color: "#1d3461", bg: "#eff6ff" },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl p-5 shadow-sm" style={{ background: card.bg, border: `1px solid ${card.color}20` }}>
                  <div className="text-2xl mb-1">{card.icon}</div>
                  <div className="text-2xl font-bold mb-0.5" style={{ color: card.color }}>{card.value}</div>
                  <div className="text-xs font-medium" style={{ color: "#6b7280" }}>{card.label}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="rounded-2xl p-6 bg-white shadow-sm">
                <h3 className="font-semibold mb-4 text-sm" style={{ color: "#111827" }}>Demand by Sector</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={allSectorDemandData} margin={{ left: -20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 9 }}/>
                    <YAxis tick={{ fontSize: 10 }}/>
                    <Tooltip formatter={(v, _, props) => [v + "%", props.payload.fullName]}/>
                    <Bar dataKey="demand" radius={[4,4,0,0]}>
                      {allSectorDemandData.map((d, i) => <Cell key={i} fill={d.color}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-2xl p-6 bg-white shadow-sm">
                <h3 className="font-semibold mb-4 text-sm" style={{ color: "#111827" }}>Placement Trend — {selectedSector.split(" ")[0]}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={placementTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }}/>
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => v + "%"}/>
                    <Tooltip formatter={(v) => [v + "%", "Placed"]}/>
                    <Line type="monotone" dataKey="placed" stroke="#1a7a6e" strokeWidth={2.5} dot={{ fill: "#1a7a6e", r: 4 }}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-6 rounded-2xl p-6 bg-white shadow-sm">
              <h3 className="font-semibold mb-3 text-sm" style={{ color: "#111827" }}>Your Current Courses</h3>
              <div className="flex flex-wrap gap-2">
                {institute.courses.map((c) => (
                  <span key={c} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: "#f1f5f9", color: "#475569" }}>{c}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Industry Demand */}
        {activeTab === "demand" && (
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#111827", fontFamily: "var(--font-serif)" }}>Industry Demand</h1>
            <p className="text-sm mb-8" style={{ color: "#6b7280" }}>Skill demand for <strong>{selectedSector}</strong> in <strong>{selectedDistrict}</strong></p>
            <div className="rounded-2xl p-6 bg-white shadow-sm mb-6">
              <h3 className="font-semibold mb-4 text-sm" style={{ color: "#111827" }}>Top Skills by Demand Score</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topSkills} layout="vertical" margin={{ left: 140, right: 20 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => v + "%"}/>
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140}/>
                  <Tooltip formatter={(v) => [v + "% demand"]}/>
                  <Bar dataKey="demand" radius={[0,6,6,0]}>
                    {topSkills.map((s, i) => <Cell key={i} fill={getDemandColor(s.demand)}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {topSkills.map((skill) => (
                <div key={skill.name} className="rounded-xl p-4 bg-white shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0"
                    style={{ background: getDemandColor(skill.demand) + "20", color: getDemandColor(skill.demand) }}>
                    {skill.demand}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: "#111827" }}>{skill.name}</div>
                    <div className={`text-xs font-medium ${getTrendClass(skill.trend)}`}>
                      {getTrendIcon(skill.trend)} {skill.trend}
                    </div>
                    <div className="w-full h-1.5 rounded-full mt-1" style={{ background: "#e5e7eb" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${skill.demand}%`, background: getDemandColor(skill.demand) }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emerging Skills */}
        {activeTab === "emerging" && (
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#111827", fontFamily: "var(--font-serif)" }}>Emerging Skills</h1>
            <p className="text-sm mb-8" style={{ color: "#6b7280" }}>Fast-growing skills in <strong>{selectedSector}</strong> — consider adding these to your curriculum</p>
            <div className="space-y-3">
              {emergingSkills.map((skill, i) => {
                const isCovered = institute.courses.some((c) => c.toLowerCase().includes(skill.name.toLowerCase()) || skill.name.toLowerCase().includes(c.toLowerCase()));
                return (
                  <div key={skill.name} className="rounded-2xl p-5 bg-white shadow-sm flex items-center gap-4">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: i < 3 ? "#f4a42b" : "#f1f5f9", color: i < 3 ? "#1d3461" : "#6b7280" }}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm" style={{ color: "#111827" }}>{skill.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#f0fdf4", color: "#16a34a" }}>↑ Rising</span>
                        {isCovered && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#eff6ff", color: "#1d4ed8" }}>✓ You offer this</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full" style={{ background: "#dcfce7" }}>
                          <div className="h-1.5 rounded-full" style={{ width: `${skill.demand}%`, background: "#16a34a" }}></div>
                        </div>
                        <span className="text-sm font-mono font-bold" style={{ color: "#16a34a" }}>{skill.demand}%</span>
                      </div>
                    </div>
                    {!isCovered && (
                      <span className="text-xs px-3 py-1.5 rounded-xl font-medium flex-shrink-0" style={{ background: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
                        + Add to curriculum
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Placement Outcomes */}
        {activeTab === "placement" && (
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#111827", fontFamily: "var(--font-serif)" }}>Placement Outcomes</h1>
            <p className="text-sm mb-8" style={{ color: "#6b7280" }}>Performance benchmarks for <strong>{selectedSector}</strong></p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Placement Rate", value: `${placement.placed}%`, icon: "🎓", desc: "of graduates placed", color: "#16a34a", bg: "#f0fdf4" },
                { label: "Avg. Package", value: `₹${placement.avgPackage}L`, icon: "💰", desc: "per annum", color: "#d97706", bg: "#fffbeb" },
                { label: "Top Recruiters", value: placement.topRecruiters.length, icon: "🏢", desc: "companies hiring", color: "#1d3461", bg: "#eff6ff" },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl p-6 shadow-sm text-center" style={{ background: card.bg, border: `1px solid ${card.color}20` }}>
                  <div className="text-3xl mb-2">{card.icon}</div>
                  <div className="text-3xl font-bold mb-1" style={{ color: card.color }}>{card.value}</div>
                  <div className="text-sm font-medium" style={{ color: "#111827" }}>{card.label}</div>
                  <div className="text-xs" style={{ color: "#9ca3af" }}>{card.desc}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="rounded-2xl p-6 bg-white shadow-sm">
                <h3 className="font-semibold mb-4 text-sm" style={{ color: "#111827" }}>Placement Trend (6 months)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={placementTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }}/>
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => v + "%"}/>
                    <Tooltip formatter={(v) => [v + "%", "Placed"]}/>
                    <Line type="monotone" dataKey="placed" stroke="#1a7a6e" strokeWidth={2.5} dot={{ fill: "#1a7a6e", r: 4 }}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-2xl p-6 bg-white shadow-sm">
                <h3 className="font-semibold mb-4 text-sm" style={{ color: "#111827" }}>Top Recruiters</h3>
                <div className="space-y-3">
                  {placement.topRecruiters.map((recruiter, i) => (
                    <div key={recruiter} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                        style={{ background: SECTOR_COLORS[i % SECTOR_COLORS.length] }}>
                        {recruiter[0]}
                      </div>
                      <span className="text-sm font-medium" style={{ color: "#374151" }}>{recruiter}</span>
                      <div className="flex-1 h-1.5 rounded-full ml-2" style={{ background: "#e5e7eb" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${80 - i * 12}%`, background: SECTOR_COLORS[i % SECTOR_COLORS.length] }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Curriculum Recommendation */}
        {activeTab === "ai-curriculum" && (
          <div>
            {/* Header */}
            <div className="rounded-2xl p-6 mb-6 text-white" style={{ background: "linear-gradient(135deg, #1a4a3a 0%, #1a7a6e 50%, #1d3461 100%)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(244,164,43,0.3)" }}>
                  <span className="text-xl">✦</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold font-serif">AI Curriculum Advisor</h1>
                  <p className="text-xs" style={{ color: "#6ee7b7" }}>Powered by industry demand data · {selectedSector} · {selectedDistrict}</p>
                </div>
              </div>
              <p className="text-sm" style={{ color: "#a7f3d0" }}>
                Analyzing your {institute.courses.length} courses against industry demand for {selectedSector} in {selectedDistrict}, Maharashtra.
              </p>
            </div>

            <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {/* Current courses analysis */}
              <div className="rounded-2xl p-6 bg-white shadow-sm">
                <h3 className="font-semibold mb-4 text-sm" style={{ color: "#111827" }}>Your Curriculum Analysis</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {pieData.map((_, i) => <Cell key={i} fill={pieColors[i]}/>)}
                    </Pie>
                    <Tooltip/>
                    <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Quick stats */}
              <div className="rounded-2xl p-6 bg-white shadow-sm space-y-4">
                <h3 className="font-semibold text-sm" style={{ color: "#111827" }}>Quick Assessment</h3>
                {[
                  { label: "Current & Relevant Courses", value: curriculum.current.length, total: institute.courses.length, color: "#16a34a" },
                  { label: "Outdated / Low-demand Courses", value: curriculum.outdated.length, total: institute.courses.length, color: "#dc2626" },
                  { label: "Gaps — Skills to Add", value: curriculum.recommended.length, total: curriculum.recommended.length + institute.courses.length, color: "#1d3461" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "#374151" }}>{row.label}</span>
                      <span className="font-mono font-bold" style={{ color: row.color }}>{row.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "#e5e7eb" }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${row.total ? Math.round(row.value / row.total * 100) : 0}%`, background: row.color }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Current & Relevant */}
            {curriculum.current.length > 0 && (
              <div className="rounded-2xl p-6 mb-4 shadow-sm" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <h3 className="font-semibold mb-3 text-sm flex items-center gap-2" style={{ color: "#166534" }}>
                  <span>✅</span> Current & Relevant Courses (Keep offering)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {curriculum.current.map((c) => (
                    <span key={c} className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: "#fff", color: "#166534", border: "1px solid #bbf7d0" }}>{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Outdated */}
            {curriculum.outdated.length > 0 && (
              <div className="rounded-2xl p-6 mb-4 shadow-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                <h3 className="font-semibold mb-3 text-sm flex items-center gap-2" style={{ color: "#991b1b" }}>
                  <span>⚠</span> Outdated / Low-Demand Courses (Consider replacing)
                </h3>
                <div className="space-y-2">
                  {curriculum.outdated.map((c) => {
                    const match = SECTOR_SKILLS[selectedSector].find((s) => s.name.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(s.name.toLowerCase()));
                    return (
                      <div key={c} className="flex items-center justify-between p-3 rounded-xl bg-white">
                        <span className="text-sm" style={{ color: "#374151" }}>{c}</span>
                        {match && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#fef2f2", color: "#dc2626" }}>
                            ↓ Only {match.demand}% demand
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommended courses */}
            <div className="rounded-2xl p-6 shadow-sm" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
              <h3 className="font-semibold mb-1 text-sm flex items-center gap-2" style={{ color: "#1e40af" }}>
                <span>✦</span> AI-Recommended Courses to Add
              </h3>
              <p className="text-xs mb-4" style={{ color: "#3b82f6" }}>
                Based on industry demand for {selectedSector} in {selectedDistrict}, Maharashtra
              </p>
              <div className="space-y-3">
                {curriculum.recommended.map((skill, i) => (
                  <div key={skill.name} className="flex gap-4 p-4 rounded-xl bg-white">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white" style={{ background: "#1a7a6e" }}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm mb-0.5" style={{ color: "#111827" }}>
                        Add: <span style={{ color: "#1a7a6e" }}>{skill.name}</span>
                      </div>
                      <div className="text-xs" style={{ color: "#6b7280" }}>
                        {skill.demand}% demand · ↑ Rising trend · High employer need in {selectedDistrict}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold font-mono" style={{ color: "#16a34a" }}>{skill.demand}%</div>
                      <div className="text-xs" style={{ color: "#9ca3af" }}>demand</div>
                    </div>
                  </div>
                ))}
                {curriculum.recommended.length === 0 && (
                  <div className="p-4 rounded-xl bg-white text-center">
                    <p className="text-sm" style={{ color: "#16a34a" }}>🎉 Excellent! Your curriculum already covers the key in-demand skills for this sector.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
