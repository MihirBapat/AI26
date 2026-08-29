import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Landmark, CheckCircle2 } from 'lucide-react'

export function GovRegister() {
  const [formData, setFormData] = useState({
    fullName: '',
    adminId: '',
    email: '',
    password: '',
    confirmPassword: '',
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
          <p className="text-muted-foreground mb-8">Register your official credentials to access the platform.</p>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">Full Name</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="e.g. Anjali Sharma"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">Password</label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">Confirm</label>
                <input
                  type="password"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity mt-6"
            >
              Sign Up
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
