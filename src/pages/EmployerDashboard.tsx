import { useState, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Legend,
} from "recharts";
import {
  type Employer, type Vacancy, type Sector, type District, type EmploymentType,
  SECTORS, MAHARASHTRA_DISTRICTS, SECTOR_SKILLS, DISTRICT_DEMAND,
  EDUCATION_LEVELS, MOCK_VACANCIES, MOCK_CANDIDATES, MOCK_TRAINING_PROGRAMS,
  getDemandColor, getTrendIcon, getTrendClass, getSkillGapForSector, getRecommendedTrainingForSector,
} from "../data";

interface Props {
  employer: Employer;
  onLogout: () => void;
}

type Tab = "overview" | "vacancies" | "post" | "skills" | "locations" | "ai-demand" | "candidates" | "gaps" | "training";

const NAV: { id: Tab; label: string; icon: string }[] = [
  { id: "overview",   label: "Overview",            icon: "⬡" },
  { id: "vacancies",  label: "My Vacancies",         icon: "📋" },
  { id: "post",       label: "Post Vacancy",          icon: "➕" },
  { id: "skills",     label: "Required Skills",       icon: "⚡" },
  { id: "locations",  label: "Best Hire Locations",   icon: "📍" },
  { id: "ai-demand",  label: "AI Skill Demand",       icon: "📊" },
  { id: "candidates", label: "Candidate Matching",    icon: "👥" },
  { id: "gaps",       label: "AI Skill Gap Insights",  icon: "✦" },
  { id: "training",   label: "Training Programs",     icon: "🎓" },
];

function uid() { return "VAC-" + Math.random().toString(36).slice(2, 8).toUpperCase(); }

const EMPLOYMENT_TYPES: EmploymentType[] = ["Full-time", "Part-time", "Internship"];

export default function EmployerDashboard({ employer, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Employer's vacancies (reactive slice)
  const [, forceUpdate] = useState(0);
  const myVacancies = MOCK_VACANCIES.filter((v) => v.employerEmail === employer.email);

  // Post vacancy form state
  const emptyVac = () => ({
    jobRole: "", vacancies: "", description: "",
    requiredSkills: [] as string[], preferredSkills: [] as string[],
    education: "", experience: "", salaryMin: "", salaryMax: "",
    location: "" as District | "", employmentType: "Full-time" as EmploymentType, deadline: "",
  });
  const [form, setForm] = useState(emptyVac());
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [postSuccess, setPostSuccess] = useState(false);
  const [reqInput, setReqInput] = useState("");
  const [prefInput, setPrefInput] = useState("");

  function updateForm(k: string, v: unknown) {
    setForm((p) => ({ ...p, [k]: v }));
    setFormErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  }

  function addSkill(list: "requiredSkills" | "preferredSkills", input: string, setInput: (s: string) => void) {
    const s = input.trim();
    if (s && !form[list].includes(s)) setForm((p) => ({ ...p, [list]: [...p[list], s] }));
    setInput("");
  }
  function removeSkill(list: "requiredSkills" | "preferredSkills", s: string) {
    setForm((p) => ({ ...p, [list]: p[list].filter((x) => x !== s) }));
  }
  function toggleFormSkill(skill: string, list: "requiredSkills" | "preferredSkills") {
    setForm((p) => ({
      ...p,
      [list]: p[list].includes(skill) ? p[list].filter((s) => s !== skill) : [...p[list], skill],
    }));
  }

  function validatePost() {
    const e: Record<string, string> = {};
    if (!form.jobRole.trim()) e.jobRole = "Job role is required";
    if (!form.vacancies || parseInt(form.vacancies) < 1) e.vacancies = "Enter number of vacancies";
    if (!form.description.trim()) e.description = "Description is required";
    if (form.requiredSkills.length === 0) e.requiredSkills = "Add at least one required skill";
    if (!form.education) e.education = "Select qualification";
    if (!form.experience.trim()) e.experience = "Specify experience";
    if (!form.salaryMin || !form.salaryMax) e.salary = "Enter salary range";
    if (!form.location) e.location = "Select district";
    if (!form.deadline) e.deadline = "Set deadline";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }

  function handlePost() {
    if (!validatePost()) return;
    const vacancy: Vacancy = {
      id: uid(),
      employerEmail: employer.email,
      companyName: employer.companyName,
      sector: employer.sector,
      jobRole: form.jobRole,
      vacancies: parseInt(form.vacancies),
      description: form.description,
      requiredSkills: form.requiredSkills,
      preferredSkills: form.preferredSkills,
      education: form.education,
      experience: form.experience,
      salaryMin: parseFloat(form.salaryMin) || 0,
      salaryMax: parseFloat(form.salaryMax) || 0,
      location: form.location as District,
      employmentType: form.employmentType,
      deadline: form.deadline,
      postedDate: new Date().toISOString().split("T")[0],
      applicants: 0,
      filled: 0,
    };
    MOCK_VACANCIES.push(vacancy);
    setForm(emptyVac());
    setPostSuccess(true);
    forceUpdate((n) => n + 1);
    setTimeout(() => setPostSuccess(false), 3000);
  }

  // Data
  const sectorSkills = SECTOR_SKILLS[employer.sector];
  const topSkills = [...sectorSkills].sort((a, b) => b.demand - a.demand).slice(0, 8);
  const gapData = getSkillGapForSector(employer.sector, employer.locations[0] ?? "Pune");
  const training = getRecommendedTrainingForSector(employer.sector);

  // Location match — districts sorted by demand score × sector match
  const locationMatch = [...MAHARASHTRA_DISTRICTS]
    .map((d) => ({ district: d, score: DISTRICT_DEMAND[d], candidates: Math.round(DISTRICT_DEMAND[d] * 0.4) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);

  // Candidate matching
  const matchedCandidates = MOCK_CANDIDATES.filter((c) => c.sector === employer.sector).sort((a, b) => b.matchScore - a.matchScore);

  // AI demand radar
  const radarData = topSkills.slice(0, 6).map((s) => ({ skill: s.name.split(" ")[0], demand: s.demand, supply: Math.round(s.demand * 0.55) }));

  // Sector demand chart
  const sectorChart = SECTORS.map((s) => ({
    name: s.split(" & ")[0].split(" ")[0],
    full: s,
    demand: Math.round(SECTOR_SKILLS[s].filter((sk) => sk.trend === "rising").length / SECTOR_SKILLS[s].length * 100),
  }));

  const pieData = [
    { name: "Filled", value: myVacancies.reduce((a, v) => a + v.filled, 0) },
    { name: "Open", value: myVacancies.reduce((a, v) => a + (v.vacancies - v.filled), 0) },
  ].filter((d) => d.value > 0);
  const pieColors = ["#16a34a", "#1d3461"];

  const inputCls = "w-full px-4 py-3 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100";
  const labelCls = "block text-sm font-medium mb-1.5";

  return (
    <div className="min-h-full flex" style={{ background: "#f5f7fb" }}>
      {/* Sidebar */}
      <aside className={`flex-shrink-0 flex flex-col transition-all duration-300 ${sidebarOpen ? "w-64" : "w-16"}`}
        style={{ background: "#0f2942", minHeight: "100vh", position: "sticky", top: 0, maxHeight: "100vh", overflowY: "auto" }}>
        <div className="p-4 flex items-center gap-3 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm" style={{ background: "#f4a42b" }}>🏢</div>
          {sidebarOpen && <span className="text-white font-bold text-sm">SkillBridge</span>}
        </div>

        {sidebarOpen && (
          <div className="px-4 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <div className="text-white text-sm font-semibold truncate">{employer.companyName}</div>
            <div className="text-xs mt-0.5 truncate" style={{ color: "#93c5fd" }}>{employer.hrName}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "rgba(244,164,43,0.2)", color: "#fbbf24" }}>
                {employer.sector.split(" ")[0]}
              </span>
              {!employer.verified && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "rgba(220,38,38,0.2)", color: "#fca5a5" }}>Pending Verification</span>
              )}
            </div>
          </div>
        )}

        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {NAV.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${tab === item.id ? "bg-amber-400/20 text-amber-300 border-r-2 border-amber-400" : "text-blue-200 hover:bg-white/10 hover:text-white"}`}>
              <span className="flex-shrink-0 w-5 text-center">{item.icon}</span>
              {sidebarOpen && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>

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

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-8 page-enter">

        {/* ── OVERVIEW ──────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: "#111827", fontFamily: "var(--font-serif)" }}>
              Welcome, {employer.hrName} 👋
            </h1>
            <p className="text-sm mb-8" style={{ color: "#6b7280" }}>
              {employer.companyName} · {employer.sector} · {employer.locations.join(", ")}
            </p>

            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { label: "Active Vacancies", value: myVacancies.length, icon: "📋", color: "#0f2942", bg: "#eff6ff" },
                { label: "Total Openings", value: myVacancies.reduce((a, v) => a + v.vacancies, 0), icon: "🎯", color: "#16a34a", bg: "#f0fdf4" },
                { label: "Positions Filled", value: myVacancies.reduce((a, v) => a + v.filled, 0), icon: "✅", color: "#d97706", bg: "#fffbeb" },
                { label: "Total Applicants", value: myVacancies.reduce((a, v) => a + v.applicants, 0), icon: "👥", color: "#7c3aed", bg: "#f5f3ff" },
              ].map((c) => (
                <div key={c.label} className="rounded-2xl p-5 shadow-sm" style={{ background: c.bg, border: `1px solid ${c.color}20` }}>
                  <div className="text-2xl mb-1">{c.icon}</div>
                  <div className="text-2xl font-bold mb-0.5" style={{ color: c.color }}>{c.value}</div>
                  <div className="text-xs font-medium" style={{ color: "#6b7280" }}>{c.label}</div>
                </div>
              ))}
            </div>

            <div className="grid gap-6 mb-6" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <div className="rounded-2xl p-6 bg-white shadow-sm">
                <h3 className="font-semibold mb-4 text-sm" style={{ color: "#111827" }}>Sector Demand Overview</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={sectorChart} margin={{ left: -20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 9 }}/>
                    <YAxis tick={{ fontSize: 10 }}/>
                    <Tooltip formatter={(v, _, p) => [v + "%", p.payload.full]}/>
                    <Bar dataKey="demand" radius={[4,4,0,0]} fill="#0f2942">
                      {sectorChart.map((d, i) => <Cell key={i} fill={d.full === employer.sector ? "#f4a42b" : "#0f2942"} opacity={d.full === employer.sector ? 1 : 0.55}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-2xl p-6 bg-white shadow-sm">
                <h3 className="font-semibold mb-4 text-sm" style={{ color: "#111827" }}>Vacancy Fill Status</h3>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                        {pieData.map((_, i) => <Cell key={i} fill={pieColors[i]}/>)}
                      </Pie>
                      <Tooltip/>
                      <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }}/>
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-48">
                    <div className="text-center">
                      <p className="text-sm" style={{ color: "#9ca3af" }}>No vacancies posted yet.</p>
                      <button onClick={() => setTab("post")} className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: "#0f2942" }}>Post Vacancy →</button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent vacancies */}
            <div className="rounded-2xl p-6 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm" style={{ color: "#111827" }}>Recent Vacancies</h3>
                <button onClick={() => setTab("post")} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white" style={{ background: "#0f2942" }}>+ Post New</button>
              </div>
              {myVacancies.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "#9ca3af" }}>No vacancies posted yet. Use "Post Vacancy" to get started.</p>
              ) : (
                <div className="space-y-3">
                  {myVacancies.slice(0, 4).map((v) => (
                    <div key={v.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "#f8fafc" }}>
                      <div>
                        <div className="font-medium text-sm" style={{ color: "#111827" }}>{v.jobRole}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{v.location} · {v.employmentType} · ₹{v.salaryMin}–{v.salaryMax}L</div>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span style={{ color: "#6b7280" }}>{v.applicants} applicants</span>
                        <span className="px-2 py-0.5 rounded-full font-medium" style={{ background: "#dcfce7", color: "#16a34a" }}>{v.filled}/{v.vacancies} filled</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MY VACANCIES ──────────────────────────────────────────── */}
        {tab === "vacancies" && (
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#111827", fontFamily: "var(--font-serif)" }}>My Vacancies</h1>
            <p className="text-sm mb-8" style={{ color: "#6b7280" }}>{myVacancies.length} vacancy listing{myVacancies.length !== 1 ? "s" : ""} posted by {employer.companyName}</p>
            {myVacancies.length === 0 ? (
              <div className="rounded-2xl p-12 bg-white shadow-sm text-center">
                <p className="text-2xl mb-2">📭</p>
                <p className="font-semibold mb-1" style={{ color: "#374151" }}>No vacancies yet</p>
                <p className="text-sm mb-4" style={{ color: "#9ca3af" }}>Post your first vacancy to start receiving matched candidates.</p>
                <button onClick={() => setTab("post")} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#0f2942" }}>+ Post Vacancy</button>
              </div>
            ) : (
              <div className="space-y-4">
                {myVacancies.map((v) => (
                  <div key={v.id} className="rounded-2xl p-6 bg-white shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-base" style={{ color: "#111827" }}>{v.jobRole}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#eff6ff", color: "#1d4ed8" }}>{v.employmentType}</span>
                          <span className="text-xs" style={{ color: "#6b7280" }}>📍 {v.location}</span>
                          <span className="text-xs" style={{ color: "#6b7280" }}>₹{v.salaryMin}–{v.salaryMax}L</span>
                          <span className="text-xs" style={{ color: "#6b7280" }}>🎓 {v.education}</span>
                          <span className="text-xs" style={{ color: "#6b7280" }}>⏱ {v.experience}</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold" style={{ color: "#0f2942" }}>{v.vacancies}</div>
                        <div className="text-xs" style={{ color: "#9ca3af" }}>openings</div>
                      </div>
                    </div>
                    <p className="text-sm mb-3" style={{ color: "#6b7280" }}>{v.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {v.requiredSkills.map((s) => <span key={s} className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "#eff6ff", color: "#1d4ed8" }}>{s}</span>)}
                      {v.preferredSkills.map((s) => <span key={s} className="px-2.5 py-1 rounded-full text-xs" style={{ background: "#f1f5f9", color: "#475569" }}>{s}</span>)}
                    </div>
                    <div className="flex items-center justify-between text-xs" style={{ color: "#9ca3af" }}>
                      <span>{v.applicants} applicants · {v.filled} filled · Deadline: {v.deadline}</span>
                      <span>Posted: {v.postedDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── POST VACANCY ──────────────────────────────────────────── */}
        {tab === "post" && (
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#111827", fontFamily: "var(--font-serif)" }}>Post a Vacancy</h1>
            <p className="text-sm mb-6" style={{ color: "#6b7280" }}>For {employer.companyName} · {employer.sector}</p>

            {postSuccess && (
              <div className="mb-6 p-4 rounded-2xl flex items-center gap-3" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <span className="text-xl">🎉</span>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#166534" }}>Vacancy posted successfully!</p>
                  <p className="text-xs" style={{ color: "#16a34a" }}>View it in My Vacancies or post another one below.</p>
                </div>
              </div>
            )}

            <div className="rounded-2xl p-6 bg-white shadow-sm space-y-5 max-w-2xl">
              <div><label className={labelCls} style={{ color: "#374151" }}>Job Role / Position *</label>
                <input className={inputCls} style={{ borderColor: formErrors.jobRole ? "#dc2626" : "#d1d5db" }} value={form.jobRole} onChange={(e) => updateForm("jobRole", e.target.value)} placeholder="e.g. Data Analyst"/>
                {formErrors.jobRole && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{formErrors.jobRole}</p>}
              </div>

              <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div><label className={labelCls} style={{ color: "#374151" }}>No. of Vacancies *</label>
                  <input type="number" min="1" className={inputCls} style={{ borderColor: formErrors.vacancies ? "#dc2626" : "#d1d5db" }} value={form.vacancies} onChange={(e) => updateForm("vacancies", e.target.value)} placeholder="e.g. 5"/>
                  {formErrors.vacancies && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{formErrors.vacancies}</p>}
                </div>
                <div><label className={labelCls} style={{ color: "#374151" }}>Employment Type *</label>
                  <select className={inputCls} style={{ borderColor: "#d1d5db" }} value={form.employmentType} onChange={(e) => updateForm("employmentType", e.target.value)}>
                    {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div><label className={labelCls} style={{ color: "#374151" }}>Job Description *</label>
                <textarea className={inputCls} style={{ borderColor: formErrors.description ? "#dc2626" : "#d1d5db", minHeight: "80px", resize: "none" }} value={form.description} onChange={(e) => updateForm("description", e.target.value)} placeholder="Role summary, responsibilities, work environment…"/>
                {formErrors.description && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{formErrors.description}</p>}
              </div>

              {/* Required skills */}
              <div>
                <label className={labelCls} style={{ color: "#374151" }}>Required Skills *</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {sectorSkills.slice(0, 8).map((s) => (
                    <button key={s.name} type="button" onClick={() => toggleFormSkill(s.name, "requiredSkills")}
                      className="px-2.5 py-1 rounded-full text-xs border transition-all"
                      style={form.requiredSkills.includes(s.name) ? { background: "#0f2942", color: "#fff", borderColor: "#0f2942" } : { background: "#fff", color: "#374151", borderColor: "#d1d5db" }}>
                      {s.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className={inputCls + " flex-1"} style={{ borderColor: formErrors.requiredSkills ? "#dc2626" : "#d1d5db" }} value={reqInput} onChange={(e) => setReqInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("requiredSkills", reqInput, setReqInput))} placeholder="Type skill and press Add"/>
                  <button type="button" onClick={() => addSkill("requiredSkills", reqInput, setReqInput)} className="px-3 py-2 rounded-xl text-xs font-medium text-white" style={{ background: "#0f2942" }}>Add</button>
                </div>
                {form.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.requiredSkills.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-full text-xs flex items-center gap-1" style={{ background: "#0f2942", color: "#fff" }}>
                        {s}<button onClick={() => removeSkill("requiredSkills", s)} className="hover:opacity-70">×</button>
                      </span>
                    ))}
                  </div>
                )}
                {formErrors.requiredSkills && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{formErrors.requiredSkills}</p>}
              </div>

              {/* Preferred skills */}
              <div>
                <label className={labelCls} style={{ color: "#374151" }}>Preferred Skills</label>
                <div className="flex gap-2">
                  <input className={inputCls + " flex-1"} style={{ borderColor: "#d1d5db" }} value={prefInput} onChange={(e) => setPrefInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("preferredSkills", prefInput, setPrefInput))} placeholder="Nice-to-have skills"/>
                  <button type="button" onClick={() => addSkill("preferredSkills", prefInput, setPrefInput)} className="px-3 py-2 rounded-xl text-xs font-medium text-white" style={{ background: "#374151" }}>Add</button>
                </div>
                {form.preferredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.preferredSkills.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-full text-xs flex items-center gap-1" style={{ background: "#6b7280", color: "#fff" }}>
                        {s}<button onClick={() => removeSkill("preferredSkills", s)} className="hover:opacity-70">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div><label className={labelCls} style={{ color: "#374151" }}>Qualification *</label>
                  <select className={inputCls} style={{ borderColor: formErrors.education ? "#dc2626" : "#d1d5db", color: form.education ? "#111827" : "#9ca3af" }} value={form.education} onChange={(e) => updateForm("education", e.target.value)}>
                    <option value="">Select</option>
                    {EDUCATION_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  {formErrors.education && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{formErrors.education}</p>}
                </div>
                <div><label className={labelCls} style={{ color: "#374151" }}>Experience *</label>
                  <input className={inputCls} style={{ borderColor: formErrors.experience ? "#dc2626" : "#d1d5db" }} value={form.experience} onChange={(e) => updateForm("experience", e.target.value)} placeholder="e.g. 0–2 years / Fresher"/>
                  {formErrors.experience && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{formErrors.experience}</p>}
                </div>
              </div>

              <div><label className={labelCls} style={{ color: "#374151" }}>Salary Range (₹ LPA) *</label>
                <div className="flex gap-3 items-center">
                  <input type="number" step="0.1" className={inputCls + " flex-1"} style={{ borderColor: formErrors.salary ? "#dc2626" : "#d1d5db" }} value={form.salaryMin} onChange={(e) => updateForm("salaryMin", e.target.value)} placeholder="Min"/>
                  <span style={{ color: "#9ca3af" }}>–</span>
                  <input type="number" step="0.1" className={inputCls + " flex-1"} style={{ borderColor: formErrors.salary ? "#dc2626" : "#d1d5db" }} value={form.salaryMax} onChange={(e) => updateForm("salaryMax", e.target.value)} placeholder="Max"/>
                </div>
                {formErrors.salary && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{formErrors.salary}</p>}
              </div>

              <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div><label className={labelCls} style={{ color: "#374151" }}>Job Location *</label>
                  <select className={inputCls} style={{ borderColor: formErrors.location ? "#dc2626" : "#d1d5db", color: form.location ? "#111827" : "#9ca3af" }} value={form.location} onChange={(e) => updateForm("location", e.target.value)}>
                    <option value="">Select district</option>
                    {MAHARASHTRA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {formErrors.location && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{formErrors.location}</p>}
                </div>
                <div><label className={labelCls} style={{ color: "#374151" }}>Application Deadline *</label>
                  <input type="date" className={inputCls} style={{ borderColor: formErrors.deadline ? "#dc2626" : "#d1d5db" }} value={form.deadline} onChange={(e) => updateForm("deadline", e.target.value)} min={new Date().toISOString().split("T")[0]}/>
                  {formErrors.deadline && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{formErrors.deadline}</p>}
                </div>
              </div>

              <button onClick={handlePost} className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: "#0f2942" }}>
                Post Vacancy
              </button>
            </div>
          </div>
        )}

        {/* ── REQUIRED SKILLS ───────────────────────────────────────── */}
        {tab === "skills" && (
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#111827", fontFamily: "var(--font-serif)" }}>Required Skills</h1>
            <p className="text-sm mb-8" style={{ color: "#6b7280" }}>Top skills in demand for <strong>{employer.sector}</strong></p>
            <div className="rounded-2xl p-6 bg-white shadow-sm mb-6">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={topSkills} layout="vertical" margin={{ left: 160, right: 30 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => v + "%"}/>
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={160}/>
                  <Tooltip formatter={(v) => [v + "% demand"]}/>
                  <Bar dataKey="demand" radius={[0, 6, 6, 0]}>
                    {topSkills.map((s, i) => <Cell key={i} fill={getDemandColor(s.demand)}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {topSkills.map((s) => (
                <div key={s.name} className="rounded-xl p-4 bg-white shadow-sm flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold font-mono flex-shrink-0 text-sm"
                    style={{ background: getDemandColor(s.demand) + "20", color: getDemandColor(s.demand) }}>{s.demand}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: "#111827" }}>{s.name}</div>
                    <div className={`text-xs ${getTrendClass(s.trend)}`}>{getTrendIcon(s.trend)} {s.trend}</div>
                    <div className="w-full h-1.5 rounded-full mt-1" style={{ background: "#e5e7eb" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${s.demand}%`, background: getDemandColor(s.demand) }}/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BEST HIRE LOCATIONS ───────────────────────────────────── */}
        {tab === "locations" && (
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#111827", fontFamily: "var(--font-serif)" }}>Best Hire Locations</h1>
            <p className="text-sm mb-8" style={{ color: "#6b7280" }}>Maharashtra districts with highest skill availability for <strong>{employer.sector}</strong></p>
            <div className="rounded-2xl p-6 bg-white shadow-sm mb-6">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={locationMatch} margin={{ left: -10 }}>
                  <XAxis dataKey="district" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={50}/>
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }}/>
                  <Tooltip formatter={(v, n) => [n === "score" ? v + "/100" : v, n === "score" ? "Demand Score" : "Est. Candidates"]}/>
                  <Bar dataKey="score" name="score" radius={[4, 4, 0, 0]}>
                    {locationMatch.map((d, i) => <Cell key={i} fill={employer.locations.includes(d.district as District) ? "#f4a42b" : "#0f2942"} opacity={employer.locations.includes(d.district as District) ? 1 : 0.65}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {locationMatch.map((d, i) => (
                <div key={d.district} className="rounded-xl p-4 bg-white shadow-sm"
                  style={employer.locations.includes(d.district as District) ? { border: "2px solid #f4a42b" } : { border: "1px solid #e5e7eb" }}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-semibold text-sm" style={{ color: employer.locations.includes(d.district as District) ? "#b45309" : "#111827" }}>
                        {employer.locations.includes(d.district as District) ? "📍 " : ""}{d.district}
                      </span>
                      {i < 3 && <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#fef3c7", color: "#d97706" }}>Top Pick</span>}
                    </div>
                    <span className="font-mono font-bold text-sm" style={{ color: getDemandColor(d.score) }}>{d.score}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: "#e5e7eb" }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${d.score}%`, background: getDemandColor(d.score) }}/>
                  </div>
                  <div className="text-xs mt-1.5" style={{ color: "#9ca3af" }}>~{d.candidates} candidates available</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── AI SKILL DEMAND ───────────────────────────────────────── */}
        {tab === "ai-demand" && (
          <div>
            <div className="rounded-2xl p-6 mb-6 text-white ai-gradient">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(244,164,43,0.3)" }}><span className="text-xl">📊</span></div>
                <div>
                  <h1 className="text-xl font-bold font-serif">AI Skill Demand Analysis</h1>
                  <p className="text-xs text-blue-200">{employer.sector} · {employer.locations.join(", ")}</p>
                </div>
              </div>
              <p className="text-sm text-blue-100">Real-time demand vs. supply gaps for {employer.sector} across your operating districts.</p>
            </div>
            <div className="rounded-2xl p-6 bg-white shadow-sm mb-6">
              <h3 className="font-semibold mb-4 text-sm" style={{ color: "#111827" }}>Demand vs Supply — Top Skills</h3>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f4"/>
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }}/>
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }}/>
                  <Radar name="Demand" dataKey="demand" fill="#0f2942" fillOpacity={0.3} stroke="#0f2942" strokeWidth={2}/>
                  <Radar name="Supply" dataKey="supply" fill="#f4a42b" fillOpacity={0.25} stroke="#f4a42b" strokeWidth={2}/>
                  <Legend wrapperStyle={{ fontSize: "12px" }}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {topSkills.map((s) => {
                const supply = Math.round(s.demand * 0.55);
                const gap = s.demand - supply;
                return (
                  <div key={s.name} className="rounded-xl p-4 bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm" style={{ color: "#111827" }}>{s.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: gap > 30 ? "#fef2f2" : "#f0fdf4", color: gap > 30 ? "#dc2626" : "#16a34a" }}>
                          {gap > 30 ? "⚠ High Gap" : "✓ Manageable"}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="w-14 text-right" style={{ color: "#6b7280" }}>Demand</span>
                        <div className="flex-1 h-2 rounded-full" style={{ background: "#e5e7eb" }}>
                          <div className="h-2 rounded-full" style={{ width: `${s.demand}%`, background: "#0f2942" }}/>
                        </div>
                        <span className="font-mono w-8" style={{ color: "#0f2942" }}>{s.demand}%</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="w-14 text-right" style={{ color: "#6b7280" }}>Supply</span>
                        <div className="flex-1 h-2 rounded-full" style={{ background: "#e5e7eb" }}>
                          <div className="h-2 rounded-full" style={{ width: `${supply}%`, background: "#f4a42b" }}/>
                        </div>
                        <span className="font-mono w-8" style={{ color: "#d97706" }}>{supply}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CANDIDATE MATCHING ────────────────────────────────────── */}
        {tab === "candidates" && (
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#111827", fontFamily: "var(--font-serif)" }}>Candidate Skill Matching</h1>
            <p className="text-sm mb-8" style={{ color: "#6b7280" }}>Registered candidates matching your sector and skill requirements</p>
            <div className="space-y-4">
              {matchedCandidates.map((c) => (
                <div key={c.name} className="rounded-2xl p-5 bg-white shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                        style={{ background: "#0f2942" }}>{c.name[0]}</div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: "#111827" }}>{c.name}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#6b7280" }}>📍 {c.location} · {c.education} · {c.experience}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold" style={{ color: c.matchScore >= 90 ? "#16a34a" : c.matchScore >= 80 ? "#d97706" : "#6b7280" }}>{c.matchScore}%</div>
                      <div className="text-xs" style={{ color: "#9ca3af" }}>match score</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {c.skills.map((s) => <span key={s} className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "#eff6ff", color: "#1d4ed8" }}>{s}</span>)}
                  </div>
                  <div className="w-full h-2 rounded-full" style={{ background: "#e5e7eb" }}>
                    <div className="h-2 rounded-full transition-all" style={{ width: `${c.matchScore}%`, background: c.matchScore >= 90 ? "#16a34a" : c.matchScore >= 80 ? "#d97706" : "#6b7280" }}/>
                  </div>
                </div>
              ))}
              {matchedCandidates.length === 0 && (
                <div className="rounded-2xl p-12 bg-white shadow-sm text-center">
                  <p className="text-sm" style={{ color: "#9ca3af" }}>No candidates found for your sector yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── AI SKILL GAP INSIGHTS ─────────────────────────────────── */}
        {tab === "gaps" && (
          <div>
            <div className="rounded-2xl p-6 mb-6 text-white ai-gradient">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(244,164,43,0.3)" }}><span className="text-xl">✦</span></div>
                <div>
                  <h1 className="text-xl font-bold font-serif">AI Skill Gap Insights</h1>
                  <p className="text-xs text-blue-200">Hiring friction points for {employer.companyName}</p>
                </div>
              </div>
              <p className="text-sm text-blue-100">Skills with the largest gap between market demand and available talent — directly impacting your hiring success.</p>
            </div>
            <div className="space-y-3">
              {gapData.slice(0, 10).map((s, i) => (
                <div key={s.name} className="rounded-2xl p-5 bg-white shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: i < 3 ? "#dc2626" : i < 6 ? "#d97706" : "#6b7280" }}>{i + 1}</div>
                      <div>
                        <span className="font-semibold text-sm" style={{ color: "#111827" }}>{s.name}</span>
                        <span className={`ml-2 text-xs font-medium ${getTrendClass(s.trend)}`}>{getTrendIcon(s.trend)} {s.trend}</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold font-mono px-3 py-1 rounded-xl" style={{ background: s.gap > 30 ? "#fef2f2" : "#fff7ed", color: s.gap > 30 ? "#dc2626" : "#d97706" }}>
                      {s.gap} gap
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="w-16 text-right shrink-0" style={{ color: "#6b7280" }}>Demand</span>
                      <div className="flex-1 h-2 rounded-full" style={{ background: "#dcfce7" }}>
                        <div className="h-2 rounded-full" style={{ width: `${s.demand}%`, background: "#16a34a" }}/>
                      </div>
                      <span className="font-mono w-8 shrink-0" style={{ color: "#16a34a" }}>{s.demand}%</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="w-16 text-right shrink-0" style={{ color: "#6b7280" }}>Supply</span>
                      <div className="flex-1 h-2 rounded-full" style={{ background: "#fee2e2" }}>
                        <div className="h-2 rounded-full" style={{ width: `${s.supply}%`, background: "#dc2626" }}/>
                      </div>
                      <span className="font-mono w-8 shrink-0" style={{ color: "#dc2626" }}>{s.supply}%</span>
                    </div>
                  </div>
                  {s.gap > 30 && (
                    <div className="mt-2 text-xs px-3 py-1.5 rounded-xl" style={{ background: "#fff7ed", color: "#9a3412" }}>
                      ⚠ High gap — Consider sponsoring training programs or relaxing experience requirements.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TRAINING PROGRAMS ─────────────────────────────────────── */}
        {tab === "training" && (
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#111827", fontFamily: "var(--font-serif)" }}>Recommended Training Programs</h1>
            <p className="text-sm mb-8" style={{ color: "#6b7280" }}>
              Programs your company can sponsor or recommend to bridge skill gaps in <strong>{employer.sector}</strong>
            </p>
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {training.map((p, i) => (
                <div key={p.name} className="rounded-2xl p-6 bg-white shadow-sm border-l-4" style={{ borderLeftColor: i % 2 === 0 ? "#0f2942" : "#f4a42b" }}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-sm leading-snug" style={{ color: "#111827" }}>{p.name}</h3>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium ml-2 flex-shrink-0" style={{ background: p.fee === "Free" ? "#f0fdf4" : "#eff6ff", color: p.fee === "Free" ? "#16a34a" : "#1d4ed8" }}>
                      {p.fee}
                    </span>
                  </div>
                  <div className="text-xs space-y-1 mb-3" style={{ color: "#6b7280" }}>
                    <div>🏫 {p.institute}</div>
                    <div>⏱ {p.duration}</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {p.skills.map((s) => <span key={s} className="px-2.5 py-1 rounded-full text-xs" style={{ background: "#f1f5f9", color: "#475569" }}>{s}</span>)}
                  </div>
                </div>
              ))}
              {training.length === 0 && (
                <div className="col-span-2 rounded-2xl p-12 bg-white shadow-sm text-center">
                  <p className="text-sm" style={{ color: "#9ca3af" }}>No training programs found for this sector.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
