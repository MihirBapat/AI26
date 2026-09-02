import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Landmark, BookOpen, Briefcase, User, HelpCircle, X, UserCheck, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const ROLES = [
  {
    title: 'Government / Policy Maker',
    description: 'Monitor high-demand roles, emerging skills, capacity, and course performance.',
    icon: Landmark,
    href: '/gov/login',
  },
  {
    title: 'Colleges and Institutes',
    description: 'Analyze industry relevance, skill gaps, and get curriculum recommendations.',
    icon: BookOpen,
    href: '/login',
  },
  {
    title: 'Employer',
    description: 'Validate skills, flag missing requirements, and contribute to demand signals.',
    icon: Briefcase,
    href: '/login',
  },
  {
    title: 'Candidate / Student',
    description: 'Find your career path by identifying skill gaps, exploring courses, and viewing district jobs.',
    icon: User,
    href: '/std/login',
  },
]

export function Home() {
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuth()

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'gov') {
        navigate('/gov/dashboard', { replace: true })
      } else if (user.role === 'candidate') {
        navigate('/std/dashboard', { replace: true })
      } else if (user.role === 'employer') {
        navigate('/employer/dashboard', { replace: true })
      }
    }
  }, [isAuthenticated, user, navigate])

  return (
    <div className="min-h-screen bg-background flex flex-col relative font-sans text-foreground">
      
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3">
        {isAuthenticated && user && (
          <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-full border border-border text-sm">
            <UserCheck className="size-4 text-primary" />
            <span className="font-medium text-foreground">{user.full_name}</span>
            <button
              onClick={() => logout()}
              className="text-muted-foreground hover:text-destructive transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        )}
        <ThemeToggle />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        
        <div className="text-center space-y-6 mb-12 max-w-2xl mx-auto mt-8">
          <p className="text-muted-foreground text-lg sm:text-xl font-medium">
            Bridging the gap between skills and industry-ready careers.
          </p>

          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium border border-primary/20 shadow-sm">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-primary"></span>
            </span>
            Maharashtra Skill Development Initiative
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-semibold text-primary mb-8 text-center">
          Who are you logging in as?
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-4xl">
          {ROLES.map((roleItem) => {
            const Icon = roleItem.icon
            return (
              <Link
                key={roleItem.title}
                to={roleItem.href}
                className="flex flex-col p-6 sm:p-8 rounded-2xl border-2 border-border bg-card shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary"
              >
                <div className="size-12 rounded-full flex items-center justify-center mb-6 bg-primary/10 text-primary shadow-sm">
                  <Icon className="size-6" />
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-3">
                  {roleItem.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {roleItem.description}
                </p>
              </Link>
            )
          })}
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground px-4">
        <p>Government of Maharashtra &middot; Maharashtra State Innovation Society, Department of Skills, Employment, Entrepreneurship and Innovation</p>
      </footer>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        {isHelpOpen && (
          <div className="w-72 sm:w-80 p-5 sm:p-6 rounded-2xl bg-card border-2 border-border shadow-xl animate-in slide-in-from-bottom-2 fade-in duration-200">
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-semibold text-primary">About This Platform</h4>
              <button onClick={() => setIsHelpOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Skill-development programs often lag behind current industry needs. This platform solves this by using real-time market data to align curricula, improve capacity planning, and guide candidates towards high-demand, future-ready careers.
            </p>
          </div>
        )}
        
        <button 
          onClick={() => setIsHelpOpen(!isHelpOpen)}
          className="p-3 bg-primary text-primary-foreground rounded-full shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Help"
        >
          <HelpCircle className="size-6" />
        </button>
      </div>
    </div>
  )
}
