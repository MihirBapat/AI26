/**
 * StdProfile — onboarding page at /std/profile
 * Shown when a candidate has no profile yet.
 * After saving, redirects to /std/dashboard.
 */
import { useNavigate } from 'react-router-dom'
import { GraduationCap, LogOut, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/context/AuthContext'
import { ProfileForm } from './components/ProfileForm'

export function StdProfile() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/std/login')
  }

  const handleSaved = () => {
    setTimeout(() => navigate('/std/dashboard'), 1000)
  }

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-6">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
            <GraduationCap className="size-5" />
          </div>
          <div>
            <span className="font-bold text-base text-foreground leading-none block">
              Candidate Portal
            </span>
            <span className="text-[11px] text-muted-foreground">
              Government of Maharashtra &middot; MSInS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/std/dashboard')}
            className="text-xs gap-1.5 hidden sm:flex"
          >
            Go to Dashboard
            <ArrowRight className="size-3.5" />
          </Button>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 flex flex-col items-center justify-center">
        <ProfileForm onSaved={handleSaved} showOnboardingBanner />
      </main>
    </div>
  )
}
