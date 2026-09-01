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
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
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
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
