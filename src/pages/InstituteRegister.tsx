import { useState, useRef } from "react";
import { SECTORS, SECTOR_SKILLS, MOCK_INSTITUTES, type InstituteWithVerification, type Sector, type District } from "../data";

interface Props {
  onSuccess: (institute: InstituteWithVerification) => void;
  onLogin: () => void;
  onBack: () => void;
}

const COMMON_COURSES = [
  "Python Programming", "Data Science & ML", "Web Development (React)", "Cloud Computing",
  "Cybersecurity Fundamentals", "DevOps & CI/CD", "UI/UX Design",
  "Financial Analysis", "Tally ERP", "GST & Tax Filing",
  "CNC & AutoCAD", "Industrial Automation (PLC)", "Quality Control",
  "Nursing Assistant", "Medical Coding (ICD-10)", "Hospital Management",
  "Digital Marketing", "E-commerce Management", "Supply Chain",
  "BIM & Green Building", "Project Management (PMP)",
  "Ed-Tech & Blended Learning", "STEM Curriculum Design",
  "Hotel Management", "Food Safety (FSSAI)",
  "Precision Farming", "Agri-Tech & Drones", "Organic Certification",
  "Core Java (Legacy)", "Manual Testing (non-AI)", "Flash / ActionScript",
];

export default function InstituteRegister({ onSuccess, onLogin, onBack }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    instituteName: "", instituteId: "", email: "", phone: "",
    address: "", website: "", password: "",
    courses: [] as string[],
    sector: "" as Sector | "",
    certFileName: "",
  });
  const [customCourse, setCustomCourse] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  function update(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  function toggleCourse(course: string) {
    setForm((f) => ({
      ...f,
      courses: f.courses.includes(course) ? f.courses.filter((c) => c !== course) : [...f.courses, course],
    }));
  }

  function addCustomCourse() {
    if (customCourse.trim() && !form.courses.includes(customCourse.trim())) {
      update("courses", [...form.courses, customCourse.trim()]);
      setCustomCourse("");
    }
  }

  function validateStep1() {
    const e: Record<string, string> = {};
    if (!form.instituteName.trim()) e.instituteName = "Institute name is required";
    if (!form.instituteId.trim()) e.instituteId = "Institute ID is required";
    else if (MOCK_INSTITUTES.find((i) => i.instituteId === form.instituteId)) e.instituteId = "Institute ID already registered";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = "Enter a valid email";
    if (!form.phone.match(/^\d{10}$/)) e.phone = "Enter a valid 10-digit phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: Record<string, string> = {};
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.password || form.password.length < 6) e.password = "Password must be at least 6 characters";
    if (!form.certFileName) e.cert = "Please upload verification certificate";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    const instWithVerification: InstituteWithVerification = {
      instituteName: form.instituteName,
      instituteId: form.instituteId,
      email: form.email,
      phone: form.phone,
      address: form.address,
      courses: form.courses,
      website: form.website,
      password: form.password,
      verified: false,
      certFileName: "",
      district: "Pune" as District,
      registeredOn: new Date().toISOString().split("T")[0],
    };
    MOCK_INSTITUTES.push(instWithVerification);
    onSuccess(instWithVerification);
  }

  const courseSuggestions = form.sector ? SECTOR_SKILLS[form.sector as Sector].map((s) => s.name) : COMMON_COURSES;

  const inputClass = "w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-green-200 bg-white transition-shadow";
  const labelClass = "block text-sm font-medium mb-1.5";

  return (
    <div className="min-h-full flex" style={{ background: "#f5f7fb" }}>
      {/* Left sidebar */}
      <div className="hidden lg:flex flex-col p-10 w-5/12 text-white" style={{ background: "linear-gradient(160deg, #1a4a3a 0%, #1a7a6e 100%)" }}>
        <button onClick={onBack} className="flex items-center gap-2 text-green-200 hover:text-white text-sm mb-12 transition-colors">
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to selection
        </button>
        <div className="font-serif text-3xl font-bold mb-4">Register your<br/>institute.</div>
        <p className="text-green-100 text-sm mb-10">Join SkillBridge to align your curriculum with Maharashtra's evolving industry demands.</p>
        <div className="space-y-4">
          {[
            { num: 1, label: "Institute Details" },
            { num: 2, label: "Address & Credentials" },
            { num: 3, label: "Courses & Sector" },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all"
                style={{ background: step >= s.num ? "#f4a42b" : "rgba(255,255,255,0.1)", color: step >= s.num ? "#1a4a3a" : "#86efac" }}>
                {step > s.num ? "✓" : s.num}
              </div>
              <span className={`text-sm ${step >= s.num ? "text-white" : "text-green-300"}`}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md page-enter">
          <div className="lg:hidden mb-4">
            <button onClick={onBack} className="flex items-center gap-2 text-sm" style={{ color: "#4b5563" }}>
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back
            </button>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: "#111827" }}>Institute Registration</h1>
          <p className="text-sm mb-6" style={{ color: "#6b7280" }}>Step {step} of 3 — {["Institute Details", "Address & Credentials", "Courses & Sector"][step - 1]}</p>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Institute Name *</label>
                <input className={inputClass} style={{ borderColor: errors.instituteName ? "#dc2626" : "#d1d5db" }} value={form.instituteName} onChange={(e) => update("instituteName", e.target.value)} placeholder="e.g. Maharashtra Institute of Technology" />
                {errors.instituteName && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.instituteName}</p>}
              </div>
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Institute ID *</label>
                <input className={inputClass} style={{ borderColor: errors.instituteId ? "#dc2626" : "#d1d5db" }} value={form.instituteId} onChange={(e) => update("instituteId", e.target.value)} placeholder="e.g. INST-2024-XXX" />
                {errors.instituteId && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.instituteId}</p>}
              </div>
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Official Email *</label>
                <input type="email" className={inputClass} style={{ borderColor: errors.email ? "#dc2626" : "#d1d5db" }} value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="admin@institute.edu.in" />
                {errors.email && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.email}</p>}
              </div>
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Phone Number *</label>
                <input type="tel" className={inputClass} style={{ borderColor: errors.phone ? "#dc2626" : "#d1d5db" }} value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="10-digit mobile number" maxLength={10} />
                {errors.phone && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.phone}</p>}
              </div>
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Website</label>
                <input className={inputClass} style={{ borderColor: "#d1d5db" }} value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="www.yourinstitute.edu.in (optional)" />
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Full Address *</label>
                <textarea
                  className={inputClass}
                  style={{ borderColor: errors.address ? "#dc2626" : "#d1d5db", minHeight: "80px", resize: "none" }}
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Street, Area, City, District, Maharashtra - PIN"
                />
                {errors.address && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.address}</p>}
              </div>
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Password *</label>
                <input type="password" className={inputClass} style={{ borderColor: errors.password ? "#dc2626" : "#d1d5db" }} value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Min. 6 characters" />
                {errors.password && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.password}</p>}
              </div>
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Registration / Verification Certificate *</label>
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-full p-6 rounded-xl border-2 border-dashed cursor-pointer text-center transition-colors hover:border-green-400"
                  style={{ borderColor: errors.cert ? "#dc2626" : "#d1d5db", background: "#fafafa" }}
                >
                  {form.certFileName ? (
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-green-600">📄</span>
                      <span className="text-sm font-medium" style={{ color: "#16a34a" }}>{form.certFileName}</span>
                      <button type="button" onClick={(e) => { e.stopPropagation(); update("certFileName", ""); }} className="text-gray-400 hover:text-red-500">×</button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl mb-2">📋</div>
                      <p className="text-sm font-medium" style={{ color: "#374151" }}>Click to upload certificate</p>
                      <p className="text-xs mt-1" style={{ color: "#9ca3af" }}>PDF, JPG, PNG up to 5MB</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) update("certFileName", file.name);
                  }}
                />
                {errors.cert && <p className="text-xs mt-1" style={{ color: "#dc2626" }}>{errors.cert}</p>}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Primary Sector</label>
                <select className={inputClass} style={{ borderColor: "#d1d5db", color: form.sector ? "#111827" : "#9ca3af" }} value={form.sector} onChange={(e) => update("sector", e.target.value)}>
                  <option value="">Select sector (to filter course suggestions)</option>
                  {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass} style={{ color: "#374151" }}>Courses / Skills Offered</label>
                <p className="text-xs mb-3" style={{ color: "#9ca3af" }}>
                  {form.sector ? `Suggestions for: ${form.sector}` : "Select a sector to see targeted suggestions"}
                </p>
                <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto pr-1">
                  {courseSuggestions.map((course) => (
                    <button
                      key={course}
                      type="button"
                      onClick={() => toggleCourse(course)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"
                      style={form.courses.includes(course)
                        ? { background: "#1a7a6e", color: "#fff", borderColor: "#1a7a6e" }
                        : { background: "#fff", color: "#374151", borderColor: "#d1d5db" }}
                    >
                      {form.courses.includes(course) ? "✓ " : ""}{course}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  className={inputClass + " flex-1"}
                  style={{ borderColor: "#d1d5db" }}
                  value={customCourse}
                  onChange={(e) => setCustomCourse(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomCourse())}
                  placeholder="Add custom course..."
                />
                <button type="button" onClick={addCustomCourse} className="px-4 py-3 rounded-xl text-sm font-medium text-white" style={{ background: "#1a7a6e" }}>
                  Add
                </button>
              </div>
              {form.courses.length > 0 && (
                <div className="p-3 rounded-xl" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <p className="text-xs font-medium mb-2" style={{ color: "#166534" }}>Selected ({form.courses.length}):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {form.courses.map((c) => (
                      <span key={c} className="px-2 py-0.5 rounded-full text-xs flex items-center gap-1" style={{ background: "#1a7a6e", color: "#fff" }}>
                        {c}
                        <button onClick={() => toggleCourse(c)} className="hover:opacity-70">×</button>
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
              <button onClick={() => setStep(step - 1)} className="flex-1 py-3 rounded-xl border text-sm font-semibold hover:bg-gray-50 transition-colors" style={{ borderColor: "#d1d5db", color: "#374151" }}>
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => { if (step === 1 && validateStep1()) setStep(2); else if (step === 2 && validateStep2()) setStep(3); }}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: "#1a7a6e" }}>
                Continue →
              </button>
            ) : (
              <button onClick={handleSubmit} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white hover:opacity-90" style={{ background: "#16a34a" }}>
                Register Institute
              </button>
            )}
          </div>

          <div className="mt-4 text-center text-sm" style={{ color: "#6b7280" }}>
            Already registered?{" "}
            <button onClick={onLogin} className="font-semibold hover:underline" style={{ color: "#1a7a6e" }}>
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
