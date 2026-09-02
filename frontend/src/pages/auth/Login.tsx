import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'
import type { User } from '@/context/AuthContext'
import { AlertCircle, Loader2 } from 'lucide-react'
import { OtpVerificationModal } from '@/components/auth/OtpVerificationModal'

export function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [tempToken, setTempToken] = useState('')

  const handleAuthSuccess = (user: User) => {
    setShowOtpModal(false)
    if (user.role === 'gov') {
      navigate('/gov/dashboard', { replace: true })
    } else if (user.role === 'employer') {
      navigate('/employer/dashboard', { replace: true })
    } else if (user.role === 'candidate') {
      navigate('/std/dashboard', { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setIsSubmitting(true)

    try {
      const res = await login(email, password)
      if (res.requires_otp) {
        setTempToken(res.temp_token)
        setShowOtpModal(true)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-sans">
      <Card className="w-full max-w-md shadow-md border border-border">
        <CardHeader>
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>Welcome back! Enter your credentials to access your portal.</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground block">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground block">
                Password
              </label>
              <Input
                id="password"
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 mt-2">
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
            
            <div className="w-full pt-1 border-t border-border/60 text-center">
              <button
                type="button"
                onClick={() => {
                  setEmail('employer@skillbridge.gov.in')
                  setPassword('employer@123')
                }}
                className="text-xs text-primary/80 hover:text-primary underline cursor-pointer"
              >
                Fill Employer Partner Demo Credentials
              </button>
            </div>

            <div className="text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>

      <OtpVerificationModal
        open={showOtpModal}
        email={email}
        tempToken={tempToken}
        purpose="login"
        onSuccess={handleAuthSuccess}
        onCancel={() => setShowOtpModal(false)}
      />
    </main>
  )
}
