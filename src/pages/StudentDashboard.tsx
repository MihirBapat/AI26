import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  type Student, SECTOR_SKILLS, DISTRICT_DEMAND, SECTORS,
  MAHARASHTRA_DISTRICTS, getDemandColor, getTrendClass, getTrendIcon,
  analyzeSkillGap,
} from "../data";

interface Props {
  student: Student;
  onLogout: () => void;
}

type ActiveTab = "dashboard" | "demand" | "skills" | "emerging" | "declining" | "location" | "ai-analyzer";

const NAV_ITEMS: { id: ActiveTab; label: string; icon: string }[] = [
  { id: "dashboard", label: "Overview", icon: "⬡" },
  { id: "demand", label: "Industry Demand", icon: "📊" },
  { id: "skills", label: "In-Demand Skills", icon: "🏆" },
  { id: "emerging", label: "Emerging Skills", icon: "🚀" },
  { id: "declining", label: "Declining Skills", icon: "📉" },
  { id: "location", label: "Demand by Location", icon: "📍" },
  { id: "ai-analyzer", label: "AI Skill Gap Analyzer", icon: "✦" },
];

const SECTOR_COLORS = ["#1d3461","#2a4a8a","#f4a42b","#1a7a6e","#16a34a","#d97706","#dc2626","#7c3aed","#0891b2","#be185d"];

export default function StudentDashboard({ student, onLogout }: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sectorSkills = SECTOR_SKILLS[student.sector];
  const gap = analyzeSkillGap(student);

  // Data for charts
  const sectorDemandData = SECTORS.map((s, i) => ({
    name: s.split(" ")[0],
    fullName: s,
    demand: Math.round(SECTOR_SKILLS[s].filter((sk) => sk.trend === "rising").length / SECTOR_SKILLS[s].length * 100),
    color: SECTOR_COLORS[i],
  }));

  const topSkillsData = sectorSkills.filter((s) => s.trend !== "declining").sort((a, b) => b.demand - a.demand).slice(0, 8);

  const locationData = [...MAHARASHTRA_DISTRICTS]
    .sort((a, b) => DISTRICT_DEMAND[b] - DISTRICT_DEMAND[a])
    .slice(0, 12)
    .map((d) => ({ name: d, score: DISTRICT_DEMAND[d] }));

  const emergingSkills = sectorSkills.filter((s) => s.trend === "rising").sort((a, b) => b.demand - a.demand);
  const decliningSkills = sectorSkills.filter((s) => s.trend === "declining");

  const radarData = gap.matched.slice(0, 6).map((s) => ({
    skill: s.name.split(" ")[0].replace("/", ""),
    value: s.demand,
  }));

  const pieData = [
    { name: "Strong Skills", value: gap.strong.length },
    { name: "Skills to Improve", value: gap.matched.length - gap.strong.length },
    { name: "Skill Gaps", value: gap.missing.length },
    { name: "Outdated Skills", value: gap.declining.length },
  ].filter((d) => d.value > 0);
  const pieColors = ["#16a34a", "#f4a42b", "#1d3461", "#dc2626"];

  return (
    <div className="min-h-full flex" style={{ background: "#f5f7fb" }}>
      {/* Sidebar */}
      <aside className={`flex-shrink-0 flex flex-col transition-all duration-300 ${sidebarOpen ? "w-60" : "w-16"}`}
        style={{ background: "#1d3461", minHeight: "100vh", position: "sticky", top: 0, maxHeight: "100vh", overflowY: "auto" }}>
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#f4a42b" }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="#1d3461"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#1d3461" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/></svg>
          </div>
          {sidebarOpen && <span className="text-white font-bold text-sm">SkillBridge</span>}
        </div>

        {/* Student info */}
        {sidebarOpen && (
          <div className="px-4 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "#f4a42b", color: "#1d3461" }}>
                {student.username[0].toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="text-white text-sm font-semibold truncate">{student.username}</div>
                <div className="text-xs truncate" style={{ color: "#93c5fd" }}>{student.location}</div>
              </div>
            </div>
            <div className="mt-2 px-2 py-1 rounded-lg text-xs" style={{ background: "rgba(244,164,43,0.2)", color: "#fbbf24" }}>
              {student.sector.split(" ")[0]}
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${activeTab === item.id ? "bg-amber-400/20 text-amber-300 border-r-2 border-amber-400" : "text-blue-200 hover:bg-white/10 hover:text-white"}`}
            >
              <span className="flex-shrink-0 w-5 text-center">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Collapse & Logout */}
        <div className="p-3 space-y-2 border-t" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-blue-300 hover:text-white hover:bg-white/10 transition-all">
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
        {/* Overview */}
        {activeTab === "dashboard" && (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-1" style={{ color: "#111827", fontFamily: "var(--font-serif)" }}>
                Welcome back, {student.username} 👋
              </h1>
              <p className="text-sm" style={{ color: "#6b7280" }}>
                Here's your skill landscape for <strong>{student.sector}</strong> in <strong>{student.location}</strong>
              </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-4 mb-8" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              {[
                { label: "Your Skills", value: student.skills.length, icon: "⚡", color: "#1d3461", bg: "#eff6ff" },
                { label: "Strong Matches", value: gap.strong.length, icon: "✓", color: "#16a34a", bg: "#f0fdf4" },
                { label: "Skills to Add", value: gap.missing.length, icon: "+", color: "#d97706", bg: "#fffbeb" },
                { label: "District Demand Score", value: `${DISTRICT_DEMAND[student.location]}/100`, icon: "📍", color: "#7c3aed", bg: "#f5f3ff" },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl p-5 shadow-sm" style={{ background: card.bg, border: `1px solid ${card.color}20` }}>
                  <div className="text-2xl mb-1">{card.icon}</div>
                  <div className="text-2xl font-bold mb-0.5" style={{ color: card.color }}>{card.value}</div>
                  <div className="text-xs font-medium" style={{ color: "#6b7280" }}>{card.label}</div>
                </div>
              ))}
            </div>

            {/* Charts row */}
            <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="rounded-2xl p-6 shadow-sm bg-white">
                <h3 className="font-semibold mb-1 text-sm" style={{ color: "#111827" }}>Industry Demand by Sector</h3>
                <p className="text-xs mb-4" style={{ color: "#9ca3af" }}>% of rising skills per sector</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sectorDemandData} margin={{ left: -20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v, _, props) => [v + "%", props.payload.fullName]} />
                    <Bar dataKey="demand" radius={[4,4,0,0]}>
                      {sectorDemandData.map((d, i) => <Cell key={i} fill={d.color}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-2xl p-6 shadow-sm bg-white">
                <h3 className="font-semibold mb-1 text-sm" style={{ color: "#111827" }}>Your Skill Profile</h3>
                <p className="text-xs mb-4" style={{ color: "#9ca3af" }}>Demand score of matched skills</p>
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#e2e8f4"/>
                      <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10 }}/>
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }}/>
                      <Radar dataKey="value" fill="#1d3461" fillOpacity={0.3} stroke="#1d3461" strokeWidth={2}/>
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-48 text-sm" style={{ color: "#9ca3af" }}>
                    Add skills to see your profile
                  </div>
                )}
              </div>
            </div>

            {/* Quick insights */}
            <div className="rounded-2xl p-6 shadow-sm bg-white">
              <h3 className="font-semibold mb-4 text-sm" style={{ color: "#111827" }}>Your Current Skills</h3>
              <div className="flex flex-wrap gap-2">
                {student.skills.map((skill) => {
                  const match = sectorSkills.find((s) => s.name.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(s.name.toLowerCase()));
                  const tagClass = match?.trend === "rising" ? "skill-tag-green" : match?.trend === "declining" ? "skill-tag-red" : "skill-tag-blue";
                  return (
                    <span key={skill} className={`px-3 py-1.5 rounded-full text-xs font-medium ${tagClass}`}>
                      {match ? getTrendIcon(match.trend) : "○"} {skill}
                    </span>
                  );
                })}
                {student.skills.length === 0 && <p className="text-sm" style={{ color: "#9ca3af" }}>No skills added yet.</p>}
              </div>
            </div>
          </div>
        )}

        {/* Industry Demand */}
        {activeTab === "demand" && (
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#111827", fontFamily: "var(--font-serif)" }}>Industry Demand Dashboard</h1>
            <p className="text-sm mb-8" style={{ color: "#6b7280" }}>Real-time skill demand trends across Maharashtra's key sectors</p>
            <div className="rounded-2xl p-6 shadow-sm bg-white mb-6">
              <h3 className="font-semibold mb-4" style={{ color: "#111827" }}>Demand Heat — All Sectors</h3>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={sectorDemandData} layout="vertical" margin={{ left: 100, right: 20 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => v + "%"}/>
                  <YAxis type="category" dataKey="fullName" tick={{ fontSize: 11 }} width={100}/>
                  <Tooltip formatter={(v) => [v + "% rising skills"]}/>
                  <Bar dataKey="demand" radius={[0,6,6,0]}>
                    {sectorDemandData.map((d, i) => <Cell key={i} fill={d.color}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {SECTORS.slice(0, 4).map((sector) => {
                const skills = SECTOR_SKILLS[sector];
                const rising = skills.filter((s) => s.trend === "rising").length;
                return (
                  <div key={sector} className="rounded-2xl p-5 shadow-sm bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-sm" style={{ color: "#111827" }}>{sector}</h4>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                        {rising}/{skills.length} rising
                      </span>
                    </div>
                    <div className="w-full rounded-full h-2 mb-3" style={{ background: "#e5e7eb" }}>
                      <div className="h-2 rounded-full transition-all" style={{ width: `${Math.round(rising / skills.length * 100)}%`, background: "#16a34a" }}></div>
                    </div>
                    <div className="space-y-1">
                      {skills.filter((s) => s.trend === "rising").slice(0, 3).map((s) => (
                        <div key={s.name} className="flex justify-between text-xs">
                          <span style={{ color: "#374151" }}>{s.name}</span>
                          <span className="font-mono font-medium" style={{ color: "#16a34a" }}>{s.demand}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top In-Demand Skills */}
        {activeTab === "skills" && (
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#111827", fontFamily: "var(--font-serif)" }}>
              Top In-Demand Skills
            </h1>
            <p className="text-sm mb-2" style={{ color: "#6b7280" }}>
              Based on your location: <strong>{student.location}</strong> · Sector: <strong>{student.sector}</strong>
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-8" style={{ background: "#eff6ff", color: "#1d4ed8" }}>
              District Demand Score: {DISTRICT_DEMAND[student.location]}/100
            </div>
            <div className="space-y-3">
              {topSkillsData.map((skill, i) => (
                <div key={skill.name} className="rounded-2xl p-5 shadow-sm bg-white flex items-center gap-4">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: i < 3 ? "#f4a42b" : "#f1f5f9", color: i < 3 ? "#1d3461" : "#6b7280" }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm" style={{ color: "#111827" }}>{skill.name}</span>
                      <span className={`text-xs font-medium ${getTrendClass(skill.trend)}`}>
                        {getTrendIcon(skill.trend)} {skill.trend}
                      </span>
                    </div>
                    <div className="w-full rounded-full h-1.5" style={{ background: "#e5e7eb" }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${skill.demand}%`, background: getDemandColor(skill.demand) }}></div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-lg font-bold font-mono" style={{ color: getDemandColor(skill.demand) }}>{skill.demand}</div>
                    <div className="text-xs" style={{ color: "#9ca3af" }}>demand</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Emerging Skills */}
        {activeTab === "emerging" && (
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#111827", fontFamily: "var(--font-serif)" }}>Emerging Skills by Sector</h1>
            <p className="text-sm mb-8" style={{ color: "#6b7280" }}>Skills gaining rapid momentum in <strong>{student.sector}</strong></p>
            <div className="grid gap-4 mb-8" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {emergingSkills.map((skill) => (
                <div key={skill.name} className="rounded-2xl p-5 bg-white shadow-sm border-l-4" style={{ borderLeftColor: "#16a34a" }}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-sm" style={{ color: "#111827" }}>{skill.name}</span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                      ↑ Emerging
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 rounded-full" style={{ background: "#dcfce7" }}>
                      <div className="h-2 rounded-full" style={{ width: `${skill.demand}%`, background: "#16a34a" }}></div>
                    </div>
                    <span className="text-sm font-mono font-bold" style={{ color: "#16a34a" }}>{skill.demand}%</span>
                  </div>
                  {student.skills.includes(skill.name) && (
                    <div className="mt-2 text-xs" style={{ color: "#16a34a" }}>✓ You have this skill</div>
                  )}
                </div>
              ))}
            </div>
            <div className="rounded-2xl p-6 shadow-sm" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
              <h3 className="font-semibold mb-2 text-sm" style={{ color: "#166534" }}>💡 Why these skills are rising</h3>
              <p className="text-sm" style={{ color: "#374151" }}>
                Maharashtra's {student.sector} sector is experiencing accelerated digital transformation. Employers in {student.location} and nearby districts are actively recruiting candidates with these skills, offering 20–40% higher packages than traditional roles.
              </p>
            </div>
          </div>
        )}

        {/* Declining Skills */}
        {activeTab === "declining" && (
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#111827", fontFamily: "var(--font-serif)" }}>Declining / Outdated Skills</h1>
            <p className="text-sm mb-8" style={{ color: "#6b7280" }}>Skills losing relevance in <strong>{student.sector}</strong> — upskill before it's too late</p>
            <div className="space-y-3 mb-8">
              {decliningSkills.map((skill) => (
                <div key={skill.name} className="rounded-2xl p-5 bg-white shadow-sm border-l-4" style={{ borderLeftColor: "#dc2626" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-sm" style={{ color: "#111827" }}>{skill.name}</span>
                      {student.skills.includes(skill.name) && (
                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "#fef2f2", color: "#dc2626" }}>
                          You have this — Upskill needed
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: "#fef2f2", color: "#dc2626" }}>
                      ↓ Declining
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: "#fecaca" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${skill.demand}%`, background: "#dc2626" }}></div>
                    </div>
                    <span className="text-sm font-mono font-bold" style={{ color: "#dc2626" }}>{skill.demand}%</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl p-6" style={{ background: "#fffbeb", border: "1px solid #fed7aa" }}>
              <h3 className="font-semibold mb-2 text-sm" style={{ color: "#92400e" }}>⚠ Upskilling Advice</h3>
              <p className="text-sm" style={{ color: "#374151" }}>
                If you possess any declining skills, consider supplementing them with emerging alternatives. Use the AI Skill Gap Analyzer for personalized recommendations.
              </p>
            </div>
          </div>
        )}

        {/* Demand by Location */}
        {activeTab === "location" && (
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#111827", fontFamily: "var(--font-serif)" }}>Demand by Location</h1>
            <p className="text-sm mb-8" style={{ color: "#6b7280" }}>Job demand scores across Maharashtra districts</p>
            <div className="rounded-2xl p-6 shadow-sm bg-white mb-6">
              <h3 className="font-semibold mb-4 text-sm" style={{ color: "#111827" }}>Top 12 Districts by Demand</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={locationData} margin={{ left: -10 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={50}/>
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }}/>
                  <Tooltip formatter={(v) => [v + "/100", "Demand Score"]}/>
                  <Bar dataKey="score" radius={[4,4,0,0]}>
                    {locationData.map((d, i) => (
                      <Cell key={i} fill={d.name === student.location ? "#f4a42b" : "#1d3461"} opacity={d.name === student.location ? 1 : 0.7}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {MAHARASHTRA_DISTRICTS.map((district) => {
                const score = DISTRICT_DEMAND[district];
                return (
                  <div key={district} className="rounded-xl p-3 bg-white shadow-sm flex items-center justify-between"
                    style={district === student.location ? { border: "2px solid #f4a42b" } : { border: "1px solid #e5e7eb" }}>
                    <span className="text-xs font-medium" style={{ color: district === student.location ? "#b45309" : "#374151" }}>
                      {district === student.location ? "📍 " : ""}{district}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1.5 rounded-full" style={{ background: "#e5e7eb" }}>
                        <div className="h-1.5 rounded-full" style={{ width: `${score}%`, background: getDemandColor(score) }}></div>
                      </div>
                      <span className="text-xs font-mono font-bold" style={{ color: getDemandColor(score) }}>{score}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI Skill Gap Analyzer */}
        {activeTab === "ai-analyzer" && (
          <div>
            {/* Header */}
            <div className="rounded-2xl p-6 mb-6 text-white ai-gradient">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(244,164,43,0.3)" }}>
                  <span className="text-xl">✦</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold font-serif">AI Skill Gap Analyzer</h1>
                  <p className="text-xs text-blue-200">Powered by industry demand data · {student.sector} · {student.location}</p>
                </div>
              </div>
              <p className="text-sm text-blue-100">
                Analyzing your {student.skills.length} skills against {sectorSkills.length} industry benchmarks for {student.sector} in {student.location}, Maharashtra.
              </p>
            </div>

            <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {/* Current Skills */}
              <div className="rounded-2xl p-6 bg-white shadow-sm">
                <h3 className="font-semibold mb-4 text-sm flex items-center gap-2" style={{ color: "#111827" }}>
                  <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-xs">⚡</span>
                  Your Current Skills
                </h3>
                <div className="space-y-2">
                  {student.skills.map((skill) => {
                    const match = sectorSkills.find((s) => s.name.toLowerCase() === skill.toLowerCase() || s.name.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(s.name.toLowerCase()));
                    return (
                      <div key={skill} className="flex items-center justify-between p-2 rounded-xl" style={{ background: "#f8fafc" }}>
                        <span className="text-sm" style={{ color: "#374151" }}>{skill}</span>
                        {match && (
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${match.trend === "rising" ? "skill-tag-green" : match.trend === "declining" ? "skill-tag-red" : "skill-tag-amber"}`}>
                            {getTrendIcon(match.trend)} {match.trend}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {student.skills.length === 0 && (
                    <p className="text-sm" style={{ color: "#9ca3af" }}>No skills in your profile</p>
                  )}
                </div>
              </div>

              {/* Gap Summary */}
              <div className="rounded-2xl p-6 bg-white shadow-sm">
                <h3 className="font-semibold mb-4 text-sm" style={{ color: "#111827" }}>Gap Analysis Summary</h3>
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
            </div>

            {/* Strong Skills */}
            {gap.strong.length > 0 && (
              <div className="rounded-2xl p-6 mt-6 shadow-sm" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <h3 className="font-semibold mb-3 text-sm flex items-center gap-2" style={{ color: "#166534" }}>
                  <span>✅</span> Strong Skills (Keep building)
                </h3>
                <div className="flex flex-wrap gap-2">
                  {gap.strong.map((s) => (
                    <div key={s.name} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#fff" }}>
                      <span className="text-sm font-medium" style={{ color: "#166534" }}>{s.name}</span>
                      <span className="text-xs font-mono font-bold" style={{ color: "#16a34a" }}>{s.demand}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills to Improve */}
            {gap.declining.length > 0 && (
              <div className="rounded-2xl p-6 mt-6 shadow-sm" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
                <h3 className="font-semibold mb-3 text-sm flex items-center gap-2" style={{ color: "#9a3412" }}>
                  <span>⚠</span> Skills to Upgrade (Outdated in your sector)
                </h3>
                <div className="space-y-2">
                  {gap.declining.map((s) => (
                    <div key={s.name} className="flex items-center justify-between p-3 rounded-xl bg-white">
                      <span className="text-sm" style={{ color: "#374151" }}>{s.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#fef2f2", color: "#dc2626" }}>
                        ↓ Only {s.demand}% demand
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="rounded-2xl p-6 mt-6 shadow-sm" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
              <h3 className="font-semibold mb-1 text-sm flex items-center gap-2" style={{ color: "#1e40af" }}>
                <span>✦</span> AI Recommendations
              </h3>
              <p className="text-xs mb-4" style={{ color: "#3b82f6" }}>
                Based on your location ({student.location}), sector ({student.sector}), and skill profile
              </p>
              <div className="space-y-3">
                {gap.missing.map((skill, i) => (
                  <div key={skill.name} className="flex gap-4 p-4 rounded-xl bg-white">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white" style={{ background: "#1d3461" }}>
                      {i + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-sm mb-0.5" style={{ color: "#111827" }}>
                        Learn: <span style={{ color: "#1d3461" }}>{skill.name}</span>
                      </div>
                      <div className="text-xs" style={{ color: "#6b7280" }}>
                        {skill.demand}% demand · {skill.trend} trend · High priority for {student.sector} roles in {student.location}
                      </div>
                    </div>
                    <div className="ml-auto text-right flex-shrink-0">
                      <div className="text-sm font-bold font-mono" style={{ color: "#16a34a" }}>{skill.demand}%</div>
                      <div className="text-xs" style={{ color: "#9ca3af" }}>demand</div>
                    </div>
                  </div>
                ))}
                {gap.missing.length === 0 && (
                  <div className="p-4 rounded-xl bg-white text-center">
                    <p className="text-sm" style={{ color: "#16a34a" }}>🎉 Great job! You have most key skills for your sector.</p>
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
