import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogOut,
  GraduationCap,
  Sparkles,
  MapPin,
  Target,
  BookOpen,
  Languages,
  Briefcase,
  Loader2,
  CheckCircle2,
  PhoneCall,
  Home,
  User,
  Edit3,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/context/AuthContext'
import { apiFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConsultationPage } from './components/ConsultationPage'
import { ProfileForm } from './components/ProfileForm'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar'

// ─── Types ─────────────────────────────────────────────────────────────────────
interface CandidateProfileData {
  id: string
  user_id: number
  full_name: string | null
  age: number | null
  district: string
  primary_goal: string
  current_education_level: string | null
  field_of_interest: string | null
  current_skills: string | null
  employment_status: string | null
  preferred_course_mode: string
  willing_to_relocate: boolean
  preferred_language: string
}

type SectionId = 'home' | 'consultation' | 'profile'

const GOAL_LABELS: Record<string, string> = {
  further_education: 'Further Education & Studies',
  skill_development_course: 'Learn a Job Skill / Skill Development',
  looking_for_job: 'Direct Job Search',
  undecided: 'Undecided / Career Guidance Needed',
}

const LANGUAGE_LABELS: Record<string, string> = {
  mr: 'Marathi (मराठी)',
  hi: 'Hindi (हिंदी)',
  en: 'English',
}

// ─── Dashboard Home ────────────────────────────────────────────────────────────
function DashboardHome({
  profile,
  onNavigate,
}: {
  profile: CandidateProfileData
  onNavigate: (id: SectionId) => void
}) {
  return (
    <div className="space-y-5">
      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-blue-500/5 border border-primary/20 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl border border-primary/20 shrink-0">
              {profile.full_name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  Welcome, {profile.full_name?.split(' ')[0] || 'Candidate'}!
                </h1>
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-xs">
                  <CheckCircle2 className="size-3 mr-1" />
                  Profile Active
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="size-3.5 text-primary" />
                  {profile.district}, Maharashtra
                </span>
                <span className="flex items-center gap-1">
                  <Languages className="size-3.5" />
                  {LANGUAGE_LABELS[profile.preferred_language] || profile.preferred_language}
                </span>
                {profile.age && <span>Age: {profile.age} yrs</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
              <Target className="size-4 text-primary" />
              Selected Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold text-foreground">
              {GOAL_LABELS[profile.primary_goal] || profile.primary_goal}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Matched against {profile.district} opportunities
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
              <BookOpen className="size-4 text-primary" />
              Education Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold text-foreground">
              {profile.current_education_level || 'Not Specified'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Filters eligible Skill India Digital courses
            </p>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
              <Briefcase className="size-4 text-primary" />
              Field of Interest
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold text-foreground">
              {profile.field_of_interest || 'General / Open'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {profile.current_skills ? `Skills: ${profile.current_skills}` : 'No prior skills specified'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CTA card */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background shadow-sm">
        <CardContent className="py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow">
              <Sparkles className="size-6" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Ready to explore your options?</p>
              <p className="text-sm text-muted-foreground">
                Start an AI voice consultation in Marathi, Hindi, or English
              </p>
            </div>
          </div>
          <Button
            size="lg"
            className="gap-2 shrink-0 shadow-lg shadow-primary/20"
            onClick={() => onNavigate('consultation')}
          >
            <PhoneCall className="size-4" />
            Start Consultation
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Profile Overview View ──────────────────────────────────────────────────
function CandidateProfileOverview({
  profile,
  userEmail,
  onEdit,
}: {
  profile: CandidateProfileData
  userEmail?: string
  onEdit: () => void
}) {
  return (
    <div className="space-y-6 max-w-3xl w-full mx-auto animate-in fade-in duration-200">
      {/* Identity Card */}
      <div className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl border border-primary/20 shrink-0">
            {profile.full_name?.charAt(0)?.toUpperCase() || 'C'}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-foreground">
                {profile.full_name || 'Candidate'}
              </h2>
              <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-xs">
                <CheckCircle2 className="size-3 mr-1" />
                Profile Active
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Mail className="size-3.5" />
                {userEmail}
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-primary" />
                Candidate
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {profile.district}, Maharashtra
              </span>
            </div>
          </div>
        </div>

        {/* Separate Option for Updation */}
        <Button onClick={onEdit} className="gap-2 shrink-0 w-full sm:w-auto">
          <Edit3 className="size-4" />
          <span>Update Profile</span>
        </Button>
      </div>

      {/* Profile Details Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Profile Information</CardTitle>
            <CardDescription className="text-xs">
              Saved background and matching preferences
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5 text-xs">
            <Edit3 className="size-3.5" />
            <span>Edit</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border text-sm">
            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Full Name</span>
              <span className="font-medium text-foreground">{profile.full_name || 'Not provided'}</span>
            </div>

            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Age</span>
              <span className="font-medium text-foreground">{profile.age ? `${profile.age} years` : 'Not specified'}</span>
            </div>

            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Maharashtra District</span>
              <span className="font-medium text-foreground">{profile.district}</span>
            </div>

            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What are you here for?</span>
              <span className="font-medium text-foreground">{GOAL_LABELS[profile.primary_goal] || profile.primary_goal}</span>
            </div>

            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Education Level</span>
              <span className="font-medium text-foreground">{profile.current_education_level || 'Not Specified'}</span>
            </div>

            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preferred Assistant Language</span>
              <span className="font-medium text-foreground">{LANGUAGE_LABELS[profile.preferred_language] || profile.preferred_language}</span>
            </div>

            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Field / Work Interest</span>
              <span className="font-medium text-foreground">{profile.field_of_interest || 'General / Open'}</span>
            </div>

            <div className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Current Skills</span>
              <span className="font-medium text-foreground">{profile.current_skills || 'None specified'}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export function StdDashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<CandidateProfileData | null>(null)
  const [activeSection, setActiveSection] = useState<SectionId>('home')
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  useEffect(() => {
    checkProfileAndLoad()
  }, [])

  const checkProfileAndLoad = async () => {
    try {
      setLoading(true)
      const data = await apiFetch<CandidateProfileData>('/candidate/profile')
      if (!data || !data.id || !data.district) {
        navigate('/std/profile', { replace: true })
        return
      }
      setProfile(data)
    } catch {
      navigate('/std/profile', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  // After a profile update inside the dashboard, re-fetch to sync the header
  const handleProfileSaved = () => {
    checkProfileAndLoad()
    setIsEditingProfile(false)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/std/login')
  }

  const handleNavClick = (section: SectionId) => {
    setActiveSection(section)
    setIsEditingProfile(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="size-8 animate-spin text-primary mr-3" />
        <span className="text-base font-medium">Verifying candidate profile…</span>
      </div>
    )
  }

  if (!profile) return null

  const sectionTitle =
    activeSection === 'home'
      ? 'Dashboard'
      : activeSection === 'consultation'
        ? 'AI Consultation'
        : isEditingProfile
          ? 'Update Profile'
          : 'My Profile'

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b px-2 py-3 mb-2 flex flex-row items-center justify-between group-data-[collapsible=icon]:justify-center min-h-[57px]">
          <div className="flex-1 group-data-[collapsible=icon]:hidden" />
          <SidebarTrigger />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeSection === 'home'}
                    onClick={() => handleNavClick('home')}
                    tooltip="Dashboard"
                  >
                    <Home />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeSection === 'consultation'}
                    onClick={() => handleNavClick('consultation')}
                    tooltip="AI Consultation"
                  >
                    <PhoneCall />
                    <span>AI Consultation</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeSection === 'profile'}
                    onClick={() => handleNavClick('profile')}
                    tooltip="My Profile"
                  >
                    <User />
                    <span>My Profile</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t p-2 mt-auto">
          <div className="flex items-center gap-3 w-full overflow-hidden group-data-[collapsible=icon]:justify-center">
            <div
              className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0"
              title={profile.full_name || user?.full_name || 'Candidate'}
            >
              <GraduationCap className="size-4" />
            </div>
            <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold truncate">
                {profile.full_name || user?.full_name || 'Candidate'}
              </span>
              <span className="text-xs text-muted-foreground truncate">{profile.district}</span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex min-h-16 shrink-0 flex-col sm:flex-row items-start sm:items-center gap-4 border-b px-4 py-3 bg-background">
          <div className="flex items-center w-full sm:w-auto">
            <h1 className="text-lg font-semibold whitespace-nowrap">{sectionTitle}</h1>
          </div>
          <div className="flex-1 flex items-center justify-end gap-2 w-full sm:w-auto">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              title="Sign Out"
            >
              <LogOut className="size-4" />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6 bg-muted/20 flex flex-col">
          <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center">
            {activeSection === 'home' && (
              <DashboardHome
                profile={profile}
                onNavigate={(sec) => {
                  setActiveSection(sec)
                  setIsEditingProfile(false)
                }}
              />
            )}
            {activeSection === 'consultation' && <ConsultationPage />}
            {activeSection === 'profile' && (
              !isEditingProfile ? (
                <CandidateProfileOverview
                  profile={profile}
                  userEmail={user?.email}
                  onEdit={() => setIsEditingProfile(true)}
                />
              ) : (
                <ProfileForm
                  onSaved={handleProfileSaved}
                  onCancel={() => setIsEditingProfile(false)}
                />
              )
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
