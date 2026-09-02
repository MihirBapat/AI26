import type { ReactNode } from 'react'
import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/context/AuthContext'
import { ShieldAlert, Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRole?: UserRole | UserRole[]
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-foreground font-sans">
        <Loader2 className="size-8 text-primary animate-spin mb-4" />
        <p className="text-sm font-medium text-muted-foreground">Authenticating session...</p>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    let redirectPath = '/login'
    if (allowedRole === 'gov' || (Array.isArray(allowedRole) && allowedRole.includes('gov'))) {
      redirectPath = '/gov/login'
    } else if (allowedRole === 'candidate' || (Array.isArray(allowedRole) && allowedRole.includes('candidate'))) {
      redirectPath = '/std/login'
    } else if (allowedRole === 'employer' || (Array.isArray(allowedRole) && allowedRole.includes('employer'))) {
      redirectPath = '/employer/login'
    }
    return <Navigate to={redirectPath} replace />
  }

  if (allowedRole) {
    const allowedRolesArray = Array.isArray(allowedRole) ? allowedRole : [allowedRole]
    if (!allowedRolesArray.includes(user.role)) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 text-foreground font-sans">
          <div className="max-w-md w-full p-8 rounded-2xl border border-destructive/30 bg-card shadow-lg text-center space-y-4">
            <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <ShieldAlert className="size-6" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Access Forbidden (403)</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your account role is <span className="font-semibold text-foreground uppercase">{user.role}</span>. You do not have permission to view this section.
            </p>
            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}
