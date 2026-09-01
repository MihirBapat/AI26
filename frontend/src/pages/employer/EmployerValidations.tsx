import { useState, useEffect } from 'react'
import {
  BadgeCheck,
  Plus,
  Star,
  Calendar,
  AlertCircle,
  Loader2,
  FileCheck2,
  CheckCircle2,
} from 'lucide-react'
import { EmployerLayout } from '@/components/employer/EmployerLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { getEmployerValidations, createEmployerValidation } from '@/lib/employer-api'
import { apiFetch } from '@/lib/api'
import type { EmployerValidationResponse } from '@/types/employer'

interface CourseLookup {
  id: number
  title: string
  sid_course_id?: string
}

export function EmployerValidations() {
  const [validations, setValidations] = useState<EmployerValidationResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // New Validation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [coursesList, setCoursesList] = useState<CourseLookup[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [status, setStatus] = useState<string>('adequate')
  const [rating, setRating] = useState<string>('4')
  const [feedbackText, setFeedbackText] = useState<string>('')
  const [curriculumRec, setCurriculumRec] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const loadValidations = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const data = await getEmployerValidations()
      setValidations(data)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load course validations.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadValidations()

    // Pre-fetch courses for modal selection
    async function loadCourses() {
      try {
        const res = await apiFetch<{ items: CourseLookup[] }>('/courses?limit=100')
        if (res.items) setCoursesList(res.items)
      } catch {
        // Continue gracefully
      }
    }
    loadCourses()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourseId) {
      alert('Please select a course to validate.')
      return
    }

    setIsSubmitting(true)
    try {
      await createEmployerValidation({
        course_id: parseInt(selectedCourseId, 10),
        validation_status: status as any,
        rating: parseInt(rating, 10),
        feedback_text: feedbackText.trim() || undefined,
        curriculum_recommendation: curriculumRec.trim() || undefined,
        industry_relevance_score: parseInt(rating, 10) * 20.0,
      })

      setSuccessMsg('Course validation successfully submitted and recorded!')
      setIsModalOpen(false)
      setSelectedCourseId('')
      setFeedbackText('')
      setCurriculumRec('')
      loadValidations()
    } catch (err: any) {
      alert(err.message || 'Failed to submit validation.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusBadge = (st: string) => {
    switch (st?.toLowerCase()) {
      case 'adequate':
        return <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10">Adequate</Badge>
      case 'partially_adequate':
        return <Badge variant="outline" className="border-amber-500/30 text-amber-600 bg-amber-500/10">Partially Adequate</Badge>
      case 'inadequate':
        return <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/10">Inadequate</Badge>
      case 'obsolete':
        return <Badge variant="outline" className="border-zinc-500/30 text-zinc-500 bg-zinc-500/10">Obsolete</Badge>
      default:
        return <Badge variant="secondary">{st}</Badge>
    }
  }

  return (
    <EmployerLayout
      title="Course Validations & Curriculum Review"
      subtitle="Industry ratings, curriculum adequacy evaluations, and revision proposals submitted by your organization"
      actions={
        <Button size="sm" onClick={() => setIsModalOpen(true)} className="text-xs gap-1.5">
          <Plus className="size-3.5" />
          <span>New Course Validation</span>
        </Button>
      }
    >
      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Validations Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Total Validations</span>
            <h3 className="text-2xl font-bold text-foreground">{validations.length}</h3>
            <span className="text-[11px] text-muted-foreground">Submitted to state evaluators</span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Adequate / Highly Relevant</span>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {validations.filter((v) => v.validation_status === 'adequate').length}
            </h3>
            <span className="text-[11px] text-muted-foreground">Courses meeting industry bar</span>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-2xs">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Revision Proposals</span>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {validations.filter((v) => v.curriculum_recommendation).length}
            </h3>
            <span className="text-[11px] text-muted-foreground">With actionable syllabus edits</span>
          </CardContent>
        </Card>
      </div>

      {/* Validations History List */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Validation Submissions History</CardTitle>
          <CardDescription className="text-xs">
            Direct feedback feeding into the Evaluator Recommendation Portal and DVET curriculum updates
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-16 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-6 text-primary animate-spin" />
              <span>Loading validations...</span>
            </div>
          ) : validations.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <FileCheck2 className="size-10 text-muted-foreground mx-auto opacity-40" />
              <h3 className="text-sm font-semibold text-foreground">No course validations submitted yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Rate Skill India Digital courses to inform government policy on which curricula need practical upgrades or modern tool attachments.
              </p>
              <Button size="sm" onClick={() => setIsModalOpen(true)} className="text-xs">
                Submit Your First Validation
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {validations.map((val) => (
                <div key={val.id} className="p-4 space-y-2 hover:bg-muted/20 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-semibold text-foreground">
                        {val.course_title || `Course ID #${val.course_id}`}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 text-amber-600 font-medium">
                          <Star className="size-3 fill-amber-500 text-amber-500" />
                          {val.rating} / 5 Stars
                        </span>
                        <span>&middot;</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {new Date(val.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(val.validation_status)}
                    </div>
                  </div>

                  {val.feedback_text && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Feedback:</strong> {val.feedback_text}
                    </p>
                  )}

                  {val.curriculum_recommendation && (
                    <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20 text-xs text-primary leading-relaxed">
                      <strong>Curriculum Recommendation:</strong> {val.curriculum_recommendation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Validation Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold flex items-center gap-1.5">
                <BadgeCheck className="size-4 text-primary" />
                <span>Submit Course Validation</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Assess whether a course prepares candidates for real industry employment
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Select Course <span className="text-destructive">*</span></label>
                <Select value={selectedCourseId} onValueChange={(val) => setSelectedCourseId(val || '')}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Choose a course..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {coursesList.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()} className="text-xs">
                        {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Adequacy Evaluation</label>
                <Select value={status} onValueChange={(val) => setStatus(val || 'adequate')}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adequate" className="text-xs">Adequate — Fully Prepares Candidates</SelectItem>
                    <SelectItem value="partially_adequate" className="text-xs">Partially Adequate — Needs Practical Labs</SelectItem>
                    <SelectItem value="inadequate" className="text-xs">Inadequate — Missing Core Requirements</SelectItem>
                    <SelectItem value="obsolete" className="text-xs">Obsolete — Outdated Curriculum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Rating (1 to 5 Stars)</label>
                <Select value={rating} onValueChange={(val) => setRating(val || '4')}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5" className="text-xs">5 Stars — Excellent</SelectItem>
                    <SelectItem value="4" className="text-xs">4 Stars — Good</SelectItem>
                    <SelectItem value="3" className="text-xs">3 Stars — Average</SelectItem>
                    <SelectItem value="2" className="text-xs">2 Stars — Subpar</SelectItem>
                    <SelectItem value="1" className="text-xs">1 Star — Inadequate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Detailed Feedback</label>
                <Textarea
                  placeholder="Share your technical feedback..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="text-xs"
                  rows={3}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Curriculum Revision Recommendation</label>
                <Textarea
                  placeholder="Suggest specific modules or lab hours to add..."
                  value={curriculumRec}
                  onChange={(e) => setCurriculumRec(e.target.value)}
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
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="text-xs gap-1.5"
              >
                {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
                <span>Submit Validation</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </EmployerLayout>
  )
}

