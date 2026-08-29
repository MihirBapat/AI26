import { useState } from "react";
import { MOCK_INSTITUTES, type Institute } from "../data";

interface Props {
  onLogin: (institute: Institute) => void;
  onRegister: () => void;
  onBack: () => void;
}

export default function InstituteLogin({ onLogin, onRegister, onBack }: Props) {
  const [instituteId, setInstituteId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const inst = MOCK_INSTITUTES.find((i) => i.instituteId === instituteId && i.password === password);
    if (inst) {
      onLogin(inst);
    } else {
      setError("Invalid Institute ID or password. Try: MITT-2024-001 / inst123");
    }
  }

  return (
    <div className="min-h-full flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between p-10 w-5/12 text-white" style={{ background: "linear-gradient(160deg, #1a4a3a 0%, #1a7a6e 100%)" }}>
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-green-200 hover:text-white transition-colors text-sm mb-12">
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back to selection
          </button>
          <div className="font-serif text-4xl font-bold leading-tight mb-4">
            Align your courses<br/>with industry needs.
          </div>
          <p className="text-green-100 leading-relaxed">
            Access real-time skill demand analytics, AI-powered curriculum recommendations, and placement outcome data for Maharashtra.
          </p>
        </div>
        <div className="space-y-4">
          {["Industry demand analytics by district", "AI curriculum gap recommendations", "Placement outcome tracking", "Emerging skill trend alerts"].map((item) => (
            <div key={item} className="flex items-center gap-3 text-sm text-green-100">
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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#1a7a6e" }}>
              <span className="text-white text-sm">🏫</span>
            </div>
            <span className="font-semibold" style={{ color: "#1a7a6e" }}>SkillBridge — Institute Portal</span>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: "#111827" }}>Training Institute Login</h1>
          <p className="text-sm mb-8" style={{ color: "#6b7280" }}>Sign in with your Institute ID and password</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>Institute ID</label>
              <input
                type="text"
                value={instituteId}
                onChange={(e) => { setInstituteId(e.target.value); setError(""); }}
                placeholder="e.g. MITT-2024-001"
                className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 bg-white"
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
                className="w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 bg-white"
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
              style={{ background: "#1a7a6e" }}
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm" style={{ color: "#6b7280" }}>
            New institute?{" "}
            <button onClick={onRegister} className="font-semibold hover:underline" style={{ color: "#1a7a6e" }}>
              Register Your Institute
            </button>
          </div>

          <div className="mt-8 p-4 rounded-xl text-xs" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" }}>
            <strong>Demo credentials:</strong> MITT-2024-001 / inst123
          </div>
        </div>
      </div>
    </div>
  );
}
