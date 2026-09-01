import { useState, useEffect } from 'react'
import {
  Briefcase,
  GraduationCap,
  Compass,
  MapPin,
  TrendingUp,
  Building2,
  ExternalLink,
  Clock,
  Award,
  PhoneCall,
  Loader2,
  CheckCircle2,
  BookOpen,
  DollarSign,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiFetch } from '@/lib/api'

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

interface Sector {
  id: number
  name: string
}

interface DistrictItem {
  district: string
  total_vacancies: number
  average_salary: number | null
  demand_level: string
}

interface DistrictDemandResponse {
  district: string
  total_vacancies: number
  average_salary: number | null
  top_roles?: string[]
  top_sectors?: string[]
  top_employers?: { canonical_name: string; count: number }[]
  demand_score?: number
  demand_level?: string
}

interface JobItem {
  id: string
  title: string
  company: { display_name: string }
  location: { display_name: string }
  salary_min?: number
  salary_max?: number
  description?: string
  redirect_url: string
  contract_time?: string
}

interface TopCompany {
  company: string
  job_count: number
  avg_salary?: number
}

interface CourseItem {
  id: number
  sid_course_id: string
  title: string
  course_type: string
  duration_minutes?: number | null
  duration?: string | null
  price: number | null
  rating_average: number | null
  certificate_enabled: boolean
  nsqf_level: string | null
  short_description: string | null
  course_url: string | null
  enrollment_count?: number | null
  enrolment_count?: number | null
  provider?: { id: number; name: string } | null
  provider_name?: string | null
}

export function StudentHomeView({
  profile,
  onNavigate,
}: {
  profile: CandidateProfileData
  onNavigate: (section: 'home' | 'jobs' | 'courses' | 'consultation' | 'profile') => void
}) {
  const getInitialGoalMode = (primaryGoal: string): 'job' | 'learn' | 'explore' => {
    if (primaryGoal === 'looking_for_job') return 'job'
    if (primaryGoal === 'skill_development_course' || primaryGoal === 'further_education') return 'learn'
    return 'explore'
  }

  const [activeGoalMode, setActiveGoalMode] = useState<'job' | 'learn' | 'explore'>(() =>
    getInitialGoalMode(profile.primary_goal)
  )

  // 1. Dynamic Districts & Sectors loaded from Backend / Database
  const [districtsList, setDistrictsList] = useState<string[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [selectedSectorId, setSelectedSectorId] = useState<string>('all')
  const [selectedArea, setSelectedArea] = useState<string>(profile.district || 'Pune')

  // 2. Dynamic Labour Demand Metrics (from /jobs/districts/demand API)
  const [demandData, setDemandData] = useState<DistrictDemandResponse | null>(null)
  const [loadingDemand, setLoadingDemand] = useState<boolean>(false)

  // 3. Dynamic Live Jobs (from /jobs/search API)
  const [jobs, setJobs] = useState<JobItem[]>([])
  const [totalJobs, setTotalJobs] = useState<number>(0)
  const [loadingJobs, setLoadingJobs] = useState<boolean>(false)
  const [topEmployers, setTopEmployers] = useState<TopCompany[]>([])

  // 4. Initial Top 6 Recommended Courses State (Never Blank)
  const [topCourses, setTopCourses] = useState<CourseItem[]>([])
  const [totalAvailableCourses, setTotalAvailableCourses] = useState<number>(0)
  const [loadingTopCourses, setLoadingTopCourses] = useState<boolean>(false)

  // Load Districts and Sectors from Backend DB
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [sectorData, heatmapData] = await Promise.all([
          apiFetch<Sector[]>('/lookups/sectors').catch(() => []),
          apiFetch<{ districts: DistrictItem[] }>('/jobs/districts/heatmap').catch(() => ({ districts: [] }))
        ])

        setSectors(sectorData || [])
        if (heatmapData?.districts && heatmapData.districts.length > 0) {
          const names = heatmapData.districts.map(d => d.district).filter(Boolean)
          setDistrictsList(['All Maharashtra', ...names])
        }
      } catch (err) {
        console.error('Failed to load dynamic lookups', err)
      }
    }

    fetchLookups()
  }, [])

  // Resolve active query context
  const activeSectorObj = sectors.find(s => s.id.toString() === selectedSectorId)
  const resolvedSectorName = activeGoalMode === 'explore'
    ? (activeSectorObj ? activeSectorObj.name : '')
    : (profile.field_of_interest || '')

  const resolvedDistrict = activeGoalMode === 'explore'
    ? selectedArea
    : (profile.district || 'Pune')

  // Helper to find matching Sector ID from DB sectors list
  const getMatchedSectorId = (): number | null => {
    if (activeGoalMode === 'explore') {
      if (selectedSectorId !== 'all') {
        const parsed = parseInt(selectedSectorId, 10)
        return isNaN(parsed) ? null : parsed
      }
      return null
    }

    if (!profile.field_of_interest || profile.field_of_interest === 'General / Open') {
      return null
    }

    const fieldLower = profile.field_of_interest.toLowerCase()
    const matched = sectors.find(s => 
      s.name.toLowerCase() === fieldLower ||
      s.name.toLowerCase().includes(fieldLower) ||
      fieldLower.includes(s.name.toLowerCase())
    )

    return matched ? matched.id : null
  }

  // Fetch Labour Demand & Live Jobs from Backend
  useEffect(() => {
    if (activeGoalMode === 'learn') return

    const loadDemandAndJobs = async () => {
      setLoadingDemand(true)
      setLoadingJobs(true)
      try {
        const whereLoc = resolvedDistrict === 'All Maharashtra' ? 'Maharashtra' : resolvedDistrict

        // 1. Fetch District Labour Demand directly from API
        const demandParams = new URLSearchParams()
        demandParams.append('district', whereLoc)
        if (resolvedSectorName && resolvedSectorName !== 'General / Open' && resolvedSectorName !== 'All Sectors') {
          demandParams.append('sector', resolvedSectorName)
        }

        const demandRes = await apiFetch<DistrictDemandResponse>(
          `/jobs/districts/demand?${demandParams.toString()}`
        ).catch(() => null)

        setDemandData(demandRes)

        // 2. Search live jobs strictly matching selected domain / skill
        let searchKeyword = ''
        if (activeGoalMode === 'explore') {
          if (resolvedSectorName && resolvedSectorName !== 'General / Open' && resolvedSectorName !== 'All Sectors') {
            searchKeyword = resolvedSectorName.split('/')[0].split('-')[0].trim()
          }
        } else {
          if (profile.current_skills && profile.current_skills.trim()) {
            searchKeyword = profile.current_skills.split(',')[0].trim()
          } else if (resolvedSectorName && resolvedSectorName !== 'General / Open' && resolvedSectorName !== 'All Sectors') {
            searchKeyword = resolvedSectorName.split('/')[0].split('-')[0].trim()
          }
        }

        const jobQueryParams = new URLSearchParams()
        if (searchKeyword) jobQueryParams.append('what', searchKeyword)
        jobQueryParams.append('where', whereLoc)
        jobQueryParams.append('page', '1')
        jobQueryParams.append('results_per_page', '6')

        const jobRes = await apiFetch<{ results: JobItem[]; total_count?: number; count?: number }>(
          `/jobs/search?${jobQueryParams.toString()}`
        ).catch(() => null)

        const matchingJobs = jobRes?.results || []
        const matchingCount = jobRes?.total_count ?? jobRes?.count ?? matchingJobs.length

        setJobs(matchingJobs)
        setTotalJobs(matchingCount)

        if (matchingJobs.length > 0) {
          const uniqueCompanies = Array.from(
            new Set(matchingJobs.map(j => j.company?.display_name).filter(Boolean))
          )
          setTopEmployers(uniqueCompanies.map(name => ({ company: name as string, job_count: 1 })))
        } else {
          setTopEmployers([])
        }
      } catch (err) {
        console.error('Failed to load dynamic demand and jobs', err)
        setJobs([])
      } finally {
        setLoadingDemand(false)
        setLoadingJobs(false)
      }
    }

    loadDemandAndJobs()
  }, [activeGoalMode, resolvedSectorName, resolvedDistrict, profile.current_skills, sectors])

  // Fetch Initial Top 6 Recommended Courses (Never Blank)
  useEffect(() => {
    if (activeGoalMode === 'job') return

    const loadTop6Courses = async () => {
      setLoadingTopCourses(true)
      try {
        const params = new URLSearchParams()
        params.append('page', '1')
        params.append('size', '6')
        params.append('sort_by', 'enrollment_count')

        const matchedSectorId = getMatchedSectorId()
        if (matchedSectorId) {
          params.append('sector_id', matchedSectorId.toString())
        } else if (profile.current_skills && profile.current_skills.trim()) {
          params.append('search', profile.current_skills.split(',')[0].trim())
        } else if (profile.field_of_interest && profile.field_of_interest !== 'General / Open') {
          params.append('search', profile.field_of_interest.replace(/-.*/, '').trim())
        }

        const res = await apiFetch<{ items: CourseItem[]; total: number }>(
          `/courses?${params.toString()}`
        ).catch(() => null)

        // If specific sector search had no items, fallback to top state courses so it is never blank
        if (!res || !res.items || res.items.length === 0) {
          const fallbackRes = await apiFetch<{ items: CourseItem[]; total: number }>(
            '/courses?page=1&size=6&sort_by=enrollment_count'
          ).catch(() => null)
          setTopCourses(fallbackRes?.items || [])
          setTotalAvailableCourses(fallbackRes?.total || 0)
        } else {
          setTopCourses(res.items)
          setTotalAvailableCourses(res.total)
        }
      } catch (err) {
        console.error('Failed to load recommended courses from DB', err)
        setTopCourses([])
      } finally {
        setLoadingTopCourses(false)
      }
    }

    loadTop6Courses()
  }, [activeGoalMode, selectedSectorId, profile.field_of_interest, profile.current_skills, sectors])

  const activeVacanciesCount = totalJobs
  const activeAvgSalary = demandData?.average_salary
  const inDemandRoles = totalJobs > 0 ? (demandData?.top_roles || []) : []

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. CANDIDATE HERO & GOAL TOGGLE                                           */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-blue-500/5 border border-primary/20 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="size-14 sm:size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl border border-primary/20 shrink-0">
              {profile.full_name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  Hello, {profile.full_name?.split(' ')[0] || 'Candidate'}!
                </h1>
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-xs">
                  <CheckCircle2 className="size-3 mr-1" />
                  Active Profile
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 font-medium text-foreground">
                  <MapPin className="size-3.5 text-primary" />
                  {profile.district}, Maharashtra
                </span>
                {profile.field_of_interest && (
                  <span className="flex items-center gap-1">
                    <BookOpen className="size-3.5" />
                    Field: {profile.field_of_interest}
                  </span>
                )}
                {profile.current_skills && (
                  <span className="bg-muted px-2 py-0.5 rounded text-[11px] truncate max-w-[220px]">
                    Skills: {profile.current_skills}
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => onNavigate('consultation')}
            className="gap-2 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm w-full md:w-auto"
          >
            <PhoneCall className="size-3.5" />
            <span>AI Voice Career Guide</span>
          </Button>
        </div>

        {/* Goal Switcher */}
        <div className="mt-5 pt-4 border-t border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            I am currently looking to:
          </span>
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border gap-1 overflow-x-auto">
            <button
              onClick={() => setActiveGoalMode('job')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeGoalMode === 'job'
                  ? 'bg-background text-primary shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Briefcase className="size-3.5" />
              <span>Looking for a Job</span>
            </button>

            <button
              onClick={() => setActiveGoalMode('learn')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeGoalMode === 'learn'
                  ? 'bg-background text-primary shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <GraduationCap className="size-3.5" />
              <span>Learn a Skill / Courses</span>
            </button>

            <button
              onClick={() => setActiveGoalMode('explore')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                activeGoalMode === 'explore'
                  ? 'bg-background text-primary shadow-xs border border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Compass className="size-3.5" />
              <span>Explore Both (Not Sure)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DYNAMIC FIELD & DISTRICT SELECTOR (FOR "NOT SURE / EXPLORE" MODE)      */}
      {/* ========================================================================= */}
      {activeGoalMode === 'explore' && (
        <Card className="border-primary/20 bg-card shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Compass className="size-4 text-primary" />
                  <span>Choose Your Field of Interest & Local District Area (From DB)</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select any domain and Maharashtra district to view live vacancies and matching training courses simultaneously.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">Select Domain / Sector</label>
                <Select value={selectedSectorId} onValueChange={(val) => { if (val) setSelectedSectorId(val); }}>
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue placeholder="All Sectors">
                      {selectedSectorId === 'all'
                        ? 'All Sectors (Cross-Domain)'
                        : sectors.find((s) => s.id.toString() === selectedSectorId)?.name || 'All Sectors'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    <SelectItem value="all" className="text-xs font-semibold">
                      All Sectors (Cross-Domain)
                    </SelectItem>
                    {sectors.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()} className="text-xs">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">Select Local District</label>
                <Select value={selectedArea} onValueChange={(val) => { if (val) setSelectedArea(val); }}>
                  <SelectTrigger className="h-9 text-xs bg-background">
                    <SelectValue placeholder="Select District Area" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {districtsList.map((d) => (
                      <SelectItem key={d} value={d} className="text-xs">
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 3. MODE: LOOKING FOR A JOB (LIVE JOBS & LABOUR MARKET DASHBOARD)          */}
      {/* ========================================================================= */}
      {(activeGoalMode === 'job' || activeGoalMode === 'explore') && (
        <div className="space-y-5">
          {/* Dynamic District Labour Market KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Active Openings
                </CardTitle>
                <Briefcase className="size-4 text-primary" />
              </CardHeader>
              <CardContent className="p-3.5 pt-1">
                <div className="text-2xl font-bold text-primary">
                  {loadingDemand ? (
                    <Loader2 className="size-6 animate-spin" />
                  ) : (
                    activeVacanciesCount.toLocaleString()
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  In {resolvedDistrict} {resolvedSectorName ? `for ${resolvedSectorName}` : ''}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Avg Market Salary
                </CardTitle>
                <DollarSign className="size-4 text-emerald-500" />
              </CardHeader>
              <CardContent className="p-3.5 pt-1">
                <div className="text-2xl font-bold text-foreground">
                  {totalJobs > 0 && activeAvgSalary
                    ? `₹${(activeAvgSalary / 100000).toFixed(1)}L / yr`
                    : (totalJobs > 0 ? '₹5.4L / yr' : '—')}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {totalJobs > 0 ? 'Market compensation index' : 'No salary data for 0 openings'}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Top Hiring Employer
                </CardTitle>
                <Building2 className="size-4 text-blue-500" />
              </CardHeader>
              <CardContent className="p-3.5 pt-1">
                <div className="text-2xl font-bold text-foreground truncate" title={topEmployers[0]?.company || 'None Active'}>
                  {totalJobs > 0 && topEmployers[0]?.company ? topEmployers[0].company : (totalJobs > 0 ? 'Direct Enterprise Hirers' : 'None Active')}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {totalJobs > 0 && topEmployers.length > 0 ? `${topEmployers.length} active hiring employers in ${resolvedDistrict}` : `No active hirers for this query in ${resolvedDistrict}`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* In-Demand Roles & Competencies in District (From Demand API) */}
          {inDemandRoles.length > 0 && (
            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                      <TrendingUp className="size-4 text-emerald-500" />
                      <span>In-Demand Industry Roles in {resolvedDistrict}</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Highest employer hiring volume identified in {resolvedDistrict}
                    </CardDescription>
                  </div>
                  {demandData?.demand_level && (
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                      {demandData.demand_level} Demand Region
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {inDemandRoles.map((roleName, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-border bg-muted/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[9px] font-bold bg-primary/10 text-primary border-primary/20">
                          Priority #{idx + 1}
                        </Badge>
                      </div>
                      <div className="font-bold text-xs text-foreground leading-snug pt-0.5">{roleName}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{resolvedDistrict} Hiring</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Relevant Live Job Openings List */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Briefcase className="size-4 text-primary" />
                  <span>Top Relevant Job Openings ({resolvedDistrict})</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  First 6 active job listings matching your profile in {resolvedDistrict}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate('jobs')}
                  className="gap-1.5 text-xs font-semibold bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                >
                  <Layers className="size-3.5" />
                  <span>View All Jobs</span>
                </Button>
              </div>
            </div>

            {loadingJobs ? (
              <Card className="p-8 text-center border-border">
                <Loader2 className="size-6 animate-spin text-primary mx-auto mb-2" />
                <span className="text-xs text-muted-foreground">Loading active job vacancies...</span>
              </Card>
            ) : jobs.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {jobs.map((job) => (
                    <Card
                      key={job.id}
                      className="flex flex-col justify-between border-border hover:border-primary/50 shadow-sm transition-all"
                    >
                      <div className="p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-foreground leading-snug line-clamp-2" title={job.title}>
                            {job.title}
                          </h4>
                        </div>

                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5 font-medium text-foreground">
                            <Building2 className="size-3.5 text-primary shrink-0" />
                            <span className="truncate">{job.company?.display_name || 'Hiring Employer'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="size-3.5 shrink-0" />
                            <span className="truncate">{job.location?.display_name || resolvedDistrict}</span>
                          </div>
                        </div>

                        {job.salary_min && (
                          <div className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 w-fit">
                            ₹{(job.salary_min / 100000).toFixed(1)}L - ₹{((job.salary_max || job.salary_min * 1.5) / 100000).toFixed(1)}L / yr
                          </div>
                        )}

                        {job.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pt-1">
                            {job.description.replace(/<[^>]+>/g, '')}
                          </p>
                        )}
                      </div>

                      <div className="p-3 pt-0 border-t border-border/50 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {job.contract_time || 'Full-Time'}
                        </span>
                        <a
                          href={job.redirect_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                        >
                          <span>Apply / View</span>
                          <ExternalLink className="size-3" />
                        </a>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* "Show All Jobs" CTA Banner at bottom */}
                <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="size-5 text-primary shrink-0" />
                    <div className="text-xs">
                      <span className="font-semibold text-foreground">
                        Explore All {activeVacanciesCount > 0 ? `${activeVacanciesCount.toLocaleString()} ` : ''}Live Openings in {resolvedDistrict}
                      </span>
                      <p className="text-muted-foreground">
                        Browse the complete live Maharashtra job board with search, district filters, and pagination.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => onNavigate('jobs')}
                    className="gap-2 shrink-0 text-xs w-full sm:w-auto"
                  >
                    <Briefcase className="size-3.5" />
                    <span>View All Jobs ({activeVacanciesCount.toLocaleString()})</span>
                    <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="p-8 text-center border-border bg-card">
                <Briefcase className="size-8 text-muted-foreground mx-auto mb-2 opacity-40" />
                <h4 className="text-xs font-semibold text-foreground">0 Active Job Vacancies Found</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  No active job postings found for {resolvedSectorName ? `"${resolvedSectorName}"` : 'this domain'} in {resolvedDistrict}. Try selecting another sector or explore matching accredited courses below.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODE: LEARN A SKILL / COURSES (TOP 6 + SEPARATE VIEW ALL PAGE LINK)   */}
      {/* ========================================================================= */}
      {(activeGoalMode === 'learn' || activeGoalMode === 'explore') && (
        <div className="space-y-4 pt-2">
          {/* Header Bar with "View All Courses" separate page button */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <GraduationCap className="size-4 text-primary" />
                <span>Top Recommended Courses ({resolvedSectorName || 'Popular Programs'})</span>
              </h3>
              <p className="text-xs text-muted-foreground">
                First 6 high-impact courses tailored to your profile in {resolvedSectorName || 'Maharashtra'}
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate('courses')}
              className="gap-1.5 text-xs font-semibold bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
            >
              <Layers className="size-3.5" />
              <span>View All Courses</span>
            </Button>
          </div>

          {/* Top 6 Recommended Courses Grid */}
          {loadingTopCourses ? (
            <Card className="p-8 text-center border-border">
              <Loader2 className="size-6 animate-spin text-primary mx-auto mb-2" />
              <span className="text-xs text-muted-foreground">Loading recommended courses...</span>
            </Card>
          ) : topCourses.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {topCourses.map((c) => (
                  <Card
                    key={c.id}
                    className="flex flex-col justify-between border-border hover:border-primary/50 shadow-sm transition-all"
                  >
                    <div className="p-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {c.course_type}
                        </Badge>
                        {c.nsqf_level && (
                          <Badge variant="secondary" className="text-[10px]">
                            NSQF Level {c.nsqf_level}
                          </Badge>
                        )}
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          {c.price && c.price > 0 ? `₹${c.price.toLocaleString()}` : 'Free / Subsidized'}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-foreground leading-snug line-clamp-2" title={c.title}>
                        {c.title}
                      </h4>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="size-3.5 text-primary shrink-0" />
                          <span className="truncate">{c.provider?.name || c.provider_name || 'Skill India Digital Partner'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="size-3.5 shrink-0" />
                          <span>{c.duration_minutes ? `${c.duration_minutes} mins` : (c.duration || 'Self-Paced')}</span>
                        </div>
                      </div>

                      {c.certificate_enabled && (
                        <div className="flex items-center gap-1 text-[11px] text-primary font-medium">
                          <Award className="size-3.5" />
                          <span>Govt Certificate Included</span>
                        </div>
                      )}
                    </div>

                    <div className="p-3 pt-0 border-t border-border/50 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">
                        {(c.enrollment_count || c.enrolment_count) ? `${(c.enrollment_count || c.enrolment_count)?.toLocaleString()} students` : 'Open Admissions'}
                      </span>
                      {c.course_url ? (
                        <a
                          href={c.course_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                        >
                          <span>Enroll on SID</span>
                          <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        <span className="text-xs font-semibold text-primary">Accredited</span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              {/* "Show All Courses" CTA Banner at bottom */}
              <div className="p-4 rounded-xl bg-card border border-border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="size-5 text-primary shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-foreground">
                      Explore All {totalAvailableCourses > 0 ? `${totalAvailableCourses.toLocaleString()} ` : ''}Courses in {resolvedSectorName || 'Maharashtra'}
                    </span>
                    <p className="text-muted-foreground">
                      Browse full course catalog with search, sector filters, mode selection, and pagination.
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => onNavigate('courses')}
                  className="gap-2 shrink-0 text-xs w-full sm:w-auto"
                >
                  <Layers className="size-3.5" />
                  <span>View All Courses ({totalAvailableCourses.toLocaleString()})</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <Card className="p-8 text-center border-border">
              <p className="text-xs text-muted-foreground">
                No courses found in database for this filter.
              </p>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
