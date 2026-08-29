import { useState } from "react";
import { MOCK_EMPLOYERS, type Employer } from "../data";

interface Props {
  onLogin: (employer: Employer) => void;
  onRegister: () => void;
  onBack: () => void;
}

export default function EmployerLogin({ onLogin, onRegister, onBack }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const emp = MOCK_EMPLOYERS.find(
      (em) => (em.email === email.trim().toLowerCase()) && em.password === password
    );
    if (emp) {
      onLogin(emp);
    } else {
      setError("Invalid email/ID or password. Try: hr@infosysbpo.com / info123");
    }
  }

  return (
    <div className="min-h-full flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between p-10 w-5/12 text-white"
        style={{ background: "linear-gradient(160deg, #0f2942 0%, #1a4a6e 100%)" }}
      >
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors text-sm mb-12">
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to selection
          </button>
          <div className="font-serif text-4xl font-bold leading-tight mb-4">
            Hire smarter.<br/>Bridge the gap.
          </div>
          <p className="text-blue-100 leading-relaxed">
            Post vacancies, match with skilled candidates across Maharashtra, and access AI-powered skill demand insights for your sector.
          </p>
        </div>
        <div className="space-y-4">
          {[
            "Post vacancies and receive matched candidates",
            "AI skill demand analysis by district",
            "Identify skill gaps affecting your hiring",
            "Discover recommended training partners",
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-blue-100">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(244,164,43,0.3)" }}>
                <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><path d="M2 6l3 3 5-5" stroke="#f4a42b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background: "#f5f7fb" }}>
        <div className="w-full max-w-md page-enter">
          <div className="lg:hidden mb-6">
            <button onClick={onBack} className="flex items-center gap-2 text-sm mb-4" style={{ color: "#4b5563" }}>
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back
            </button>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#0f2942" }}>
              <span className="text-sm">🏢</span>
            </div>
            <span className="font-semibold text-sm" style={{ color: "#0f2942" }}>SkillBridge — Employer Portal</span>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: "#111827" }}>Employer Login</h1>
          <p className="text-sm mb-8" style={{ color: "#6b7280" }}>Sign in with your official email and password</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>Official Email / Employer ID</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="hr@yourcompany.com"
                className="w-full px-4 py-3 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ borderColor: "#d1d5db" }}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
                style={{ borderColor: "#d1d5db" }}
                required
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ background: "#0f2942" }}
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: "#6b7280" }}>
            New employer?{" "}
            <button onClick={onRegister} className="font-semibold hover:underline" style={{ color: "#0f2942" }}>
              Register Your Company
            </button>
          </div>

          <div className="mt-8 p-4 rounded-xl text-xs" style={{ background: "#f0f4ff", border: "1px solid #c7d7fb", color: "#1e3a8a" }}>
            <strong>Demo credentials:</strong> hr@infosysbpo.com / info123
            <br />Also try: hr@bajaj.com / bajaj123 · hr@axisbank.com / axis123
          </div>
        </div>
      </div>
    </div>
  );
}
