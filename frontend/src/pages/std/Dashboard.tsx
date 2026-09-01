import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LogOut,
  GraduationCap,
  MapPin,
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
import { StudentHomeView } from './components/StudentHomeView'
import { CourseCatalogView } from './components/CourseCatalogView'
import { JobMarketView } from './components/JobMarketView'

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

type SectionId = 'home' | 'jobs' | 'courses' | 'consultation' | 'profile'

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

  const [sectors, setSectors] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    checkProfileAndLoad()
    apiFetch<{ id: number; name: string }[]>('/lookups/sectors')
      .then(setSectors)
      .catch(() => {})
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

  // Resolve matching DB sector ID for student's field of interest
  const matchedSector = sectors.find(s => {
    if (!profile.field_of_interest || profile.field_of_interest === 'General / Open') return false
    const fLower = profile.field_of_interest.toLowerCase()
    const sLower = s.name.toLowerCase()
    return sLower === fLower || sLower.includes(fLower) || fLower.includes(sLower)
  })
  const matchedSectorId = matchedSector ? matchedSector.id.toString() : 'all'

  const sectionTitle =
    activeSection === 'home'
      ? 'Dashboard'
      : activeSection === 'jobs'
        ? 'Job Market'
        : activeSection === 'courses'
          ? 'Course Catalog'
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
              <StudentHomeView
                profile={profile}
                onNavigate={(sec) => {
                  setActiveSection(sec)
                  setIsEditingProfile(false)
                }}
              />
            )}
            {activeSection === 'jobs' && (
              <JobMarketView
                initialDistrict={profile.district || 'Pune'}
                initialKeyword={profile.field_of_interest || profile.current_skills || ''}
                onBack={() => setActiveSection('home')}
              />
            )}
            {activeSection === 'courses' && (
              <CourseCatalogView
                initialSectorId={matchedSectorId}
                initialSearch={''}
                onBack={() => setActiveSection('home')}
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
