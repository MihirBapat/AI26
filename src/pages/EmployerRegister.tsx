import { useState, useRef } from "react";
import {
  SECTORS, MAHARASHTRA_DISTRICTS, EDUCATION_LEVELS, SECTOR_SKILLS,
  MOCK_EMPLOYERS, MOCK_VACANCIES,
  type Employer, type Vacancy, type Sector, type District, type EmploymentType,
} from "../data";

interface Props {
  onSuccess: (employer: Employer) => void;
  onLogin: () => void;
  onBack: () => void;
}

const EMPLOYMENT_TYPES: EmploymentType[] = ["Full-time", "Part-time", "Internship"];

function uid() {
  return "VAC-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export default function EmployerRegister({ onSuccess, onLogin, onBack }: Props) {
  // Registration form – 2 steps, then vacancy form
  const [phase, setPhase] = useState<"reg-1" | "reg-2" | "vacancy">("reg-1");
  const [registeredEmployer, setRegisteredEmployer] = useState<Employer | null>(null);

  // ── Registration fields ──────────────────────────────────────────────────
  const [reg, setReg] = useState({
    companyName: "", email: "", hrName: "", phone: "", password: "",
    sector: "" as Sector | "",
    locations: [] as District[],
    certFileName: "",
  });
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Vacancy fields ───────────────────────────────────────────────────────
  const [vac, setVac] = useState({
    jobRole: "", vacancies: "", description: "",
    requiredSkills: [] as string[], preferredSkills: [] as string[],
    education: "", experience: "", salaryMin: "", salaryMax: "",
    location: "" as District | "",
    employmentType: "Full-time" as EmploymentType,
    deadline: "",
  });
  const [vacErrors, setVacErrors] = useState<Record<string, string>>({});
  const [reqSkillInput, setReqSkillInput] = useState("");
  const [prefSkillInput, setPrefSkillInput] = useState("");

  // ── Helpers ───────────────────────────────────────────────────────────────
  const inputClass = "w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white transition-shadow";
  const labelClass = "block text-sm font-medium mb-1.5";

  function updateReg(k: string, v: unknown) {
    setReg((p) => ({ ...p, [k]: v }));
    setRegErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  }

  function updateVac(k: string, v: unknown) {
    setVac((p) => ({ ...p, [k]: v }));
    setVacErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  }

  function toggleLocation(d: District) {
    setReg((p) => ({
      ...p,
      locations: p.locations.includes(d) ? p.locations.filter((l) => l !== d) : [...p.locations, d],
    }));
  }

  function addSkill(list: "requiredSkills" | "preferredSkills", input: string, setInput: (v: string) => void) {
    const s = input.trim();
    if (s && !vac[list].includes(s)) setVac((p) => ({ ...p, [list]: [...p[list], s] }));
    setInput("");
  }
  function removeSkill(list: "requiredSkills" | "preferredSkills", s: string) {
    setVac((p) => ({ ...p, [list]: p[list].filter((x) => x !== s) }));
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validateReg1() {
    const e: Record<string, string> = {};
    if (!reg.companyName.trim()) e.companyName = "Company name is required";
    if (!reg.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Enter a valid email";
    else if (MOCK_EMPLOYERS.find((em) => em.email === reg.email.toLowerCase())) e.email = "Email already registered";
    if (!reg.hrName.trim()) e.hrName = "HR/Recruiter name is required";
    if (!reg.phone.match(/^\d{10}$/)) e.phone = "Enter a valid 10-digit number";
    if (!reg.password || reg.password.length < 6) e.password = "Password must be at least 6 characters";
    setRegErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateReg2() {
    const e: Record<string, string> = {};
    if (!reg.sector) e.sector = "Select a primary sector";
    if (reg.locations.length === 0) e.locations = "Select at least one district";
    if (!reg.certFileName) e.cert = "Upload company verification document";
    setRegErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateVacancy() {
    const e: Record<string, string> = {};
    if (!vac.jobRole.trim()) e.jobRole = "Job role is required";
    if (!vac.vacancies || parseInt(vac.vacancies) < 1) e.vacancies = "Enter number of vacancies";
    if (!vac.description.trim()) e.description = "Job description is required";
    if (vac.requiredSkills.length === 0) e.requiredSkills = "Add at least one required skill";
    if (!vac.education) e.education = "Select qualification";
    if (!vac.experience.trim()) e.experience = "Specify experience required";
    if (!vac.salaryMin || !vac.salaryMax) e.salary = "Enter salary range";
    if (!vac.location) e.location = "Select job location";
    if (!vac.deadline) e.deadline = "Set application deadline";
    setVacErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit handlers ───────────────────────────────────────────────────────
  function handleReg1() { if (validateReg1()) setPhase("reg-2"); }

  function handleReg2() {
    if (!validateReg2()) return;
    const employer: Employer = {
      companyName: reg.companyName,
      email: reg.email.toLowerCase(),
      hrName: reg.hrName,
      sector: reg.sector as Sector,
      locations: reg.locations,
      phone: reg.phone,
      password: reg.password,
      certFileName: reg.certFileName,
      verified: false,
      registeredOn: new Date().toISOString().split("T")[0],
    };
    MOCK_EMPLOYERS.push(employer);
    setRegisteredEmployer(employer);
    setPhase("vacancy");
  }

  function handleVacancySubmit() {
    if (!validateVacancy() || !registeredEmployer) return;
    const vacancy: Vacancy = {
      id: uid(),
      employerEmail: registeredEmployer.email,
      companyName: registeredEmployer.companyName,
      sector: registeredEmployer.sector,
      jobRole: vac.jobRole,
      vacancies: parseInt(vac.vacancies),
      description: vac.description,
      requiredSkills: vac.requiredSkills,
      preferredSkills: vac.preferredSkills,
      education: vac.education,
      experience: vac.experience,
      salaryMin: parseFloat(vac.salaryMin) || 0,
      salaryMax: parseFloat(vac.salaryMax) || 0,
      location: vac.location as District,
      employmentType: vac.employmentType,
      deadline: vac.deadline,
      postedDate: new Date().toISOString().split("T")[0],
      applicants: 0,
      filled: 0,
    };
    MOCK_VACANCIES.push(vacancy);
    onSuccess(registeredEmployer);
  }

  // Suggested skills from sector
  const sectorSkills = reg.sector ? SECTOR_SKILLS[reg.sector as Sector].map((s) => s.name) : [];

  // ── Render ────────────────────────────────────────────────────────────────
  const steps = ["Company Details", "Location & Verification", "Post First Vacancy"];
  const currentStep = phase === "reg-1" ? 0 : phase === "reg-2" ? 1 : 2;

  return (
    <div className="min-h-full flex" style={{ background: "#f5f7fb" }}>
      {/* Sidebar */}
      <div className="hidden lg:flex flex-col p-10 w-5/12 text-white" style={{ background: "linear-gradient(160deg, #0f2942 0%, #1a4a6e 100%)" }}>
        <button onClick={onBack} className="flex items-center gap-2 text-blue-200 hover:text-white text-sm mb-12 transition-colors">
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to selection
        </button>
        <div className="font-serif text-3xl font-bold mb-4">Register your<br/>company.</div>
        <p className="text-blue-100 text-sm mb-10">Connect with skilled candidates across Maharashtra and post targeted vacancies.</p>
        <div className="space-y-4">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                style={{ background: currentStep >= i ? "#f4a42b" : "rgba(255,255,255,0.1)", color: currentStep >= i ? "#0f2942" : "#93c5fd" }}>
                {currentStep > i ? "✓" : i + 1}
              </div>
              <span className={`text-sm ${currentStep >= i ? "text-white" : "text-blue-300"}`}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form area */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg page-enter">
          <div className="lg:hidden mb-4">
            <button onClick={onBack} className="flex items-center gap-2 text-sm" style={{ color: "#4b5563" }}>
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back
            </button>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: "#111827" }}>
            {phase === "vacancy" ? "Post Your First Vacancy" : "Employer Registration"}
          </h1>
          <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
            {phase === "vacancy"
              ? `Welcome, ${registeredEmployer?.companyName}! Post a vacancy to get started.`
              : `Step ${currentStep + 1} of 3 — ${steps[currentStep]}`}
          </p>

          {/* ── Step 1 — Company Details ──────────────────────────────────── */}
          {phase === "reg-1" && (
            <div className="space-y-4">
              {[
                { label: "Company Name *", key: "companyName", placeholder: "e.g. Infosys BPO Ltd", type: "text" },
                { label: "Official Email *", key: "email", placeholder: "hr@yourcompany.com", type: "email" },
                { label: "HR / Recruiter Name *", key: "hrName", placeholder: "Full name of primary contact", type: "text" },
                { label: "Phone Number *", key: "phone", placeholder: "10-digit mobile number", type: "tel" },
                { label: "Password *", key: "password", placeholder: "Min. 6 characters", type: "password" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className={labelClass} style={{ color: "#374151" }}>{label}</label>
                  <input
                    type={type}
                    className={inputClass}
                    style={{ borderColor: regErrors[key] ? "#dc2626" : "#d1d5db" }}
                    value={String((reg as Record<string, unknown>)[key] ?? "")}
                    onChange={(e) => updateReg(key, e.target.value)}
                    placeholder={placeholder}
                    maxLength={key === "phone" ? 10 : undefined}
                  />
                  {regErrors[key] && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{regErrors[key]}</p>}
                </div>
              ))}
              <button onClick={handleReg1} className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90 mt-2" style={{ background: "#0f2942" }}>
                Continue →
              </button>
            </div>
          )}

          {/* ── Step 2 — Sector, Locations, Certificate ───────────────────── */}
          {phase === "reg-2" && (
            <div className="space-y-5">
              {/* Sector */}
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Primary Industry / Sector *</label>
                <select className={inputClass} style={{ borderColor: regErrors.sector ? "#dc2626" : "#d1d5db", color: reg.sector ? "#111827" : "#9ca3af" }}
                  value={reg.sector} onChange={(e) => updateReg("sector", e.target.value)}>
                  <option value="">Select sector</option>
                  {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {regErrors.sector && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{regErrors.sector}</p>}
              </div>

              {/* Multiple locations */}
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Company Location(s) in Maharashtra *</label>
                <p className="text-xs mb-2" style={{ color: "#9ca3af" }}>Select all districts where you operate</p>
                <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto border rounded-xl p-3 bg-white" style={{ borderColor: regErrors.locations ? "#dc2626" : "#d1d5db" }}>
                  {MAHARASHTRA_DISTRICTS.map((d) => (
                    <button key={d} type="button" onClick={() => toggleLocation(d)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium transition-all border"
                      style={reg.locations.includes(d)
                        ? { background: "#0f2942", color: "#fff", borderColor: "#0f2942" }
                        : { background: "#f8fafc", color: "#374151", borderColor: "#e2e8f0" }}>
                      {d}
                    </button>
                  ))}
                </div>
                {reg.locations.length > 0 && (
                  <p className="text-xs mt-1" style={{ color: "#0f2942" }}>Selected: {reg.locations.join(", ")}</p>
                )}
                {regErrors.locations && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{regErrors.locations}</p>}
              </div>

              {/* Website */}
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Website (optional)</label>
                <input className={inputClass} style={{ borderColor: "#d1d5db" }} value={reg.certFileName ? "" : ""}
                  placeholder="www.yourcompany.com" onChange={() => {}} />
              </div>

              {/* Certificate */}
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Company Verification Document *</label>
                <div onClick={() => fileRef.current?.click()}
                  className="w-full p-5 rounded-xl border-2 border-dashed cursor-pointer text-center transition-colors hover:border-blue-400"
                  style={{ borderColor: regErrors.cert ? "#dc2626" : "#d1d5db", background: "#fafafa" }}>
                  {reg.certFileName ? (
                    <div className="flex items-center justify-center gap-2">
                      <span>📄</span>
                      <span className="text-sm font-medium" style={{ color: "#16a34a" }}>{reg.certFileName}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); updateReg("certFileName", ""); }} className="text-gray-400 hover:text-red-500">×</button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl mb-1">🏢</div>
                      <p className="text-sm font-medium" style={{ color: "#374151" }}>Upload GST / CIN / MSME Certificate</p>
                      <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>PDF, JPG, PNG up to 10MB</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) updateReg("certFileName", f.name); }} />
                {regErrors.cert && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{regErrors.cert}</p>}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setPhase("reg-1")} className="flex-1 py-3 rounded-xl border text-sm font-semibold hover:bg-gray-50" style={{ borderColor: "#d1d5db", color: "#374151" }}>
                  Back
                </button>
                <button onClick={handleReg2} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: "#0f2942" }}>
                  Register Company →
                </button>
              </div>
            </div>
          )}

          {/* ── Vacancy Form ──────────────────────────────────────────────── */}
          {phase === "vacancy" && (
            <div className="space-y-5">
              {/* Job Role */}
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Job Role / Position *</label>
                <input className={inputClass} style={{ borderColor: vacErrors.jobRole ? "#dc2626" : "#d1d5db" }}
                  value={vac.jobRole} onChange={(e) => updateVac("jobRole", e.target.value)} placeholder="e.g. Python Developer" />
                {vacErrors.jobRole && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{vacErrors.jobRole}</p>}
              </div>

              {/* Vacancies + Employment Type */}
              <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div>
                  <label className={labelClass} style={{ color: "#374151" }}>No. of Vacancies *</label>
                  <input type="number" min="1" className={inputClass} style={{ borderColor: vacErrors.vacancies ? "#dc2626" : "#d1d5db" }}
                    value={vac.vacancies} onChange={(e) => updateVac("vacancies", e.target.value)} placeholder="e.g. 10" />
                  {vacErrors.vacancies && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{vacErrors.vacancies}</p>}
                </div>
                <div>
                  <label className={labelClass} style={{ color: "#374151" }}>Employment Type *</label>
                  <select className={inputClass} style={{ borderColor: "#d1d5db" }} value={vac.employmentType} onChange={(e) => updateVac("employmentType", e.target.value as EmploymentType)}>
                    {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Job Description *</label>
                <textarea className={inputClass} style={{ borderColor: vacErrors.description ? "#dc2626" : "#d1d5db", minHeight: "80px", resize: "none" }}
                  value={vac.description} onChange={(e) => updateVac("description", e.target.value)} placeholder="Describe the role, responsibilities, and work environment" />
                {vacErrors.description && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{vacErrors.description}</p>}
              </div>

              {/* Required Skills */}
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Required Skills *</label>
                {sectorSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {sectorSkills.slice(0, 8).map((s) => (
                      <button key={s} type="button" onClick={() => { if (!vac.requiredSkills.includes(s)) setVac((p) => ({ ...p, requiredSkills: [...p.requiredSkills, s] })); }}
                        className="px-2.5 py-1 rounded-full text-xs border transition-all"
                        style={vac.requiredSkills.includes(s) ? { background: "#0f2942", color: "#fff", borderColor: "#0f2942" } : { background: "#fff", color: "#374151", borderColor: "#d1d5db" }}>
                        {vac.requiredSkills.includes(s) ? "✓ " : "+ "}{s}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input className={inputClass + " flex-1"} style={{ borderColor: vacErrors.requiredSkills ? "#dc2626" : "#d1d5db" }}
                    value={reqSkillInput} onChange={(e) => setReqSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("requiredSkills", reqSkillInput, setReqSkillInput))}
                    placeholder="Type and press Enter or Add" />
                  <button type="button" onClick={() => addSkill("requiredSkills", reqSkillInput, setReqSkillInput)} className="px-3 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "#0f2942" }}>Add</button>
                </div>
                {vac.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {vac.requiredSkills.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-full text-xs flex items-center gap-1" style={{ background: "#0f2942", color: "#fff" }}>
                        {s}<button onClick={() => removeSkill("requiredSkills", s)} className="hover:opacity-70">×</button>
                      </span>
                    ))}
                  </div>
                )}
                {vacErrors.requiredSkills && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{vacErrors.requiredSkills}</p>}
              </div>

              {/* Preferred Skills */}
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Preferred Skills (optional)</label>
                <div className="flex gap-2">
                  <input className={inputClass + " flex-1"} style={{ borderColor: "#d1d5db" }}
                    value={prefSkillInput} onChange={(e) => setPrefSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill("preferredSkills", prefSkillInput, setPrefSkillInput))}
                    placeholder="Nice-to-have skills" />
                  <button type="button" onClick={() => addSkill("preferredSkills", prefSkillInput, setPrefSkillInput)} className="px-3 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "#374151" }}>Add</button>
                </div>
                {vac.preferredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {vac.preferredSkills.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-full text-xs flex items-center gap-1" style={{ background: "#6b7280", color: "#fff" }}>
                        {s}<button onClick={() => removeSkill("preferredSkills", s)} className="hover:opacity-70">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Education + Experience */}
              <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div>
                  <label className={labelClass} style={{ color: "#374151" }}>Educational Qualification *</label>
                  <select className={inputClass} style={{ borderColor: vacErrors.education ? "#dc2626" : "#d1d5db", color: vac.education ? "#111827" : "#9ca3af" }}
                    value={vac.education} onChange={(e) => updateVac("education", e.target.value)}>
                    <option value="">Select</option>
                    {EDUCATION_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  {vacErrors.education && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{vacErrors.education}</p>}
                </div>
                <div>
                  <label className={labelClass} style={{ color: "#374151" }}>Experience Required *</label>
                  <input className={inputClass} style={{ borderColor: vacErrors.experience ? "#dc2626" : "#d1d5db" }}
                    value={vac.experience} onChange={(e) => updateVac("experience", e.target.value)} placeholder="e.g. 0–2 years / Fresher" />
                  {vacErrors.experience && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{vacErrors.experience}</p>}
                </div>
              </div>

              {/* Salary Range */}
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Salary Range (₹ LPA) *</label>
                <div className="flex gap-3 items-center">
                  <input type="number" step="0.1" min="0" className={inputClass + " flex-1"} style={{ borderColor: vacErrors.salary ? "#dc2626" : "#d1d5db" }}
                    value={vac.salaryMin} onChange={(e) => updateVac("salaryMin", e.target.value)} placeholder="Min (e.g. 3.5)" />
                  <span className="text-gray-400">–</span>
                  <input type="number" step="0.1" min="0" className={inputClass + " flex-1"} style={{ borderColor: vacErrors.salary ? "#dc2626" : "#d1d5db" }}
                    value={vac.salaryMax} onChange={(e) => updateVac("salaryMax", e.target.value)} placeholder="Max (e.g. 6.0)" />
                </div>
                {vacErrors.salary && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{vacErrors.salary}</p>}
              </div>

              {/* Location + Deadline */}
              <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div>
                  <label className={labelClass} style={{ color: "#374151" }}>Job Location *</label>
                  <select className={inputClass} style={{ borderColor: vacErrors.location ? "#dc2626" : "#d1d5db", color: vac.location ? "#111827" : "#9ca3af" }}
                    value={vac.location} onChange={(e) => updateVac("location", e.target.value)}>
                    <option value="">Select district</option>
                    {MAHARASHTRA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {vacErrors.location && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{vacErrors.location}</p>}
                </div>
                <div>
                  <label className={labelClass} style={{ color: "#374151" }}>Application Deadline *</label>
                  <input type="date" className={inputClass} style={{ borderColor: vacErrors.deadline ? "#dc2626" : "#d1d5db" }}
                    value={vac.deadline} onChange={(e) => updateVac("deadline", e.target.value)} min={new Date().toISOString().split("T")[0]} />
                  {vacErrors.deadline && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{vacErrors.deadline}</p>}
                </div>
              </div>

              <button onClick={handleVacancySubmit} className="w-full py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: "#0f2942" }}>
                Submit Vacancy & Go to Dashboard →
              </button>

              <p className="text-center text-xs" style={{ color: "#9ca3af" }}>You can add more vacancies from the dashboard.</p>
            </div>
          )}

          {(phase === "reg-1" || phase === "reg-2") && (
            <div className="mt-4 text-center text-sm" style={{ color: "#6b7280" }}>
              Already registered?{" "}
              <button onClick={onLogin} className="font-semibold hover:underline" style={{ color: "#0f2942" }}>Sign In</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
