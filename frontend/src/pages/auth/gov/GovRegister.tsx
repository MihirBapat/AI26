import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function GovRegister() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    if (formData.password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.')
      return
    }

    setIsSubmitting(true)

    try {
      await register(formData.fullName, formData.email, formData.password, 'gov')
      navigate('/gov/dashboard', { replace: true })
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex w-full bg-background font-sans">
      
      <div className="hidden lg:flex flex-col w-5/12 bg-primary text-primary-foreground p-10 relative">
        <Link to="/" className="inline-flex items-center text-sm font-medium hover:opacity-80 transition-opacity w-fit mb-16">
          <ChevronLeft className="size-4 mr-1" />
          Back to selection
        </Link>
        
        <div className="max-w-md mt-8">
          <h1 className="text-4xl font-bold mb-6 leading-tight">
            Government &amp;<br />Policy Portal.
          </h1>
          <p className="text-primary-foreground/80 text-lg mb-12 leading-relaxed">
            Register for full access to platform insights. Monitor high-demand roles, emerging skills, capacity, and course performance.
          </p>

          <div className="space-y-5">
            {[
              'Monitor district-level training plans',
              'Industry demand analytics & trends',
              'Skill gap analysis across Maharashtra',
              'Analyze skill development courses',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-primary-foreground/60" />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          
          <Link to="/" className="inline-flex lg:hidden items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8">
            <ChevronLeft className="size-4 mr-1" />
            Back
          </Link>

          <h2 className="text-3xl font-bold text-foreground mb-2 mt-4">Government Registration</h2>
          <p className="text-muted-foreground mb-6">Register your official credentials to access the platform.</p>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-start gap-3">
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">Full Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="e.g. Dr. Anjali Sharma"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">Official Email</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="official@skillbridge.gov.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">Confirm Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register Government Account</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/gov/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
