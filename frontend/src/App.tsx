import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Home } from './pages/home/Home'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { GovLogin } from './pages/auth/gov/GovLogin'
import { GovRegister } from './pages/auth/gov/GovRegister'
import { GovDashboard } from './pages/gov/Dashboard'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ThemeProvider } from './components/theme-provider'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="skillbridge-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/gov/login" element={<GovLogin />} />
          <Route path="/gov/register" element={<GovRegister />} />
          <Route path="/gov/dashboard" element={<ProtectedRoute allowedRole="gov"><GovDashboard /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
