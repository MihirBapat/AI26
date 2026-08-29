import { useState } from "react";
import { MOCK_STUDENTS, type Student } from "../data";

interface Props {
  onLogin: (student: Student) => void;
  onRegister: () => void;
  onBack: () => void;
}

export default function StudentLogin({ onLogin, onRegister, onBack }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const student = MOCK_STUDENTS.find((s) => s.username === username && s.password === password);
    if (student) {
      onLogin(student);
    } else {
      setError("Invalid username or password. Try: priya_nashik / pass123");
    }
  }

  return (
    <div className="min-h-full flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 w-5/12 text-white" style={{ background: "linear-gradient(160deg, #1d3461 0%, #2a4a8a 100%)" }}>
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors text-sm mb-12">
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to selection
          </button>
          <div className="font-serif text-4xl font-bold leading-tight mb-4">
            Your career journey<br/>starts here.
          </div>
          <p className="text-blue-200 leading-relaxed">
            Access personalized skill insights, industry demand data, and AI-powered gap analysis tailored for Maharashtra's job market.
          </p>
        </div>
        <div className="space-y-4">
          {["Top in-demand skills for your district", "AI-powered skill gap analysis", "Emerging sectors in Maharashtra"].map((item) => (
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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#1d3461" }}>
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><path d="M12 2L2 7l10 5 10-5-10-5z" fill="#f4a42b"/></svg>
            </div>
            <span className="font-semibold" style={{ color: "#1d3461" }}>SkillBridge</span>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: "#111827" }}>Student Login</h1>
          <p className="text-sm mb-8" style={{ color: "#6b7280" }}>Sign in to access your dashboard</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(""); }}
                placeholder="Enter your username"
                className="w-full px-4 py-3 rounded-xl border text-sm transition-shadow focus:outline-none focus:ring-2"
                style={{ borderColor: "#d1d5db", background: "#fff", color: "#111827" }}
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
                className="w-full px-4 py-3 rounded-xl border text-sm transition-shadow focus:outline-none focus:ring-2"
                style={{ borderColor: "#d1d5db", background: "#fff", color: "#111827" }}
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
              style={{ background: "#1d3461" }}
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: "#6b7280" }}>
            Don't have an account?{" "}
            <button onClick={onRegister} className="font-semibold hover:underline" style={{ color: "#1d3461" }}>
              Create Account
            </button>
          </div>

          <div className="mt-8 p-4 rounded-xl text-xs" style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af" }}>
            <strong>Demo credentials:</strong> priya_nashik / pass123
          </div>
        </div>
      </div>
    </div>
  );
}
