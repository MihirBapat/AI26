import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, CheckCircle2, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export function GovLogin() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('official@skillbridge.gov.in')
  const [password, setPassword] = useState('gov@123')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setIsSubmitting(true)

    try {
      const user = await login(email, password)
      if (user.role === 'gov') {
        navigate('/gov/dashboard', { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please verify credentials.')
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
            Full access to platform insights. Monitor high-demand roles, emerging skills, capacity, and course performance.
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

      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          
          <Link to="/" className="inline-flex lg:hidden items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8">
            <ChevronLeft className="size-4 mr-1" />
            Back
          </Link>

          <h2 className="text-3xl font-bold text-foreground mb-2 mt-4">Government Login</h2>
          <p className="text-muted-foreground mb-6">Enter your registered official email and password</p>

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
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="official@skillbridge.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Enter official password"
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
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/gov/register" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </div>

          <div className="mt-8 p-4 rounded-xl border border-primary/20 bg-primary/5 text-sm">
            <p className="font-semibold text-primary mb-1">Development Test Credentials:</p>
            <p className="text-muted-foreground">Email: official@skillbridge.gov.in</p>
            <p className="text-muted-foreground">Password: gov@123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
