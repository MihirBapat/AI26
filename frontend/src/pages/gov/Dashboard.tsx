import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export function GovDashboard() {
  const navigate = useNavigate()

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    navigate('/gov/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans text-foreground">
      
      <div className="w-full flex justify-end items-center gap-4 p-4">
        <ThemeToggle />

        <button 
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-full transition-colors shadow-sm"
          title="Sign Out"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>

      <main className="flex-1 px-6 pb-12 sm:px-12 pt-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground text-lg">
            Welcome to the Government Portal. From here you can analyze skill development courses, monitor district-level training plans, and review placement metrics.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Total Candidates</h3>
              <p className="text-4xl font-bold text-primary">24,500</p>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Active Institutes</h3>
              <p className="text-4xl font-bold text-primary">312</p>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm">
              <h3 className="font-semibold text-lg mb-2">Open Vacancies</h3>
              <p className="text-4xl font-bold text-primary">5,280</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
