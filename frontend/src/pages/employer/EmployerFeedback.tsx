import { useState, useEffect } from 'react'
import {
  MessageSquareText,
  Plus,
  Send,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { EmployerLayout } from '@/components/employer/EmployerLayout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { getEmployerFeedback, createEmployerFeedback } from '@/lib/employer-api'
import type { EmployerFeedbackResponse } from '@/types/employer'

const DISTRICTS = [
  'Pune', 'Mumbai', 'Mumbai Suburban', 'Nagpur', 'Nashik', 'Thane',
  'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Nanded', 'Jalgaon',
  'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani',
]

export function EmployerFeedback() {
  const [feedbackList, setFeedbackList] = useState<EmployerFeedbackResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Feedback Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [category, setCategory] = useState('emerging_skill')
  const [subject, setSubject] = useState('')
  const [district, setDistrict] = useState('Pune')
  const [detailedComments, setDetailedComments] = useState('')
  const [interventions, setInterventions] = useState('')
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'critical'>('high')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const loadFeedback = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const data = await getEmployerFeedback()
      setFeedbackList(data)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load feedback.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFeedback()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !detailedComments.trim()) {
      alert('Please fill in Subject and Detailed Comments.')
      return
    }

    setIsSubmitting(true)
    try {
      await createEmployerFeedback({
        feedback_category: category,
        subject: subject.trim(),
        district,
        detailed_comments: detailedComments.trim(),
        proposed_interventions: interventions.trim() || undefined,
        urgency_level: urgency,
      })

      setSuccessMsg('Feedback successfully transmitted to state skill planners!')
      setIsModalOpen(false)
      setSubject('')
      setDetailedComments('')
      setInterventions('')
      loadFeedback()
    } catch (err: any) {
      alert(err.message || 'Failed to submit feedback.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getUrgencyBadge = (urg: string) => {
    switch (urg?.toLowerCase()) {
      case 'critical':
        return <Badge variant="outline" className="border-destructive/40 text-destructive bg-destructive/10 font-semibold">Critical</Badge>
      case 'high':
        return <Badge variant="outline" className="border-orange-500/40 text-orange-600 bg-orange-500/10 font-semibold">High</Badge>
      case 'medium':
        return <Badge variant="outline" className="border-amber-500/40 text-amber-600 bg-amber-500/10 font-semibold">Medium</Badge>
      case 'low':
      default:
        return <Badge variant="outline" className="border-zinc-500/40 text-zinc-500 bg-zinc-500/10 font-semibold">Low</Badge>
    }
  }

  return (
    <EmployerLayout
      title="Industry Feedback & Policy Dialogue"
      subtitle="Direct line to Government of Maharashtra, DVET, and training institutes for infrastructure and skill priorities"
      actions={
        <Button size="sm" onClick={() => setIsModalOpen(true)} className="text-xs gap-1.5">
          <Plus className="size-3.5" />
          <span>Submit New Feedback</span>
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

      {/* Feedback Submissions List */}
      <Card className="border border-border/80 shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Submitted Feedback & Policy Inputs</CardTitle>
          <CardDescription className="text-xs">
            Submissions reviewed by government evaluators during semester planning and capacity allocation
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-16 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-6 text-primary animate-spin" />
              <span>Loading feedback submissions...</span>
            </div>
          ) : feedbackList.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <MessageSquareText className="size-10 text-muted-foreground mx-auto opacity-40" />
              <h3 className="text-sm font-semibold text-foreground">No feedback submissions yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Flag missing infrastructure, surge in emerging tech (like EV or AI), or trainer shortages directly to state policy makers.
              </p>
              <Button size="sm" onClick={() => setIsModalOpen(true)} className="text-xs">
                Submit Your First Feedback
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {feedbackList.map((item) => (
                <div key={item.id} className="p-4 space-y-2.5 hover:bg-muted/20 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-semibold text-foreground">{item.subject}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground capitalize">
                          {item.feedback_category.replace('_', ' ')}
                        </span>
                        <span>&middot;</span>
                        <span>{item.district || 'Maharashtra'}</span>
                        <span>&middot;</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getUrgencyBadge(item.urgency_level)}
                    </div>
                  </div>

                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-line">
                    {item.detailed_comments}
                  </p>

                  {item.proposed_interventions && (
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 text-xs text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">Proposed Interventions:</strong>{' '}
                      {item.proposed_interventions}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Feedback Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold flex items-center gap-1.5">
                <MessageSquareText className="size-4 text-primary" />
                <span>Submit Policy / Infrastructure Feedback</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                Communicate skill development gaps, trainer requirements, or equipment upgrades directly to state authorities
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-foreground">Feedback Category</label>
                <Select value={category} onValueChange={(val) => setCategory(val || 'emerging_skill')}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="emerging_skill" className="text-xs">Emerging Skill Surge (e.g. EV, AI)</SelectItem>
                    <SelectItem value="equipment_infrastructure" className="text-xs">Equipment / Lab Infrastructure</SelectItem>
                    <SelectItem value="trainer_quality" className="text-xs">Trainer Capacity & Modern Tools</SelectItem>
                    <SelectItem value="candidate_readiness" className="text-xs">Candidate Soft Skills & Practical Readiness</SelectItem>
                    <SelectItem value="obsolete_skill" className="text-xs">Outdated / Oversupplied Curriculum</SelectItem>
                    <SelectItem value="skill_gap" className="text-xs">General Skill Gap</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Subject / Headline <span className="text-destructive">*</span></label>
                <Input
                  required
                  placeholder="e.g. Urgent need for 5-Axis CNC Machining training in Chakan industrial area"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Target District</label>
                  <Select value={district} onValueChange={(val) => setDistrict(val || 'Pune')}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DISTRICTS.map((d) => (
                        <SelectItem key={d} value={d} className="text-xs">
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-foreground">Urgency Level</label>
                  <Select value={urgency} onValueChange={(val) => setUrgency(val as any || 'high')}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low" className="text-xs">Low — Informational</SelectItem>
                      <SelectItem value="medium" className="text-xs">Medium — Next Academic Cycle</SelectItem>
                      <SelectItem value="high" className="text-xs">High — Immediate Hiring Need</SelectItem>
                      <SelectItem value="critical" className="text-xs">Critical — Severe Industrial Shortage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Detailed Comments & Evidence <span className="text-destructive">*</span></label>
                <Textarea
                  required
                  placeholder="Describe the hiring context, numbers of open vacancies impacted, and why existing programs are insufficient..."
                  value={detailedComments}
                  onChange={(e) => setDetailedComments(e.target.value)}
                  className="text-xs leading-relaxed"
                  rows={4}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-foreground">Proposed Interventions</label>
                <Textarea
                  placeholder="e.g. Establish a public-private CoE or introduce a 3-month bridge certification..."
                  value={interventions}
                  onChange={(e) => setInterventions(e.target.value)}
                  className="text-xs"
                  rows={2}
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
                <Send className="size-3.5" />
                <span>Submit Feedback</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </EmployerLayout>
  )
}

