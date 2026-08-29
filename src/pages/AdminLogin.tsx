import { useState } from "react";
import { ADMIN_CREDENTIALS } from "../data";

interface Props {
  onLogin: () => void;
  onBack: () => void;
}

export default function AdminLogin({ onLogin, onBack }: Props) {
  const [adminId, setAdminId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const { adminId: aid, email: ae, password: ap } = ADMIN_CREDENTIALS;
    if (adminId.trim() === aid && email.trim().toLowerCase() === ae && password === ap) {
      onLogin();
    } else {
      setError("Invalid credentials. Check Admin ID, email, and password.");
    }
  }

  return (
    <div className="min-h-full flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-10 w-5/12 text-white"
        style={{ background: "linear-gradient(160deg, #1a0a2e 0%, #3b1e6e 100%)" }}
      >
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-purple-200 hover:text-white transition-colors text-sm mb-12">
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to selection
          </button>
          <div className="font-serif text-4xl font-bold leading-tight mb-4">
            Platform<br/>Administration.
          </div>
          <p className="text-purple-100 leading-relaxed">
            Full access to SkillBridge platform management — users, demand analytics, skill gaps, vacancies, and institute verification.
          </p>
        </div>
        <div className="space-y-4">
          {[
            "Manage students, institutes & employers",
            "Industry demand analytics by district",
            "Skill gap analysis across Maharashtra",
            "Vacancy & placement outcome monitoring",
            "Institute registration verification",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-purple-100">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(244,164,43,0.3)" }}>
                <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M2 6l3 3 5-5" stroke="#f4a42b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: "#f5f7fb" }}>
        <div className="w-full max-w-md page-enter">
          <div className="lg:hidden mb-6">
            <button onClick={onBack} className="flex items-center gap-2 text-sm mb-4" style={{ color: "#4b5563" }}>
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back
            </button>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#3b1e6e" }}>
              <span className="text-sm">⚙️</span>
            </div>
            <span className="font-semibold text-sm" style={{ color: "#3b1e6e" }}>SkillBridge — Admin Portal</span>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: "#111827" }}>Admin Login</h1>
          <p className="text-sm mb-8" style={{ color: "#6b7280" }}>Enter your Admin ID, registered email, and password</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>Admin ID</label>
              <input type="text" value={adminId} onChange={(e) => { setAdminId(e.target.value); setError(""); }}
                placeholder="e.g. ADMIN-001"
                className="w-full px-4 py-3 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200"
                style={{ borderColor: "#d1d5db" }} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>Email</label>
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="admin@skillbridge.gov.in"
                className="w-full px-4 py-3 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200"
                style={{ borderColor: "#d1d5db" }} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>Password</label>
              <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Enter admin password"
                className="w-full px-4 py-3 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-200"
                style={{ borderColor: "#d1d5db" }} required />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                {error}
              </div>
            )}

            <button type="submit" className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ background: "#3b1e6e" }}>
              Sign In
            </button>
          </form>

          <div className="mt-8 p-4 rounded-xl text-xs" style={{ background: "#f5f3ff", border: "1px solid #ddd6fe", color: "#4c1d95" }}>
            <strong>Demo credentials:</strong><br/>
            Admin ID: ADMIN-001<br/>
            Email: admin@skillbridge.gov.in<br/>
            Password: admin@123
          </div>
        </div>
      </div>
    </div>
  );
}
