import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Building2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { OtpVerificationModal } from '@/components/auth/OtpVerificationModal'

export function EmployerRegister() {
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
    navigate('/employer/dashboard', { replace: true })
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
      const res = await register(formData.fullName, formData.email, formData.password, 'employer')
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
      {/* Left Branding Hero Column */}
      <div className="hidden lg:flex flex-col w-5/12 bg-primary text-primary-foreground p-10 relative">
        <Link
          to="/"
          className="inline-flex items-center text-sm font-medium hover:opacity-80 transition-opacity w-fit mb-16"
        >
          <ChevronLeft className="size-4 mr-1" />
          Back to selection
        </Link>

        <div className="max-w-md mt-8">
          <h1 className="text-4xl font-bold mb-6 leading-tight">
            Employer &amp;<br />Industry Portal.
          </h1>
          <p className="text-primary-foreground/80 text-lg mb-12 leading-relaxed">
            Register your enterprise account to publish job roles, validate vocational courses, and connect with trained talent across Maharashtra.
          </p>

          <div className="space-y-5">
            {[
              'Broadcast company hiring signals and in-demand skills',
              'Collaborate on curriculum updates with vocational institutes',
              'Access real-time salary and labour market benchmarks',
              'Direct placement pipeline for certified candidates',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-primary-foreground/60 shrink-0" />
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-8 border-t border-primary-foreground/20 text-xs text-primary-foreground/70 flex items-center gap-2">
          <Building2 className="size-4 text-primary-foreground/80 shrink-0" />
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

          <h2 className="text-3xl font-bold text-foreground mb-2 mt-4">Register as Employer</h2>
          <p className="text-muted-foreground mb-6">Create an industry partner account</p>

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-start gap-3">
              <AlertCircle className="size-5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground block">
                Company Representative Name / Full Name
              </label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                placeholder="e.g. Talent Acquisition Lead"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground block">Corporate Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                placeholder="hr@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground block">Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  placeholder="Min. 6 chars"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground block">Confirm Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity mt-4 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Register Employer Account</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/employer/login" className="text-primary font-medium hover:underline">
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
