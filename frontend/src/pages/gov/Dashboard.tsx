import { useNavigate } from 'react-router-dom'
import { LogOut, UserCheck, ShieldCheck } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/context/AuthContext'

export function GovDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/gov/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      
      <div className="w-full flex justify-between items-center p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
            <UserCheck className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{user?.full_name || 'Government Official'}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                <ShieldCheck className="size-3" />
                GOV
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <button 
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-xl transition-colors shadow-sm"
            title="Sign Out"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      <main className="flex-1 px-6 pb-12 sm:px-12 pt-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">Government Policy &amp; Planning Portal</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Welcome back, <strong className="text-foreground">{user?.full_name}</strong>. Authenticated with backend JWT access token.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
              <h3 className="font-semibold text-lg mb-2 text-card-foreground">Total Candidates</h3>
              <p className="text-4xl font-bold text-primary">24,500</p>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
              <h3 className="font-semibold text-lg mb-2 text-card-foreground">Active Institutes</h3>
              <p className="text-4xl font-bold text-primary">312</p>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
              <h3 className="font-semibold text-lg mb-2 text-card-foreground">Open Vacancies</h3>
              <p className="text-4xl font-bold text-primary">5,280</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
