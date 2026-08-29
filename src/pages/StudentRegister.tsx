import { useState } from "react";
import { SECTORS, MAHARASHTRA_DISTRICTS, EDUCATION_LEVELS, SECTOR_SKILLS, MOCK_STUDENTS, type Student, type Sector, type District } from "../data";

interface Props {
  onSuccess: (student: Student) => void;
  onLogin: () => void;
  onBack: () => void;
}

const COMMON_SKILLS = [
  "Python", "React / Next.js", "Data Analytics", "Cloud Computing (AWS/Azure)",
  "Generative AI / LLMs", "Cybersecurity", "Machine Learning", "UI/UX Design",
  "Node.js / Backend", "DevOps / CI-CD", "Mobile Development", "Java",
  "Financial Analysis", "Tally ERP", "GST Compliance", "Risk Management",
  "Patient Care Management", "Medical Coding (ICD-10)", "Phlebotomy / Lab Tech",
  "CNC Operation", "AutoCAD / CAD-CAM", "Industrial Automation / PLC",
  "Digital Marketing", "E-commerce Management", "Customer Service",
  "BIM (Building Info Modelling)", "Project Management (PMP)", "AutoCAD / Revit",
  "Precision Farming / IoT", "Agri-Tech & Drone Operation", "Organic Certification",
  "Ed-Tech Platform Management", "STEM/STEAM Teaching", "Curriculum Design",
  "Hotel Revenue Management", "Food Safety & Hygiene (FSSAI)", "Event Management",
];

export default function StudentRegister({ onSuccess, onLogin, onBack }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    username: "", password: "", age: "", education: "", college: "",
    skills: [] as string[], location: "" as District | "", sector: "" as Sector | "",
  });
  const [customSkill, setCustomSkill] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  function toggleSkill(skill: string) {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill],
    }));
  }

  function addCustomSkill() {
    if (customSkill.trim() && !form.skills.includes(customSkill.trim())) {
      update("skills", [...form.skills, customSkill.trim()]);
      setCustomSkill("");
    }
  }

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!form.username.trim()) e.username = "Username is required";
    else if (MOCK_STUDENTS.find((s) => s.username === form.username)) e.username = "Username already taken";
    if (!form.password || form.password.length < 6) e.password = "Password must be at least 6 characters";
    if (!form.age || parseInt(form.age) < 14 || parseInt(form.age) > 60) e.age = "Enter a valid age (14–60)";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    if (!form.education) e.education = "Select your education level";
    if (!form.college.trim()) e.college = "College/School name is required";
    if (!form.location) e.location = "Select your district";
    if (!form.sector) e.sector = "Select your sector";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleNext() {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  }

  function handleSubmit() {
    const student: Student = {
      username: form.username,
      password: form.password,
      age: parseInt(form.age),
      education: form.education,
      college: form.college,
      skills: form.skills,
      location: form.location as District,
      sector: form.sector as Sector,
    };
    MOCK_STUDENTS.push(student);
    onSuccess(student);
  }

  // Sector-specific skill suggestions
  const suggestedSkills = form.sector ? SECTOR_SKILLS[form.sector as Sector].map((s) => s.name) : COMMON_SKILLS;

  const inputClass = "w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 transition-shadow bg-white";
  const labelClass = "block text-sm font-medium mb-1.5";

  return (
    <div className="min-h-full flex" style={{ background: "#f5f7fb" }}>
      {/* Left sidebar */}
      <div className="hidden lg:flex flex-col p-10 w-5/12 text-white" style={{ background: "linear-gradient(160deg, #1d3461 0%, #2a4a8a 100%)" }}>
        <button onClick={onBack} className="flex items-center gap-2 text-blue-200 hover:text-white text-sm mb-12 transition-colors">
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to selection
        </button>
        <div className="font-serif text-3xl font-bold mb-4">Create your<br/>student profile.</div>
        <p className="text-blue-200 text-sm mb-10">Complete your profile to get personalized career insights and skill recommendations.</p>

        {/* Step indicator */}
        <div className="space-y-4">
          {[
            { num: 1, label: "Account Credentials" },
            { num: 2, label: "Education & Location" },
            { num: 3, label: "Skills & Sector" },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all ${step >= s.num ? "text-white" : "text-blue-400"}`}
                style={{ background: step >= s.num ? "#f4a42b" : "rgba(255,255,255,0.1)" }}>
                {step > s.num ? "✓" : s.num}
              </div>
              <span className={`text-sm ${step >= s.num ? "text-white" : "text-blue-300"}`}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md page-enter">
          <div className="lg:hidden mb-6">
            <button onClick={onBack} className="flex items-center gap-2 text-sm mb-4" style={{ color: "#4b5563" }}>
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back
            </button>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: "#111827" }}>Student Registration</h1>
          <p className="text-sm mb-6" style={{ color: "#6b7280" }}>Step {step} of 3 — {["Account Credentials", "Education & Location", "Skills & Sector"][step - 1]}</p>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Username *</label>
                <input className={inputClass} style={{ borderColor: errors.username ? "#dc2626" : "#d1d5db" }} value={form.username} onChange={(e) => update("username", e.target.value)} placeholder="e.g. rahul_pune" />
                {errors.username && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.username}</p>}
              </div>
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Password *</label>
                <input type="password" className={inputClass} style={{ borderColor: errors.password ? "#dc2626" : "#d1d5db" }} value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Min. 6 characters" />
                {errors.password && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.password}</p>}
              </div>
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Age *</label>
                <input type="number" className={inputClass} style={{ borderColor: errors.age ? "#dc2626" : "#d1d5db" }} value={form.age} onChange={(e) => update("age", e.target.value)} placeholder="Your age" min="14" max="60" />
                {errors.age && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.age}</p>}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Education Level *</label>
                <select className={inputClass} style={{ borderColor: errors.education ? "#dc2626" : "#d1d5db", color: form.education ? "#111827" : "#9ca3af" }} value={form.education} onChange={(e) => update("education", e.target.value)}>
                  <option value="">Select education</option>
                  {EDUCATION_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                {errors.education && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.education}</p>}
              </div>
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>College / School *</label>
                <input className={inputClass} style={{ borderColor: errors.college ? "#dc2626" : "#d1d5db" }} value={form.college} onChange={(e) => update("college", e.target.value)} placeholder="e.g. SPPU, Pune / Nashik Municipal School" />
                {errors.college && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.college}</p>}
              </div>
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Current Location (District) *</label>
                <select className={inputClass} style={{ borderColor: errors.location ? "#dc2626" : "#d1d5db", color: form.location ? "#111827" : "#9ca3af" }} value={form.location} onChange={(e) => update("location", e.target.value)}>
                  <option value="">Select Maharashtra district</option>
                  {MAHARASHTRA_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.location && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.location}</p>}
              </div>
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Preferred Sector *</label>
                <select className={inputClass} style={{ borderColor: errors.sector ? "#dc2626" : "#d1d5db", color: form.sector ? "#111827" : "#9ca3af" }} value={form.sector} onChange={(e) => update("sector", e.target.value)}>
                  <option value="">Select sector</option>
                  {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.sector && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.sector}</p>}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Select your current skills</label>
                <p className="text-xs mb-3" style={{ color: "#9ca3af" }}>
                  {form.sector ? `Showing skills for: ${form.sector}` : "Click to toggle"}
                </p>
                <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1">
                  {suggestedSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                      style={form.skills.includes(skill)
                        ? { background: "#1d3461", color: "#fff", borderColor: "#1d3461" }
                        : { background: "#fff", color: "#374151", borderColor: "#d1d5db" }}
                    >
                      {form.skills.includes(skill) ? "✓ " : ""}{skill}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  className={inputClass + " flex-1"}
                  style={{ borderColor: "#d1d5db" }}
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
                  placeholder="Add a custom skill..."
                />
                <button type="button" onClick={addCustomSkill} className="px-4 py-3 rounded-xl text-sm font-medium text-white" style={{ background: "#1d3461" }}>
                  Add
                </button>
              </div>
              {form.skills.length > 0 && (
                <div className="p-3 rounded-xl" style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}>
                  <p className="text-xs font-medium mb-2" style={{ color: "#0369a1" }}>Selected ({form.skills.length}):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {form.skills.map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-full text-xs flex items-center gap-1" style={{ background: "#0369a1", color: "#fff" }}>
                        {s}
                        <button onClick={() => toggleSkill(s)} className="hover:opacity-70">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className="flex-1 py-3 rounded-xl border text-sm font-semibold transition-colors hover:bg-gray-50" style={{ borderColor: "#d1d5db", color: "#374151" }}>
                Back
              </button>
            )}
            {step < 3 ? (
              <button onClick={handleNext} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: "#1d3461" }}>
                Continue →
              </button>
            ) : (
              <button onClick={handleSubmit} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: "#16a34a" }}>
                Create Account
              </button>
            )}
          </div>

          <div className="mt-4 text-center text-sm" style={{ color: "#6b7280" }}>
            Already have an account?{" "}
            <button onClick={onLogin} className="font-semibold hover:underline" style={{ color: "#1d3461" }}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
