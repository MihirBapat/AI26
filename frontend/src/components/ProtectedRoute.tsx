import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRole: string
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const userStr = localStorage.getItem('currentUser')
  
  if (!userStr) {
    // Not logged in, redirect to home or login selection
    return <Navigate to="/" replace />
  }

  try {
    const user = JSON.parse(userStr)
    if (user.role !== allowedRole) {
      // Logged in but wrong role, redirect to their dashboard or home
      return <Navigate to="/" replace />
    }
  } catch (error) {
    // Invalid local storage data
    localStorage.removeItem('currentUser')
    return <Navigate to="/" replace />
  }

  // Authorized, render the route
  return <>{children}</>
}
