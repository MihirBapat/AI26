import { useState, useEffect } from 'react'
import {
  Mail,
  ShieldCheck,
  CheckCircle2,
  Save,
  Loader2,
  AlertCircle
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

interface MyProfileViewProps {
  selectedDistrict: string
}

const MAHARASHTRA_DISTRICTS = [
  'Ahmednagar', 'Akola', 'Amravati', 'Chhatrapati Sambhajinagar', 'Beed', 'Bhandara', 'Buldhana', 
  'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur', 
  'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 
  'Dharashiv', 'Palghar', 'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara', 
  'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal'
]

const EDUCATION_LEVELS = [
  'Below 10th',
  '10th Pass',
  '12th Pass',
  'ITI/Diploma',
  'Graduate',
  'Postgraduate'
]

const PRIMARY_GOALS = [
  { value: 'further_education', label: 'I want to study further' },
  { value: 'skill_development_course', label: 'I want to learn a job skill' },
  { value: 'looking_for_job', label: 'I am looking for a job now' },
  { value: 'undecided', label: 'I am not sure yet' }
]

const LANGUAGES = [
  { value: 'mr', label: 'Marathi' },
  { value: 'hi', label: 'Hindi' },
  { value: 'en', label: 'English' }
]

export function MyProfileView({ selectedDistrict }: MyProfileViewProps) {
  const { user } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [hasExistingProfile, setHasExistingProfile] = useState(false)

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    age: '',
    district: selectedDistrict || 'Pune',
    primary_goal: 'undecided',
    current_education_level: '',
    field_of_interest: '',
    current_skills: '',
    preferred_language: 'mr'
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const data = await apiFetch<any>('/candidate/profile')
      if (data && data.id) {
        setHasExistingProfile(true)
        setFormData({
          full_name: data.full_name || '',
          age: data.age?.toString() || '',
          district: data.district || 'Pune',
          primary_goal: data.primary_goal || 'undecided',
          current_education_level: data.current_education_level || '',
          field_of_interest: data.field_of_interest || '',
          current_skills: data.current_skills || '',
          preferred_language: data.preferred_language || 'mr'
        })
      }
    } catch (err: any) {
      if (err.status !== 404) {
        console.error("Failed to fetch profile:", err)
      }
      setHasExistingProfile(false)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | null) => {
    setFormData(prev => ({ ...prev, [field]: value || '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const payload = {
      ...formData,
      age: formData.age ? parseInt(formData.age, 10) : null
    }

    try {
      if (hasExistingProfile) {
        await apiFetch('/candidate/profile', {
          method: 'PUT',
          body: JSON.stringify(payload)
        })
      } else {
        await apiFetch('/candidate/profile', {
          method: 'POST',
          body: JSON.stringify(payload)
        })
        setHasExistingProfile(true)
      }
      setMessage({ type: 'success', text: 'Profile saved successfully!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save profile' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="size-6 animate-spin mr-2" />
        Loading profile...
      </div>
    )
  }

  const isProfileComplete = hasExistingProfile && formData.age && formData.current_education_level;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Profile Header */}
      <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl border border-primary/20 shrink-0">
              {formData.full_name?.charAt(0) || user?.full_name?.charAt(0) || 'S'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  {formData.full_name || user?.full_name || 'Candidate'}
                </h1>
                <Badge className={isProfileComplete ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-xs" : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-xs"}>
                  {isProfileComplete ? 'Profile Complete' : 'Profile Incomplete'}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="size-3.5" />
                  {user?.email}
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="size-3.5 text-primary" />
                  Candidate Student
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <Card className="border-border shadow-sm max-w-3xl">
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
          <CardDescription>
            Help us understand your background to provide better career recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <Input 
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="e.g. Rahul Patil"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Age</label>
                <Input 
                  type="number"
                  min="14"
                  max="100"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="e.g. 21"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">District</label>
                <Select value={formData.district} onValueChange={(val) => handleInputChange('district', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAHARASHTRA_DISTRICTS.map(dist => (
                      <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">What are you here for?</label>
                <Select value={formData.primary_goal} onValueChange={(val) => handleInputChange('primary_goal', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIMARY_GOALS.map(goal => (
                      <SelectItem key={goal.value} value={goal.value}>{goal.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Current Education Level</label>
                <Select value={formData.current_education_level} onValueChange={(val) => handleInputChange('current_education_level', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select education level" />
                  </SelectTrigger>
                  <SelectContent>
                    {EDUCATION_LEVELS.map(lvl => (
                      <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Preferred AI Language</label>
                <Select value={formData.preferred_language} onValueChange={(val) => handleInputChange('preferred_language', val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map(lang => (
                      <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">What field or work interests you?</label>
              <Input 
                value={formData.field_of_interest}
                onChange={(e) => handleInputChange('field_of_interest', e.target.value)}
                placeholder="e.g. IT, Manufacturing, Healthcare... (optional)"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Any skills you already have?</label>
              <Input 
                value={formData.current_skills}
                onChange={(e) => handleInputChange('current_skills', e.target.value)}
                placeholder="e.g. Basic Computer, Welding, Python... (optional)"
              />
            </div>

            {message && (
              <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
              }`}>
                {message.type === 'success' ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
                {message.text}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin mr-2" />}
                {saving ? 'Saving...' : 'Save Profile'}
                {!saving && <Save className="size-4 ml-2" />}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
