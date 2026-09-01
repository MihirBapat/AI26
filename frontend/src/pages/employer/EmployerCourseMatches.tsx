import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap,
  Briefcase,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { EmployerLayout } from '@/components/employer/EmployerLayout'
import { CourseMatchCard } from '@/components/employer/CourseMatchCard'
import { SkillGapVisualizer } from '@/components/employer/SkillGapVisualizer'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button, buttonVariants } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  getEmployerJobs,
  getJobCourseMatches,
  getJobSkillGap,
  createEmployerValidation,
} from '@/lib/employer-api'
import type {
  JobPostingListItem,
  JobCourseMatchesResponse,
  SkillGapResponse,
  CourseMatchItem,
} from '@/types/employer'

export function EmployerCourseMatches() {
  const [jobs, setJobs] = useState<JobPostingListItem[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string>('')
  const [matchesData, setMatchesData] = useState<JobCourseMatchesResponse | null>(null)
  const [gapData, setGapData] = useState<SkillGapResponse | null>(null)

  const [isLoadingJobs, setIsLoadingJobs] = useState(true)
  const [isLoadingMatches, setIsLoadingMatches] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Validation Modal State
  const [selectedCourseForVal, setSelectedCourseForVal] = useState<CourseMatchItem | null>(null)
  const [valStatus, setValStatus] = useState<string>('partially_adequate')
  const [valRating, setValRating] = useState<string>('3')
  const [valFeedback, setValFeedback] = useState<string>('')
  const [valRecommendation, setValRecommendation] = useState<string>('')
  const [isSubmittingVal, setIsSubmittingVal] = useState(false)
  const [valSuccessMsg, setValSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    async function loadJobs() {
      setIsLoadingJobs(true)
      try {
        const res = await getEmployerJobs({ size: 50 })
        setJobs(res.items)
        if (res.items.length > 0) {
          setSelectedJobId(res.items[0].id.toString())
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load jobs list.')
      } finally {
        setIsLoadingJobs(false)
      }
    }
    loadJobs()
  }, [])

  useEffect(() => {
    if (!selectedJobId) return

    async function loadMatches() {
      setIsLoadingMatches(true)
      setErrorMsg(null)
      try {
        const [mRes, gRes] = await Promise.all([
          getJobCourseMatches(selectedJobId, 16),
          getJobSkillGap(selectedJobId),
        ])
        setMatchesData(mRes)
        setGapData(gRes)
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load matching courses for selected job.')
      } finally {
        setIsLoadingMatches(false)
      }
    }

    loadMatches()
  }, [selectedJobId])

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

  return (
    <EmployerLayout
      title="Course Matching & Curriculum Alignment"
      subtitle="Discover and compare Skill India Digital courses according to percentage of job skills taught"
    >
      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {valSuccessMsg && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <span>{valSuccessMsg}</span>
        </div>
      )}

      {/* Vacancy Selector Toolbar */}
      <Card className="border border-border/80 shadow-2xs">
        <CardContent className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Briefcase className="size-4 text-primary" />
            <span>Select Target Vacancy to Match:</span>
          </div>

          <div className="w-full sm:w-[320px]">
            {isLoadingJobs ? (
              <span className="text-xs text-muted-foreground">Loading vacancies...</span>
            ) : jobs.length === 0 ? (
              <Link
                to="/employer/jobs/new"
                className={buttonVariants({ size: 'sm', className: 'w-full text-xs' })}
              >
                Post a Vacancy First
              </Link>
            ) : (
              <Select value={selectedJobId} onValueChange={(val) => setSelectedJobId(val || '')}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Choose a vacancy..." />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id.toString()} className="text-xs">
                      {j.title} ({j.district || 'Maharashtra'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skill Gap Summary */}
      {gapData && (
        <SkillGapVisualizer data={gapData} showRecommendations={false} />
      )}

      {/* Courses List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <GraduationCap className="size-4 text-primary" />
              <span>
                Ranked Skill India Digital Courses ({matchesData?.matched_courses.length ?? 0})
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Evaluated against 1,897 government and partner courses
            </p>
          </div>
        </div>

        {isLoadingMatches ? (
          <div className="p-16 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
            <Loader2 className="size-6 text-primary animate-spin" />
            <span>Evaluating course curriculum against required skills...</span>
          </div>
        ) : !matchesData || matchesData.matched_courses.length === 0 ? (
          <Card className="p-12 text-center text-xs text-muted-foreground space-y-2">
            <GraduationCap className="size-8 text-muted-foreground mx-auto opacity-50" />
            <p className="font-semibold text-foreground">No matching courses found</p>
            <p className="max-w-md mx-auto">
              No existing courses teach these specific skill requirements. You can submit feedback to request curriculum development.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchesData.matched_courses.map((course) => (
              <CourseMatchCard
                key={course.course_id}
                course={course}
                onValidateCourse={(c) => setSelectedCourseForVal(c)}
              />
            ))}
          </div>
        )}
      </div>

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

