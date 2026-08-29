interface Props {
  onSelect: (role: "student" | "institute" | "employer" | "admin") => void;
}

const roles = [
  {
    id: "student" as const,
    label: "Student",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <circle cx="24" cy="16" r="8" fill="#f4a42b" opacity="0.9"/>
        <path d="M8 40c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="#1d3461" strokeWidth="3" strokeLinecap="round"/>
        <path d="M24 8L38 15l-14 7-14-7z" fill="#1d3461" opacity="0.15"/>
      </svg>
    ),
    desc: "Explore career paths, skill gaps, and in-demand opportunities.",
    color: "from-amber-50 to-orange-50",
    border: "border-amber-200",
    hover: "hover:border-amber-400 hover:shadow-amber-100",
  },
  {
    id: "institute" as const,
    label: "Training Institute",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <rect x="8" y="20" width="32" height="22" rx="2" fill="#1d3461" opacity="0.15"/>
        <path d="M4 22L24 8l20 14" stroke="#1d3461" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="18" y="30" width="12" height="12" rx="1" fill="#f4a42b"/>
        <rect x="14" y="24" width="6" height="6" rx="1" fill="#1d3461" opacity="0.4"/>
        <rect x="28" y="24" width="6" height="6" rx="1" fill="#1d3461" opacity="0.4"/>
      </svg>
    ),
    desc: "Align your curriculum with industry demand and improve placements.",
    color: "from-blue-50 to-indigo-50",
    border: "border-blue-200",
    hover: "hover:border-blue-400 hover:shadow-blue-100",
  },
  {
    id: "employer" as const,
    label: "Employer",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <rect x="10" y="18" width="28" height="22" rx="3" fill="#1a7a6e" opacity="0.2"/>
        <rect x="16" y="12" width="16" height="10" rx="2" stroke="#1a7a6e" strokeWidth="2.5"/>
        <path d="M20 18v4M28 18v4" stroke="#1a7a6e" strokeWidth="2"/>
        <circle cx="19" cy="31" r="3" fill="#1a7a6e" opacity="0.7"/>
        <circle cx="29" cy="31" r="3" fill="#1a7a6e" opacity="0.7"/>
        <path d="M14 38c0-2.761 2.239-5 5-5h10c2.761 0 5 2.239 5 5" stroke="#1a7a6e" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    desc: "Find skilled candidates and post job opportunities across Maharashtra.",
    color: "from-teal-50 to-emerald-50",
    border: "border-teal-200",
    hover: "hover:border-teal-400 hover:shadow-teal-100",
  },
  {
    id: "admin" as const,
    label: "Admin",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-10 h-10">
        <path d="M24 6l4.5 9 10 1.5-7.25 7 1.75 10L24 29l-9 4.5 1.75-10L9.5 16.5l10-1.5z" fill="#dc2626" opacity="0.2" stroke="#dc2626" strokeWidth="2" strokeLinejoin="round"/>
        <circle cx="24" cy="20" r="5" fill="#dc2626" opacity="0.6"/>
      </svg>
    ),
    desc: "Monitor platform data, manage users, and configure system settings.",
    color: "from-red-50 to-rose-50",
    border: "border-red-200",
    hover: "hover:border-red-400 hover:shadow-red-100",
  },
];

export default function UserSelection({ onSelect }: Props) {
  return (
    <div className="min-h-full flex flex-col" style={{ background: "linear-gradient(160deg, #f5f7fb 0%, #eef2ff 50%, #f5f7fb 100%)" }}>
      {/* Header */}
      <header className="py-8 px-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#1d3461" }}>
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#f4a42b"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#f4a42b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
            </svg>
          </div>
          <span className="text-2xl font-bold tracking-tight" style={{ color: "#1d3461", fontFamily: "var(--font-serif)" }}>
            SkillBridge
          </span>
        </div>
        <p className="text-base" style={{ color: "#4b5563" }}>Bridging the gap between skills and industry-ready careers.</p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium" style={{ background: "#fff3cd", color: "#b45309" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
          Maharashtra Skill Development Initiative
        </div>
      </header>

      {/* Role Cards */}
      <main className="flex-1 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-3xl">
          <h2 className="text-center text-xl font-semibold mb-8" style={{ color: "#1d3461" }}>
            Who are you logging in as?
          </h2>
          <div className="grid grid-cols-2 gap-5" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => onSelect(role.id)}
                className={`group relative flex flex-col items-start gap-3 p-6 rounded-2xl border-2 bg-gradient-to-br text-left transition-all duration-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 ${role.color} ${role.border} ${role.hover}`}
              >
                <div className="p-3 rounded-xl bg-white shadow-sm">{role.icon}</div>
                <div>
                  <div className="font-semibold text-lg mb-1" style={{ color: "#1d3461" }}>{role.label}</div>
                  <p className="text-sm leading-snug" style={{ color: "#6b7280" }}>{role.desc}</p>
                </div>
                <div className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#1d3461" }}>
                  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      <footer className="text-center py-4 text-xs" style={{ color: "#9ca3af" }}>
        Government of Maharashtra · Skill Development &amp; Entrepreneurship Department
      </footer>
    </div>
  );
}
