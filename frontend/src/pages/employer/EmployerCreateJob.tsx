import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Sparkles,
  Plus,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Briefcase,
  Check,
  Brain,
} from 'lucide-react'
import { EmployerLayout } from '@/components/employer/EmployerLayout'
import { SkillBadge } from '@/components/employer/SkillBadge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  createEmployerJob,
  extractJobSkills,
} from '@/lib/employer-api'
import { apiFetch } from '@/lib/api'
import type { JobSkillInput } from '@/types/employer'

const DISTRICTS = [
  'Pune', 'Mumbai', 'Mumbai Suburban', 'Nagpur', 'Nashik', 'Thane',
  'Aurangabad', 'Solapur', 'Kolhapur', 'Amravati', 'Nanded', 'Jalgaon',
  'Akola', 'Latur', 'Dhule', 'Ahmednagar', 'Chandrapur', 'Parbhani',
  'Jalna', 'Bhiwandi', 'Sangli', 'Satara', 'Raigad', 'Wardha',
]

interface Sector {
  id: number
  name: string
}

export function EmployerCreateJob() {
  const navigate = useNavigate()

  // Form State
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sectorId, setSectorId] = useState<string>('')
  const [district, setDistrict] = useState('Pune')
  const [employmentType, setEmploymentType] = useState('Full-time')
  const [workMode, setWorkMode] = useState('Hybrid')
  const [minExp, setMinExp] = useState<string>('2')
  const [maxExp, setMaxExp] = useState<string>('5')
  const [minSalary, setMinSalary] = useState<string>('600000')
  const [maxSalary, setMaxSalary] = useState<string>('1200000')
  const [status, setStatus] = useState<'published' | 'draft'>('published')

  // Skills State
  const [skills, setSkills] = useState<JobSkillInput[]>([])
  const [manualSkillName, setManualSkillName] = useState('')

  // UI state
  const [sectors, setSectors] = useState<Sector[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [extractSuccessMsg, setExtractSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const secData = await apiFetch<Sector[]>('/lookups/sectors').catch(() => [])
        setSectors(secData)
      } catch {
        // Continue gracefully
      }
    }
    loadData()
  }, [])

  // Auto NLP Skill Extraction Handler
  const handleExtractSkills = async () => {
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please enter both Job Title and Description before extracting skills.')
      return
    }

    setIsExtracting(true)
    setErrorMsg(null)
    setExtractSuccessMsg(null)

    try {
      const res = await extractJobSkills({
        title: title.trim(),
        description: description.trim(),
      })

      if (res.extracted_skills.length > 0) {
        // Map extracted skills into JobSkillInput format
        const newSkills: JobSkillInput[] = res.extracted_skills.map((s) => ({
          skill_name: s.name,
          requirement_type: s.requirement_type,
          proficiency_level: s.proficiency_level,
          importance_weight: s.importance_weight,
        }))

        // Merge with existing avoiding duplicates
        const existingNames = new Set(skills.map((s) => s.skill_name.toLowerCase()))
        const merged = [...skills]

        for (const ns of newSkills) {
          if (!existingNames.has(ns.skill_name.toLowerCase())) {
            merged.push(ns)
            existingNames.add(ns.skill_name.toLowerCase())
          }
        }

        setSkills(merged)
        setExtractSuccessMsg(
          `Successfully extracted ${res.total_skills_found} skills from job title & description!`
        )
      } else {
        setExtractSuccessMsg(
          'No canonical skills detected. You can add required skills manually below.'
        )
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Skill extraction failed.')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleAddManualSkill = () => {
    const trimmed = manualSkillName.trim()
    if (!trimmed) return

    if (skills.some((s) => s.skill_name.toLowerCase() === trimmed.toLowerCase())) {
      setManualSkillName('')
      return
    }

    setSkills([
      ...skills,
      {
        skill_name: trimmed,
        requirement_type: 'required',
        proficiency_level: 'intermediate',
        importance_weight: 0.8,
      },
    ])
    setManualSkillName('')
  }

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index))
  }

  const toggleRequirementType = (index: number) => {
    setSkills(
      skills.map((s, i) =>
        i === index
          ? {
              ...s,
              requirement_type: s.requirement_type === 'required' ? 'preferred' : 'required',
            }
          : s
      )
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please fill in Job Title and Description.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        sector_id: sectorId ? parseInt(sectorId, 10) : undefined,
        district,
        state: 'Maharashtra',
        employment_type: employmentType,
        work_mode: workMode,
        min_experience_years: minExp ? parseFloat(minExp) : undefined,
        max_experience_years: maxExp ? parseFloat(maxExp) : undefined,
        min_salary: minSalary ? parseFloat(minSalary) : undefined,
        max_salary: maxSalary ? parseFloat(maxSalary) : undefined,
        currency: 'INR',
        status,
        skills: skills.length > 0 ? skills : undefined,
      }

      const created = await createEmployerJob(payload)
      navigate(`/employer/jobs/${created.id}`)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create job posting.')
      setIsSubmitting(false)
    }
  }

  return (
    <EmployerLayout
      title="Create Vacancy"
      subtitle="Publish a new industry job requirement with automated NLP skill extraction"
      actions={
        <Link
          to="/employer/jobs"
          className={buttonVariants({ variant: 'outline', size: 'sm', className: 'gap-1 text-xs' })}
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to Jobs</span>
        </Link>
      }
    >
      {errorMsg && (
        <div className="p-3.5 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {extractSuccessMsg && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <Check className="size-4 shrink-0 text-emerald-600" />
          <span>{extractSuccessMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Core Job Details */}
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">1. Position & Scope</CardTitle>
            <CardDescription className="text-xs">
              Basic role definition, title, sector, and comprehensive job description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Job Title <span className="text-destructive">*</span>
              </label>
              <Input
                required
                placeholder="e.g. Senior Python Backend Developer"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs h-9"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Industry Sector</label>
                <Select value={sectorId} onValueChange={(val) => setSectorId(val || '')}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Select Sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()} className="text-xs">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">District (Location)</label>
                <Select value={district} onValueChange={(val) => setDistrict(val || 'Pune')}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue placeholder="Select District" />
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
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Job Description & Requirements <span className="text-destructive">*</span>
                </label>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleExtractSkills}
                  disabled={isExtracting || !title.trim() || !description.trim()}
                  className="h-7 text-xs gap-1.5 font-medium border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Extracting Skills...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5" />
                      <span>Extract Skills with NLP</span>
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                required
                rows={6}
                placeholder="Paste the full job description, required technical competencies, responsibilities, and preferred qualifications..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs leading-relaxed"
              />
              <p className="text-[11px] text-muted-foreground">
                Tip: Click <strong>"Extract Skills with NLP"</strong> to automatically map canonical skills, weights, and proficiency requirements.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Linked Skills & Competencies */}
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Brain className="size-4 text-purple-600 dark:text-purple-400" />
              <span>2. Technical & Vocational Skills ({skills.length})</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Skills extracted from description or added manually. Click a skill to toggle Required/Preferred.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            {/* Skills chips container */}
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 min-h-[80px] flex flex-wrap gap-2 items-center">
              {skills.length === 0 ? (
                <div className="text-xs text-muted-foreground italic flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" />
                  <span>No skills attached yet. Click "Extract Skills with NLP" above or type below.</span>
                </div>
              ) : (
                skills.map((skill, idx) => (
                  <div key={idx} className="flex items-center">
                    <SkillBadge
                      name={skill.skill_name}
                      requirementType={skill.requirement_type}
                      onRemove={() => handleRemoveSkill(idx)}
                      className="cursor-pointer select-none"
                    />
                    <button
                      type="button"
                      onClick={() => toggleRequirementType(idx)}
                      className="text-[10px] text-muted-foreground hover:text-foreground ml-1 underline decoration-dotted"
                      title="Click to toggle Required/Preferred"
                    >
                      [{skill.requirement_type}]
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Manual skill adder */}
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Add custom skill (e.g. Docker, PostgreSQL, CNC Machining)..."
                value={manualSkillName}
                onChange={(e) => setManualSkillName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddManualSkill()
                  }
                }}
                className="text-xs h-9 flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddManualSkill}
                disabled={!manualSkillName.trim()}
                className="h-9 text-xs gap-1"
              >
                <Plus className="size-3.5" />
                <span>Add Skill</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Employment, Experience & Compensation */}
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">3. Employment & Compensation</CardTitle>
            <CardDescription className="text-xs">
              Experience bands, work mode, and annual compensation brackets in INR
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Employment Type</label>
                <Select value={employmentType} onValueChange={(val) => setEmploymentType(val || 'Full-time')}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time" className="text-xs">Full-time</SelectItem>
                    <SelectItem value="Part-time" className="text-xs">Part-time</SelectItem>
                    <SelectItem value="Contract" className="text-xs">Contract</SelectItem>
                    <SelectItem value="Internship" className="text-xs">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Work Mode</label>
                <Select value={workMode} onValueChange={(val) => setWorkMode(val || 'Hybrid')}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="On-site" className="text-xs">On-site</SelectItem>
                    <SelectItem value="Hybrid" className="text-xs">Hybrid</SelectItem>
                    <SelectItem value="Remote" className="text-xs">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Min Exp (Years)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={minExp}
                  onChange={(e) => setMinExp(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Max Exp (Years)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={maxExp}
                  onChange={(e) => setMaxExp(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Minimum Salary (₹ / Year)</label>
                <Input
                  type="number"
                  min="0"
                  step="10000"
                  placeholder="e.g. 600000"
                  value={minSalary}
                  onChange={(e) => setMinSalary(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Maximum Salary (₹ / Year)</label>
                <Input
                  type="number"
                  min="0"
                  step="10000"
                  placeholder="e.g. 1200000"
                  value={maxSalary}
                  onChange={(e) => setMaxSalary(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStatus('draft')}
            disabled={isSubmitting}
            className="text-xs"
          >
            Save as Draft
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="text-xs gap-1.5 min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Briefcase className="size-3.5" />
                <span>Publish Vacancy</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </EmployerLayout>
  )
}

