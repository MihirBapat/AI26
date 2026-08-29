import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, CheckCircle2 } from 'lucide-react'

export function GovLogin() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    adminId: '',
    email: '',
    password: '',
  })

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
          <p className="text-muted-foreground mb-8">Enter your Official ID, registered email, and password</p>

          <form className="space-y-5" onSubmit={(e) => {
            e.preventDefault()
            if (
              formData.adminId === 'GOV-001' &&
              formData.email === 'official@skillbridge.gov.in' &&
              formData.password === 'gov@123'
            ) {
              localStorage.setItem('currentUser', JSON.stringify({ role: 'gov', id: formData.adminId }))
              navigate('/gov/dashboard')
            } else {
              alert('Invalid credentials! Please check the demo credentials and try again.')
            }
          }}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">Official ID</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="e.g. GOV-001"
                value={formData.adminId}
                onChange={(e) => setFormData({ ...formData, adminId: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="official@skillbridge.gov.in"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">Password</label>
              <input
                type="password"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Enter official password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity mt-4"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/gov/register" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </div>

          <div className="mt-8 p-4 rounded-xl border border-primary/20 bg-primary/5 text-sm">
            <p className="font-semibold text-primary mb-1">Demo credentials:</p>
            <p className="text-muted-foreground">Official ID: GOV-001</p>
            <p className="text-muted-foreground">Email: official@skillbridge.gov.in</p>
            <p className="text-muted-foreground">Password: gov@123</p>
          </div>
        </div>
      </div>
    </div>
  )
}
