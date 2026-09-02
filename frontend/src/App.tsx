import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Home } from './pages/home/Home'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { GovLogin } from './pages/auth/gov/GovLogin'
import { GovRegister } from './pages/auth/gov/GovRegister'
import { GovDashboard } from './pages/gov/Dashboard'
import { CourseHealthReport } from './pages/gov/CourseHealthReport'
import { StdLogin } from './pages/auth/std/StdLogin'
import { StdRegister } from './pages/auth/std/StdRegister'
import { StdDashboard } from './pages/std/Dashboard'
import { StdProfile } from './pages/std/Profile'
import { ConsultationRoom } from './pages/std/ConsultationRoom'

// Employer Module Pages
import { EmployerDashboard } from './pages/employer/EmployerDashboard'
import { EmployerJobs } from './pages/employer/EmployerJobs'
import { EmployerCreateJob } from './pages/employer/EmployerCreateJob'
import { EmployerJobDetails } from './pages/employer/EmployerJobDetails'
import { EmployerSkills } from './pages/employer/EmployerSkills'
import { EmployerAnalytics } from './pages/employer/EmployerAnalytics'
import { EmployerCourseMatches } from './pages/employer/EmployerCourseMatches'
import { EmployerValidations } from './pages/employer/EmployerValidations'
import { EmployerFeedback } from './pages/employer/EmployerFeedback'
import { EmployerIntelligence } from './pages/employer/EmployerIntelligence'
import { EmployerProfilePage } from './pages/employer/EmployerProfile'

import { ProtectedRoute } from './components/ProtectedRoute'
import { ThemeProvider } from './components/theme-provider'
import { AuthProvider } from './context/AuthContext'
import { TooltipProvider } from '@/components/ui/tooltip'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="skillbridge-theme">
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <Routes>
              {/* Public & Shared Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Government Portal Routes */}
              <Route path="/gov/login" element={<GovLogin />} />
              <Route path="/gov/register" element={<GovRegister />} />
              <Route
                path="/gov/dashboard"
                element={
                  <ProtectedRoute allowedRole="gov">
                    <GovDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/gov/course/:id"
                element={
                  <ProtectedRoute allowedRole="gov">
                    <CourseHealthReport />
                  </ProtectedRoute>
                }
              />

              {/* Candidate / Student Routes */}
              <Route path="/std/login" element={<StdLogin />} />
              <Route path="/std/register" element={<StdRegister />} />
              <Route
                path="/std/profile"
                element={
                  <ProtectedRoute allowedRole="candidate">
                    <StdProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/std/dashboard"
                element={
                  <ProtectedRoute allowedRole="candidate">
                    <StdDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/std/consultation/room"
                element={
                  <ProtectedRoute allowedRole="candidate">
                    <ConsultationRoom />
                  </ProtectedRoute>
                }
              />

              {/* Employer Module Routes */}
              <Route
                path="/employer/dashboard"
                element={
                  <ProtectedRoute allowedRole="employer">
                    <EmployerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employer/jobs"
                element={
                  <ProtectedRoute allowedRole="employer">
                    <EmployerJobs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employer/jobs/new"
                element={
                  <ProtectedRoute allowedRole="employer">
                    <EmployerCreateJob />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employer/jobs/:jobId"
                element={
                  <ProtectedRoute allowedRole="employer">
                    <EmployerJobDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employer/skills"
                element={
                  <ProtectedRoute allowedRole="employer">
                    <EmployerSkills />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employer/analytics"
                element={
                  <ProtectedRoute allowedRole="employer">
                    <EmployerAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employer/course-matches"
                element={
                  <ProtectedRoute allowedRole="employer">
                    <EmployerCourseMatches />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employer/validations"
                element={
                  <ProtectedRoute allowedRole="employer">
                    <EmployerValidations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employer/feedback"
                element={
                  <ProtectedRoute allowedRole="employer">
                    <EmployerFeedback />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employer/intelligence"
                element={
                  <ProtectedRoute allowedRole="employer">
                    <EmployerIntelligence />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employer/profile"
                element={
                  <ProtectedRoute allowedRole="employer">
                    <EmployerProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
