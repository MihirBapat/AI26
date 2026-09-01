/**
 * ProfileForm — reusable candidate profile edit form.
 * Used both on the onboarding page (/std/profile) and inside the dashboard sidebar.
 *
 * Props:
 *   onSaved(isNew: boolean) — called after a successful save.
 *     isNew = true if this was the first POST (profile created for the first time).
 */
import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import {
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  ShieldCheck,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/lib/api'

// ─── Constants ────────────────────────────────────────────────────────────────
const MAHARASHTRA_DISTRICTS = [
  'Ahmednagar', 'Akola', 'Amravati', 'Chhatrapati Sambhajinagar', 'Beed', 'Bhandara',
  'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon',
  'Jalna', 'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nanded',
  'Nandurbar', 'Nashik', 'Dharashiv', 'Palghar', 'Parbhani', 'Pune', 'Raigad',
  'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha',
  'Washim', 'Yavatmal',
]

const EDUCATION_LEVELS = [
  'Below 10th', '10th Pass', '12th Pass', 'ITI/Diploma', 'Graduate', 'Postgraduate',
]

const PRIMARY_GOALS = [
  { value: 'further_education', label: 'I want to study further' },
  { value: 'skill_development_course', label: 'I want to learn a job skill' },
  { value: 'looking_for_job', label: 'I am looking for a job now' },
  { value: 'undecided', label: 'I am not sure yet (Help me decide)' },
]

const LANGUAGES = [
  { value: 'mr', label: 'Marathi (मराठी)' },
  { value: 'hi', label: 'Hindi (हिंदी)' },
  { value: 'en', label: 'English' },
]

// ─── Props ────────────────────────────────────────────────────────────────────
interface ProfileFormProps {
  /** Called after a successful save. isNew = true on first-time creation */
  onSaved?: (isNew: boolean) => void
  /** Optional cancel callback to exit edit mode */
  onCancel?: () => void
  /** When true, shows the "Complete your profile first" onboarding banner */
  showOnboardingBanner?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ProfileForm({ onSaved, onCancel, showOnboardingBanner = false }: ProfileFormProps) {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [hasExistingProfile, setHasExistingProfile] = useState(false)
  const [sectors, setSectors] = useState<{ id: number; name: string }[]>([])
  const [selectedSector, setSelectedSector] = useState<string>('')
  const [customSector, setCustomSector] = useState<string>('')

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    age: '',
    district: 'Pune',
    primary_goal: 'undecided',
    current_education_level: '',
    field_of_interest: '',
    current_skills: '',
    preferred_language: 'mr',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Fetch sectors for field-of-interest dropdown
      let sectorList: { id: number; name: string }[] = []
      try {
        sectorList = await apiFetch<{ id: number; name: string }[]>('/lookups/sectors')
        setSectors(sectorList)
      } catch {
        // non-fatal — dropdown still works with empty sectors
      }

      // Fetch existing candidate profile
      try {
        const data = await apiFetch<any>('/candidate/profile')
        if (data && data.id) {
          setHasExistingProfile(true)
          const fieldInterest = data.field_of_interest || ''
          const isDbSector = sectorList.some(
            (s) => s.name.toLowerCase() === fieldInterest.toLowerCase(),
          )
          if (isDbSector) {
            setSelectedSector(fieldInterest)
            setCustomSector('')
          } else if (fieldInterest) {
            setSelectedSector('other')
            setCustomSector(fieldInterest)
          }
          setFormData({
            full_name: data.full_name || user?.full_name || '',
            age: data.age ? data.age.toString() : '',
            district: data.district || 'Pune',
            primary_goal: data.primary_goal || 'undecided',
            current_education_level: data.current_education_level || '',
            field_of_interest: fieldInterest,
            current_skills: data.current_skills || '',
            preferred_language: data.preferred_language || 'mr',
          })
        }
      } catch (err: any) {
        if (err?.status !== 404) console.error('Failed to fetch profile:', err)
        setHasExistingProfile(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value || '' }))
  }

  const handleSectorSelect = (val: string | null) => {
    const v = val || ''
    setSelectedSector(v)
    if (v !== 'other') {
      setCustomSector('')
      setFormData((prev) => ({ ...prev, field_of_interest: v }))
    } else {
      setFormData((prev) => ({ ...prev, field_of_interest: customSector }))
    }
  }

  const handleCustomSectorChange = (val: string) => {
    setCustomSector(val)
    setFormData((prev) => ({ ...prev, field_of_interest: val }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!formData.district) {
      setMessage({ type: 'error', text: 'Please select your district.' })
      return
    }
    setSaving(true)
    setMessage(null)
    const payload = { ...formData, age: formData.age ? parseInt(formData.age, 10) : null }
    try {
      if (hasExistingProfile) {
        await apiFetch('/candidate/profile', { method: 'PUT', body: JSON.stringify(payload) })
      } else {
        await apiFetch('/candidate/profile', { method: 'POST', body: JSON.stringify(payload) })
        setHasExistingProfile(true)
      }
      setMessage({ type: 'success', text: 'Profile saved successfully!' })
      onSaved?.(!hasExistingProfile)
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to save profile' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary mr-2" />
        <span className="text-sm">Loading profile…</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl w-full mx-auto">
      {/* Onboarding banner — only shown on first-time profile page */}
      {showOnboardingBanner && !hasExistingProfile && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 flex items-start gap-4">
          <div className="size-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <Sparkles className="size-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">Complete Your Candidate Profile First</h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Before accessing your candidate dashboard, please answer the quick questions below.
              Your responses allow our system to match local district opportunities and career pathways to your goals.
            </p>
          </div>
        </div>
      )}

      {/* User identity card */}
      <div className="rounded-2xl bg-card border border-border p-5 shadow-sm flex items-center gap-4">
        <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl border border-primary/20 shrink-0">
          {formData.full_name?.charAt(0)?.toUpperCase() || user?.full_name?.charAt(0)?.toUpperCase() || 'C'}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-foreground">
              {formData.full_name || user?.full_name || 'Candidate'}
            </span>
            <Badge
              className={
                hasExistingProfile
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-xs'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-xs'
              }
            >
              {hasExistingProfile ? 'Profile Active' : 'Profile Required'}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Mail className="size-3.5" />
              {user?.email}
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-primary" />
              Candidate
            </span>
            {formData.district && (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {formData.district}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* The form */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Profile Details</CardTitle>
          <CardDescription>
            Provide your background and goals to enable accurate career and course matching.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 1. Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="e.g. Rahul Patil"
                  required
                />
              </div>

              {/* 2. Age */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">
                  Age <span className="text-muted-foreground text-xs">(optional)</span>
                </label>
                <Input
                  type="number"
                  min="14"
                  max="100"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="e.g. 21"
                />
              </div>

              {/* 3. District */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">
                  Maharashtra District <span className="text-destructive">*</span>
                </label>
                <Select
                  value={formData.district}
                  onValueChange={(val) => handleInputChange('district', val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select District">
                      {formData.district || 'Select District'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {MAHARASHTRA_DISTRICTS.map((dist) => (
                      <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 4. Primary Goal */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">
                  What are you here for? <span className="text-destructive">*</span>
                </label>
                <Select
                  value={formData.primary_goal}
                  onValueChange={(val) => handleInputChange('primary_goal', val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your goal">
                      {PRIMARY_GOALS.find((g) => g.value === formData.primary_goal)?.label ||
                        formData.primary_goal}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="min-w-[340px]">
                    {PRIMARY_GOALS.map((goal) => (
                      <SelectItem key={goal.value} value={goal.value} className="py-2">
                        {goal.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 5. Education Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">
                  Education Level <span className="text-destructive">*</span>
                </label>
                <Select
                  value={formData.current_education_level}
                  onValueChange={(val) => handleInputChange('current_education_level', val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select education level">
                      {formData.current_education_level || 'Select education level'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_LEVELS.map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 6. Language */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground block">
                  Assistant Language <span className="text-destructive">*</span>
                </label>
                <Select
                  value={formData.preferred_language}
                  onValueChange={(val) => handleInputChange('preferred_language', val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select language">
                      {LANGUAGES.find((l) => l.value === formData.preferred_language)?.label ||
                        formData.preferred_language}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 7. Field of Interest */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground block">
                Field / Work Interest{' '}
                <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <Select value={selectedSector} onValueChange={handleSectorSelect}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an industry sector or field">
                    {selectedSector === 'other'
                      ? 'Other / Custom Field'
                      : selectedSector || 'Select an industry sector or field'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-64 min-w-[380px]">
                  {sectors.map((sec) => (
                    <SelectItem key={sec.id} value={sec.name} className="py-2">
                      {sec.name}
                    </SelectItem>
                  ))}
                  <SelectItem
                    value="other"
                    className="py-2 font-medium text-primary border-t border-border mt-1"
                  >
                    + Other / Custom Field
                  </SelectItem>
                </SelectContent>
              </Select>

              {selectedSector === 'other' && (
                <div className="pt-1 space-y-1.5 animate-in fade-in-50 slide-in-from-top-1 duration-200">
                  <label className="text-xs text-muted-foreground font-medium">
                    Specify your custom field / domain:
                  </label>
                  <Input
                    value={customSector}
                    onChange={(e) => handleCustomSectorChange(e.target.value)}
                    placeholder="e.g. Artificial Intelligence, Renewable Energy…"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Current skills */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block">
                Current Skills{' '}
                <span className="text-muted-foreground text-xs">(optional)</span>
              </label>
              <Input
                value={formData.current_skills}
                onChange={(e) => handleInputChange('current_skills', e.target.value)}
                placeholder="e.g. Basic Computer, MS Excel, Welding, Python…"
              />
            </div>

            {/* Feedback message */}
            {message && (
              <div
                className={`p-3.5 rounded-xl flex items-center gap-2 text-sm font-medium ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-destructive/10 text-destructive border border-destructive/20'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="size-4 shrink-0" />
                ) : (
                  <AlertCircle className="size-4 shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            {/* Submit & Cancel actions */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                * Data is stored securely under Maharashtra State guidelines.
              </p>
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={saving}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={saving} className="w-full sm:w-auto gap-2">
                  {saving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      <span>{hasExistingProfile ? 'Save & Update Profile' : 'Save & Continue'}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
