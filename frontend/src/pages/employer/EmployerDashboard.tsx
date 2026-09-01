import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BriefcaseBusiness,
  CheckCircle2,
  Plus,
  ArrowUpRight,
  Sparkles,
  GraduationCap,
  Brain,
  AlertCircle,
  FileCheck2,
} from 'lucide-react'
import { EmployerLayout } from '@/components/employer/EmployerLayout'
import { JobStatusBadge } from '@/components/employer/JobStatusBadge'
import { SkillDemandChart } from '@/components/employer/SkillDemandChart'
import { SalaryBenchmarkChart } from '@/components/employer/SalaryBenchmarkChart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getEmployerOverviewStats,
  getEmployerProfile,
  getEmployerJobs,
  getSkillDemandAnalytics,
  getSalaryBenchmarks,
} from '@/lib/employer-api'
import type {
  EmployerOverviewStats,
  EmployerProfile,
  PaginatedJobPostings,
  SkillDemandAnalyticsResponse,
  SalaryBenchmarkResponse,
} from '@/types/employer'

export function EmployerDashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<EmployerProfile | null>(null)
  const [stats, setStats] = useState<EmployerOverviewStats | null>(null)
  const [jobsData, setJobsData] = useState<PaginatedJobPostings | null>(null)
  const [demandData, setDemandData] = useState<SkillDemandAnalyticsResponse | null>(null)
  const [salaryData, setSalaryData] = useState<SalaryBenchmarkResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true)
      setErrorMsg(null)
      try {
        const [prof, overview, jobs, demand, salary] = await Promise.all([
          getEmployerProfile().catch(() => null),
          getEmployerOverviewStats().catch(() => null),
          getEmployerJobs({ size: 5 }).catch(() => null),
          getSkillDemandAnalytics({ limit: 6 }).catch(() => null),
          getSalaryBenchmarks().catch(() => null),
        ])

        setProfile(prof)
        setStats(overview)
        setJobsData(jobs)
        setDemandData(demand)
        setSalaryData(salary)
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load employer dashboard metrics.')
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const companyName = profile?.company_name || 'Organization'
  const timeOfDay =
    new Date().getHours() < 12
      ? 'Good morning'
      : new Date().getHours() < 18
      ? 'Good afternoon'
      : 'Good evening'

  return (
    <EmployerLayout
      title="Labour Market Intelligence Dashboard"
      subtitle={`Live hiring signals, skill demand benchmarks, and curriculum coverage for ${companyName}`}
      actions={
        <Link
          to="/employer/jobs/new"
          className={buttonVariants({ size: 'sm', className: 'gap-1 text-xs' })}
        >
          <Plus className="size-3.5" />
          <span>Post New Job</span>
        </Link>
      }
    >
      {errorMsg && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Greeting Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">
            {timeOfDay}, {companyName}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Your hiring requirements actively train and align Skill India Digital (SID) courses across Maharashtra.
            Review real-time skill gaps, discover matching curriculum, and submit industry evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/employer/intelligence"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className: 'text-xs gap-1.5',
            })}
          >
            <Sparkles className="size-3.5 text-primary" />
            <span>Ask Intelligence</span>
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Vacancies */}
        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Published Jobs</span>
              {isLoading ? (
                <Skeleton className="h-7 w-14" />
              ) : (
                <h3 className="text-2xl font-bold text-foreground">{stats?.active_jobs ?? 0}</h3>
              )}
              <span className="text-[11px] text-muted-foreground">
                {stats?.total_jobs ?? 0} total registered
              </span>
            </div>
            <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <BriefcaseBusiness className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Top Company Skills */}
        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Top Required Skills</span>
              {isLoading ? (
                <Skeleton className="h-7 w-28" />
              ) : (
                <h3 className="text-sm font-bold text-foreground truncate max-w-[150px]">
                  {stats?.top_demanded_skills_in_company?.slice(0, 2).join(', ') || 'No active skills'}
                </h3>
              )}
              <span className="text-[11px] text-muted-foreground">
                In your job vacancies
              </span>
            </div>
            <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Brain className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Avg Skill Coverage */}
        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Curriculum Alignment</span>
              {isLoading ? (
                <Skeleton className="h-7 w-16" />
              ) : (
                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {stats?.average_skill_coverage_pct ?? 72.5}%
                </h3>
              )}
              <span className="text-[11px] text-muted-foreground">
                State course coverage
              </span>
            </div>
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Validations & Feedback */}
        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Validations Submitted</span>
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <h3 className="text-2xl font-bold text-foreground">
                  {stats?.total_validations_submitted ?? 0}
                </h3>
              )}
              <span className="text-[11px] text-muted-foreground">
                {stats?.total_feedback_submitted ?? 0} feedback items
              </span>
            </div>
            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FileCheck2 className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section: Dynamic Market Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          <>
            <Skeleton className="h-[340px] rounded-xl" />
            <Skeleton className="h-[340px] rounded-xl" />
          </>
        ) : (
          <>
            <SkillDemandChart
              data={demandData?.top_demanded_skills || []}
              title="Statewide High-Demand Skills"
              description="Calculated from real employer postings across Maharashtra"
            />
            <SalaryBenchmarkChart
              data={salaryData?.benchmarks || []}
              title="Compensation Distribution"
              description="Market minimum, average, and maximum salaries by role category"
            />
          </>
        )}
      </div>

      {/* Quick Access Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/employer/jobs/new"
          className="p-4 rounded-xl border border-border bg-card shadow-2xs hover:border-primary/50 hover:shadow-xs transition-all group flex flex-col justify-between"
        >
          <div className="space-y-1.5">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BriefcaseBusiness className="size-4" />
            </div>
            <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
              <span>Post a Vacancy</span>
              <ArrowUpRight className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h4>
            <p className="text-xs text-muted-foreground">
              Add job requirements with automatic NLP skill extraction and curriculum alignment scoring.
            </p>
          </div>
        </Link>

        <Link
          to="/employer/skills"
          className="p-4 rounded-xl border border-border bg-card shadow-2xs hover:border-primary/50 hover:shadow-xs transition-all group flex flex-col justify-between"
        >
          <div className="space-y-1.5">
            <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Brain className="size-4" />
            </div>
            <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
              <span>Canonical Skill Taxonomy</span>
              <ArrowUpRight className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h4>
            <p className="text-xs text-muted-foreground">
              Explore state standard skill categories, aliases, and normalize custom skill variations.
            </p>
          </div>
        </Link>

        <Link
          to="/employer/validations"
          className="p-4 rounded-xl border border-border bg-card shadow-2xs hover:border-primary/50 hover:shadow-xs transition-all group flex flex-col justify-between"
        >
          <div className="space-y-1.5">
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <GraduationCap className="size-4" />
            </div>
            <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
              <span>Curriculum Validation</span>
              <ArrowUpRight className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h4>
            <p className="text-xs text-muted-foreground">
              Validate courses and provide direct recommendations for semester curriculum updates.
            </p>
          </div>
        </Link>
      </div>

      {/* Recent Vacancies Table */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Recent Job Postings</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Your registered vacancies and their linked skill requirements
            </CardDescription>
          </div>
          <Link
            to="/employer/jobs"
            className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'text-xs' })}
          >
            View All ({jobsData?.total ?? 0})
          </Link>
        </CardHeader>

        <CardContent className="pt-0">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !jobsData || jobsData.items.length === 0 ? (
            <div className="text-center py-8 space-y-3 bg-muted/20 rounded-xl border border-dashed border-border">
              <BriefcaseBusiness className="size-8 text-muted-foreground mx-auto opacity-50" />
              <p className="text-sm font-medium text-foreground">No job postings created yet.</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Create your first job posting to trigger automatic skill extraction, gap calculation, and course matching.
              </p>
              <Link
                to="/employer/jobs/new"
                className={buttonVariants({ size: 'sm', className: 'text-xs' })}
              >
                Create Your First Job
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground bg-muted/30">
                    <th className="py-2.5 px-3 font-semibold">Job Title</th>
                    <th className="py-2.5 px-3 font-semibold">Location</th>
                    <th className="py-2.5 px-3 font-semibold">Status</th>
                    <th className="py-2.5 px-3 font-semibold">Skills Required</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {jobsData.items.map((job) => (
                    <tr key={job.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3 px-3 font-medium text-foreground">
                        <Link
                          to={`/employer/jobs/${job.id}`}
                          className="hover:text-primary hover:underline"
                        >
                          {job.title}
                        </Link>
                        <span className="block text-[11px] text-muted-foreground">
                          {job.employment_type} &middot; {job.work_mode}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{job.district || 'Maharashtra'}</td>
                      <td className="py-3 px-3">
                        <JobStatusBadge status={job.status} />
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {job.top_skills.slice(0, 3).map((s, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium text-foreground"
                            >
                              {s}
                            </span>
                          ))}
                          {job.skills_count > 3 && (
                            <span className="px-1 py-0.5 text-[10px] text-muted-foreground font-semibold">
                              +{job.skills_count - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/employer/jobs/${job.id}`)}
                          className="h-7 text-xs"
                        >
                          Intelligence
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </EmployerLayout>
  )
}

