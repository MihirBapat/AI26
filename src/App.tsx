import { useState } from "react";
import UserSelection from "./pages/UserSelection";
import StudentLogin from "./pages/StudentLogin";
import StudentRegister from "./pages/StudentRegister";
import StudentDashboard from "./pages/StudentDashboard";
import InstituteLogin from "./pages/InstituteLogin";
import InstituteRegister from "./pages/InstituteRegister";
import InstituteDashboard from "./pages/InstituteDashboard";
import EmployerLogin from "./pages/EmployerLogin";
import EmployerRegister from "./pages/EmployerRegister";
import EmployerDashboard from "./pages/EmployerDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import type { Student, Employer } from "./data";
import type { InstituteWithVerification } from "./data";

type Page =
  | "user-selection"
  | "student-login" | "student-register" | "student-dashboard"
  | "institute-login" | "institute-register" | "institute-dashboard"
  | "employer-login" | "employer-register" | "employer-dashboard"
  | "admin-login" | "admin-dashboard";

export default function App() {
  const [page, setPage] = useState<Page>("user-selection");
  const [student, setStudent] = useState<Student | null>(null);
  const [institute, setInstitute] = useState<InstituteWithVerification | null>(null);
  const [employer, setEmployer] = useState<Employer | null>(null);

  function handleRoleSelect(role: "student" | "institute" | "employer" | "admin") {
    if (role === "student") setPage("student-login");
    else if (role === "institute") setPage("institute-login");
    else if (role === "employer") setPage("employer-login");
    else setPage("admin-login");
  }

  // ── User Selection ──────────────────────────────────────────────────────
  if (page === "user-selection") {
    return <UserSelection onSelect={handleRoleSelect} />;
  }

  // ── Student ─────────────────────────────────────────────────────────────
  if (page === "student-login") {
    return (
      <StudentLogin
        onLogin={(s) => { setStudent(s); setPage("student-dashboard"); }}
        onRegister={() => setPage("student-register")}
        onBack={() => setPage("user-selection")}
      />
    );
  }
  if (page === "student-register") {
    return (
      <StudentRegister
        onSuccess={(s) => { setStudent(s); setPage("student-dashboard"); }}
        onLogin={() => setPage("student-login")}
        onBack={() => setPage("user-selection")}
      />
    );
  }
  if (page === "student-dashboard" && student) {
    return (
      <StudentDashboard
        student={student}
        onLogout={() => { setStudent(null); setPage("user-selection"); }}
      />
    );
  }

  // ── Training Institute ───────────────────────────────────────────────────
  if (page === "institute-login") {
    return (
      <InstituteLogin
        onLogin={(inst) => { setInstitute(inst as InstituteWithVerification); setPage("institute-dashboard"); }}
        onRegister={() => setPage("institute-register")}
        onBack={() => setPage("user-selection")}
      />
    );
  }
  if (page === "institute-register") {
    return (
      <InstituteRegister
        onSuccess={(inst) => { setInstitute(inst as InstituteWithVerification); setPage("institute-dashboard"); }}
        onLogin={() => setPage("institute-login")}
        onBack={() => setPage("user-selection")}
      />
    );
  }
  if (page === "institute-dashboard" && institute) {
    return (
      <InstituteDashboard
        institute={institute}
        onLogout={() => { setInstitute(null); setPage("user-selection"); }}
      />
    );
  }

  // ── Employer ─────────────────────────────────────────────────────────────
  if (page === "employer-login") {
    return (
      <EmployerLogin
        onLogin={(emp) => { setEmployer(emp); setPage("employer-dashboard"); }}
        onRegister={() => setPage("employer-register")}
        onBack={() => setPage("user-selection")}
      />
    );
  }
  if (page === "employer-register") {
    return (
      <EmployerRegister
        onSuccess={(emp) => { setEmployer(emp); setPage("employer-dashboard"); }}
        onLogin={() => setPage("employer-login")}
        onBack={() => setPage("user-selection")}
      />
    );
  }
  if (page === "employer-dashboard" && employer) {
    return (
      <EmployerDashboard
        employer={employer}
        onLogout={() => { setEmployer(null); setPage("user-selection"); }}
      />
    );
  }

  // ── Admin ─────────────────────────────────────────────────────────────────
  if (page === "admin-login") {
    return (
      <AdminLogin
        onLogin={() => setPage("admin-dashboard")}
        onBack={() => setPage("user-selection")}
      />
    );
  }
  if (page === "admin-dashboard") {
    return (
      <AdminDashboard
        onLogout={() => setPage("user-selection")}
      />
    );
  }

  // Fallback — shouldn't be reached
  return null;
}
