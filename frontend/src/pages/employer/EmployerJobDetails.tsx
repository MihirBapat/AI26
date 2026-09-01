import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Trash2,
  Brain,
  GraduationCap,
  TrendingUp,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { EmployerLayout } from '@/components/employer/EmployerLayout'
import { JobStatusBadge } from '@/components/employer/JobStatusBadge'
import { SkillBadge } from '@/components/employer/SkillBadge'
import { SkillGapVisualizer } from '@/components/employer/SkillGapVisualizer'
import { CourseMatchCard } from '@/components/employer/CourseMatchCard'
import { SalaryBenchmarkChart } from '@/components/employer/SalaryBenchmarkChart'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  getEmployerJob,
  getJobSkillGap,
  getJobCourseMatches,
  getSalaryBenchmarks,
  publishEmployerJob,
  closeEmployerJob,
  deleteEmployerJob,
  createEmployerValidation,
} from '@/lib/employer-api'
import type {
  JobPostingResponse,
  SkillGapResponse,
  JobCourseMatchesResponse,
  SalaryBenchmarkResponse,
  CourseMatchItem,
} from '@/types/employer'

export function EmployerJobDetails() {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()

  const [job, setJob] = useState<JobPostingResponse | null>(null)
  const [gapData, setGapData] = useState<SkillGapResponse | null>(null)
  const [coursesData, setCoursesData] = useState<JobCourseMatchesResponse | null>(null)
  const [salaryData, setSalaryData] = useState<SalaryBenchmarkResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Validation Modal State
  const [selectedCourseForVal, setSelectedCourseForVal] = useState<CourseMatchItem | null>(null)
  const [valStatus, setValStatus] = useState<string>('partially_adequate')
  const [valRating, setValRating] = useState<string>('3')
  const [valFeedback, setValFeedback] = useState<string>('')
  const [valRecommendation, setValRecommendation] = useState<string>('')
  const [isSubmittingVal, setIsSubmittingVal] = useState(false)
  const [valSuccessMsg, setValSuccessMsg] = useState<string | null>(null)

  const loadJobData = useCallback(async () => {
    if (!jobId) return
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const jobRes = await getEmployerJob(jobId)
      setJob(jobRes)

      // Parallelize intelligence queries
      const [gapRes, courseRes, salRes] = await Promise.all([
        getJobSkillGap(jobId).catch(() => null),
        getJobCourseMatches(jobId, 12).catch(() => null),
        getSalaryBenchmarks(jobRes.district || undefined).catch(() => null),
      ])

      setGapData(gapRes)
      setCoursesData(courseRes)
      setSalaryData(salRes)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load job posting details.')
    } finally {
      setIsLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    loadJobData()
  }, [loadJobData])

  const handlePublish = async () => {
    if (!jobId) return
    try {
      await publishEmployerJob(jobId)
      loadJobData()
    } catch (err: any) {
      alert(err.message || 'Failed to publish job.')
    }
  }

  const handleClose = async () => {
    if (!jobId) return
    try {
      await closeEmployerJob(jobId)
      loadJobData()
    } catch (err: any) {
      alert(err.message || 'Failed to close job.')
    }
  }

  const handleDelete = async () => {
    if (!jobId) return
    if (!window.confirm('Are you sure you want to delete this job posting?')) return
    try {
      await deleteEmployerJob(jobId)
      navigate('/employer/jobs')
    } catch (err: any) {
      alert(err.message || 'Failed to delete job.')
    }
  }

  const handleSubmitValidation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourseForVal) return

    setIsSubmittingVal(true)
    try {
      await createEmployerValidation({
        course_id: selectedCourseForVal.course_id,
        validation_status: valStatus as any,
        rating: parseInt(valRating, 10),
        feedback_text: valFeedback.trim() || undefined,
        curriculum_recommendation: valRecommendation.trim() || undefined,
        industry_relevance_score: selectedCourseForVal.alignment_score,
      })

      setValSuccessMsg(`Validation submitted for "${selectedCourseForVal.title}"!`)
      setSelectedCourseForVal(null)
      setValFeedback('')
      setValRecommendation('')
    } catch (err: any) {
      alert(err.message || 'Failed to submit course validation.')
    } finally {
      setIsSubmittingVal(false)
    }
  }

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return 'Not disclosed'
    if (min && max) return `₹${(min / 100000).toFixed(1)}L - ₹${(max / 100000).toFixed(1)}L / Year`
    if (min) return `From ₹${(min / 100000).toFixed(1)}L / Year`
    return `Up to ₹${(max! / 100000).toFixed(1)}L / Year`
  }

  return (
    <EmployerLayout
      title={job?.title || 'Job Intelligence'}
      subtitle={job ? `${job.company_name || 'Organization'} · ${job.district || 'Maharashtra'}` : undefined}
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/employer/jobs"
            className={buttonVariants({ variant: 'outline', size: 'sm', className: 'h-8 text-xs gap-1' })}
          >
            <ArrowLeft className="size-3.5" />
            <span>All Jobs</span>
          </Link>

          {job?.status === 'draft' && (
            <Button
              size="sm"
              onClick={handlePublish}
              className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle2 className="size-3.5" />
              <span>Publish</span>
            </Button>
          )}

          {job?.status === 'published' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="h-8 text-xs gap-1 text-zinc-600"
            >
              <XCircle className="size-3.5" />
              <span>Close Job</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 text-xs text-destructive hover:bg-destructive/10"
            title="Delete Job"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      }
    >
      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {valSuccessMsg && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{valSuccessMsg}</span>
        </div>
      )}

      {isLoading ? (
        <div className="p-16 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
          <Loader2 className="size-8 text-primary animate-spin" />
          <span>Loading job intelligence and computing skill gap against state courses...</span>
        </div>
      ) : !job ? (
        <Card className="border border-border p-12 text-center text-muted-foreground text-sm">
          Job posting not found.
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Quick Header Summary Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border/80 shadow-2xs text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <JobStatusBadge status={job.status} />

              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="size-3.5 text-primary" />
                <span className="text-foreground font-medium">{job.district || 'Maharashtra'}</span>
              </span>

              <span className="flex items-center gap-1 text-muted-foreground">
                <Briefcase className="size-3.5 text-primary" />
                <span>{job.employment_type} &middot; {job.work_mode}</span>
              </span>

              <span className="text-muted-foreground">
                Salary: <strong className="text-foreground">{formatSalary(job.min_salary, job.max_salary)}</strong>
              </span>
            </div>

            {job.posted_at && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3.5" />
                Posted: {new Date(job.posted_at).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Navigation Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-10">
              <TabsTrigger value="overview" className="gap-1.5 text-xs">
                <Briefcase className="size-3.5" />
                <span>Overview & Skills</span>
              </TabsTrigger>
              <TabsTrigger value="skillgap" className="gap-1.5 text-xs">
                <Brain className="size-3.5" />
                <span>Skill Gap Engine</span>
              </TabsTrigger>
              <TabsTrigger value="courses" className="gap-1.5 text-xs">
                <GraduationCap className="size-3.5" />
                <span>Matched SID Courses ({coursesData?.matched_courses.length ?? 0})</span>
              </TabsTrigger>
              <TabsTrigger value="compensation" className="gap-1.5 text-xs">
                <TrendingUp className="size-3.5" />
                <span>Salary Context</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Overview & Linked Skills */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Job Description & Details */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="border border-border/80 shadow-xs">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">Job Description</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                        {job.description}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Required & Extracted Skills */}
                  <Card className="border border-border/80 shadow-xs">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Brain className="size-4 text-purple-600 dark:text-purple-400" />
                        <span>Mapped Competencies ({job.skills.length})</span>
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Skills extracted and normalized against canonical Maharashtra state taxonomy
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {job.skills.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No skills attached.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {job.skills.map((s) => (
                            <SkillBadge
                              key={s.id}
                              name={s.skill_name}
                              category={s.category}
                              requirementType={s.requirement_type}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Right: Quick Scope Metadata */}
                <div className="space-y-4">
                  <Card className="border border-border/80 shadow-xs">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold">Vacancy Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3 text-xs">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Organization</span>
                        <span className="font-semibold text-foreground">{job.company_name || 'Organization'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Role Category</span>
                        <span className="font-semibold text-foreground">{job.role_category || job.title}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Experience Range</span>
                        <span className="font-semibold text-foreground">
                          {job.min_experience_years || 0} - {job.max_experience_years || '5+'} Years
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Target Region</span>
                        <span className="font-semibold text-foreground">{job.district || 'Maharashtra'}, {job.state}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: Skill Gap Analysis */}
            <TabsContent value="skillgap" className="space-y-6">
              {gapData ? (
                <SkillGapVisualizer data={gapData} />
              ) : (
                <Card className="p-8 text-center text-xs text-muted-foreground">
                  Computing skill gap analysis against 1,897 SID courses...
                </Card>
              )}
            </TabsContent>

            {/* TAB 3: Matched Courses */}
            <TabsContent value="courses" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Ranked Skill India Digital Courses ({coursesData?.matched_courses.length ?? 0})
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Courses evaluated based on percentage of job's required skills taught in curriculum
                  </p>
                </div>
              </div>

              {!coursesData || coursesData.matched_courses.length === 0 ? (
                <Card className="p-12 text-center text-xs text-muted-foreground space-y-2">
                  <GraduationCap className="size-8 text-muted-foreground mx-auto opacity-50" />
                  <p className="font-semibold">No direct course matches found</p>
                  <p>Existing state courses may not yet cover these modern skills. Submit feedback to request curriculum creation.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coursesData.matched_courses.map((c) => (
                    <CourseMatchCard
                      key={c.course_id}
                      course={c}
                      onValidateCourse={(item) => setSelectedCourseForVal(item)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB 4: Salary Context */}
            <TabsContent value="compensation" className="space-y-6">
              <SalaryBenchmarkChart
                data={salaryData?.benchmarks || []}
                title={`Market Compensation in ${job.district || 'Maharashtra'}`}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Course Validation Modal Dialog */}
      <Dialog
        open={!!selectedCourseForVal}
        onOpenChange={(open) => !open && setSelectedCourseForVal(null)}
      >
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmitValidation} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold flex items-center gap-1.5">
                <GraduationCap className="size-4 text-primary" />
                <span>Submit Course Validation</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Provide employer assessment on <strong className="text-foreground">"{selectedCourseForVal?.title}"</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Industry Adequacy Status</label>
                <Select value={valStatus} onValueChange={(val) => setValStatus(val || 'adequate')}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adequate" className="text-xs">Adequate — Fully Job-Ready</SelectItem>
                    <SelectItem value="partially_adequate" className="text-xs">Partially Adequate — Needs Practical Labs</SelectItem>
                    <SelectItem value="inadequate" className="text-xs">Inadequate — Missing Core Requirements</SelectItem>
                    <SelectItem value="obsolete" className="text-xs">Obsolete — Outdated Technologies</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Rating (1 to 5 Stars)</label>
                <Select value={valRating} onValueChange={(val) => setValRating(val || '3')}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5" className="text-xs">5 Stars — Excellent Industry Relevance</SelectItem>
                    <SelectItem value="4" className="text-xs">4 Stars — Good Preparation</SelectItem>
                    <SelectItem value="3" className="text-xs">3 Stars — Moderate Alignment</SelectItem>
                    <SelectItem value="2" className="text-xs">2 Stars — Significant Gaps</SelectItem>
                    <SelectItem value="1" className="text-xs">1 Star — Unusable Curriculum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Feedback Comments</label>
                <Textarea
                  placeholder="Explain specific shortcomings or strengths of this course..."
                  value={valFeedback}
                  onChange={(e) => setValFeedback(e.target.value)}
                  className="text-xs"
                  rows={3}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Curriculum Revision Recommendation</label>
                <Textarea
                  placeholder="e.g. Add 20 hours hands-on Docker and microservice containerization labs..."
                  value={valRecommendation}
                  onChange={(e) => setValRecommendation(e.target.value)}
                  className="text-xs"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedCourseForVal(null)}
                disabled={isSubmittingVal}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingVal}
                className="text-xs gap-1.5"
              >
                {isSubmittingVal && <Loader2 className="size-3.5 animate-spin" />}
                <span>Submit Evaluation</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </EmployerLayout>
  )
}

