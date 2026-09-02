import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, CheckCircle2, Loader2, AlertCircle, Sparkles, Compass, Target, BookOpen, TrendingUp } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { OtpVerificationModal } from '@/components/auth/OtpVerificationModal'

export function StdRegister() {
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

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [tempToken, setTempToken] = useState('')

  const handleAuthSuccess = () => {
    setShowOtpModal(false)
    navigate('/std/profile', { replace: true })
  }

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
      const res = await register(formData.fullName, formData.email, formData.password, 'candidate')
      if (res.requires_otp) {
        setTempToken(res.temp_token)
        setShowOtpModal(true)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please try again.')
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
            Start Your Upskilling Journey.
          </h1>
          <p className="text-primary-foreground/85 text-base mb-10 leading-relaxed">
            Create your candidate profile to map your skills to industry job roles, close competence gaps, and access free certified training courses.
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
            <h2 className="text-3xl font-bold text-foreground mb-2">Create Student Account</h2>
            <p className="text-muted-foreground text-sm">
              Register your details to access career pathways and recommended training
            </p>
          </div>

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
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                placeholder="e.g. Rahul Sharma"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                placeholder="student@example.com"
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
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  placeholder="Min 6 chars"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">Confirm Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity mt-6 flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Register as Candidate</span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/std/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>

      <OtpVerificationModal
        open={showOtpModal}
        email={formData.email}
        tempToken={tempToken}
        purpose="register"
        onSuccess={handleAuthSuccess}
        onCancel={() => setShowOtpModal(false)}
      />
    </div>
  )
}
