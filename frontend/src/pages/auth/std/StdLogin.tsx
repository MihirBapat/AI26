import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, CheckCircle2, Eye, EyeOff, Loader2, AlertCircle, Sparkles, Compass, Target, BookOpen, TrendingUp } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/lib/api'

export function StdLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setIsSubmitting(true)

    try {
      const user = await login(email, password)
      if (user.role === 'candidate') {
        try {
          const profile = await apiFetch<any>('/candidate/profile')
          if (profile && profile.id && profile.district) {
            navigate('/std/dashboard', { replace: true })
          } else {
            navigate('/std/profile', { replace: true })
          }
        } catch {
          navigate('/std/profile', { replace: true })
        }
      } else if (user.role === 'gov') {
        navigate('/gov/dashboard', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify your student / candidate credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-background font-sans">
      {/* Left Hero Branding Column */}
      <div className="hidden lg:flex flex-col w-5/12 bg-gradient-to-br from-primary/95 via-primary to-primary/80 text-primary-foreground p-10 relative overflow-hidden">
        {/* Background decorative glows */}
        <div className="absolute -top-24 -right-24 size-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-72 bg-black/10 rounded-full blur-3xl pointer-events-none" />

        <Link
          to="/"
          className="inline-flex items-center text-sm font-medium hover:opacity-80 transition-opacity w-fit mb-12 relative z-10"
        >
          <ChevronLeft className="size-4 mr-1" />
          Back to selection
        </Link>

        <div className="max-w-md my-auto relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary-foreground/15 text-primary-foreground px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 backdrop-blur-sm border border-primary-foreground/20">
            <Sparkles className="size-3.5" />
            Candidate &amp; Student Portal
          </div>

          <h1 className="text-4xl font-bold mb-5 leading-tight tracking-tight">
            Navigate Your Career Pathway.
          </h1>
          <p className="text-primary-foreground/85 text-base mb-10 leading-relaxed">
            Bridge your skills with real-time Maharashtra industry demand. Discover personalized career GPS pathways, detect skill gaps, and explore 1,890+ government-aligned courses.
          </p>

          <div className="space-y-4">
            {[
              { icon: Compass, text: 'Personalized Career GPS & Pathway Navigator' },
              { icon: Target, text: 'AI Skill Gap Detection for Top Industry Roles' },
              { icon: BookOpen, text: 'Direct Access to 1,890+ Skill India Digital Courses' },
              { icon: TrendingUp, text: 'Real-Time Maharashtra District Job Demand & Salaries' },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-center gap-3.5 p-2 rounded-xl hover:bg-primary-foreground/10 transition-colors">
                  <div className="size-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center shrink-0">
                    <Icon className="size-4 text-primary-foreground" />
                  </div>
                  <span className="text-sm font-medium text-primary-foreground/95">{item.text}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-auto pt-8 border-t border-primary-foreground/20 text-xs text-primary-foreground/70 relative z-10 flex items-center gap-2">
          <CheckCircle2 className="size-4 text-primary-foreground/80 shrink-0" />
          Government of Maharashtra &middot; Skill Development Initiative
        </div>
      </div>

      {/* Right Form Column */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <Link
            to="/"
            className="inline-flex lg:hidden items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8"
          >
            <ChevronLeft className="size-4 mr-1" />
            Back
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Candidate Sign In</h2>
            <p className="text-muted-foreground text-sm">
              Enter your registered candidate email and password to access your career dashboard
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-start gap-3">
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground block">Password</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity mt-4 flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Student Portal</span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            New to the platform?{' '}
            <Link to="/std/register" className="text-primary font-medium hover:underline">
              Create a free candidate account
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
