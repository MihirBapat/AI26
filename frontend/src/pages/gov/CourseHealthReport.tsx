import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  Clock,
  Award,
  TrendingUp,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  Printer,
  ExternalLink,
  Layers,
  Zap,
  BarChart3,
  Loader2,
  Flame,
  ArrowUpRight,
  TrendingDown
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
import { apiFetch } from '@/lib/api'
import { ChartContainer } from '@/components/ui/chart'

const ALL_MAHARASHTRA_DISTRICTS = [
  'All Maharashtra', 'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara',
  'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon',
  'Jalna', 'Kolhapur', 'Latur', 'Mumbai', 'Mumbai Suburban', 'Nagpur', 'Nanded',
  'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar', 'Parbhani', 'Pune', 'Raigad',
  'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha',
  'Washim', 'Yavatmal'
]

interface SalaryBand {
  label: string
  min_salary: number
  max_salary: number | null
  count: number
}

interface TopEmployer {
  name: string
  active_openings: number
  location: string | null
  average_salary: number | null
}

interface SkillAnalysis {
  skill_name: string
  status: 'taught' | 'emerging_gap' | 'declining' | string
  importance_weight: number
  demand_growth_pct: number | null
  category: string
}

interface Recommendation {
  id: string
  category: string
  title: string
  description: string
  priority: 'High' | 'Medium' | 'Low' | string
  expected_impact: string
}

interface DistrictDemand {
  district: string
  openings_count: number
  demand_intensity: string
  avg_salary: number | null
}

interface CourseHealthReport {
  course_id: number
  sid_course_id: string
  title: string
  provider_name: string | null
  course_type: string
  duration_minutes: number | null
  nsqf_level: string | null
  enrollment_count: number
  rating_average: number | null
  certificate_enabled: boolean
  course_url: string | null
  sectors: string[]
  domains: string[]
  occupations: string[]
  overall_health_score: number
  health_grade: string
  health_status_label: string
  industry_demand_score: number
  curriculum_modernity_score: number
  obsolescence_risk_score: number
  placement_potential_score: number
  skill_velocity: string
  total_state_openings: number
  avg_salary_inr: number
  entry_salary_inr: number
  senior_salary_inr: number
  salary_bands: SalaryBand[]
  top_employers: TopEmployer[]
  skills_analysis: SkillAnalysis[]
  recommendations: Recommendation[]
  district_demand: DistrictDemand[]
  selected_district: string
  district_scope_label: string
  ai_executive_summary: string
  evidence_basis: string
  generated_at: string
}

const BLUE_PALETTE = ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a']

export function CourseHealthReport() {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const initialDistrict = searchParams.get('district') || 'All Maharashtra'
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDistrict)
  const [report, setReport] = useState<CourseHealthReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'summary' | 'skills' | 'recommendations' | 'districts'>('summary')

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams()
        if (selectedDistrict && selectedDistrict !== 'All Maharashtra') {
          params.append('district', selectedDistrict)
        }
        const queryStr = params.toString() ? `?${params.toString()}` : ''
        const data = await apiFetch<CourseHealthReport>(`/courses/${id}/health-report${queryStr}`)
        setReport(data)
      } catch (err: any) {
        console.error('Failed to load course health report', err)
        setError(err.message || 'Unable to generate course health report')
      } finally {
        setLoading(false)
      }
    }
    if (id) {
      fetchReport()
    }
  }, [id, selectedDistrict])

  const handleDistrictChange = (district: string) => {
    setSelectedDistrict(district)
    if (district === 'All Maharashtra') {
      searchParams.delete('district')
      setSearchParams(searchParams)
    } else {
      setSearchParams({ district })
    }
  }

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="size-10 animate-spin text-primary" />
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-foreground">Analyzing Course Health for {selectedDistrict}</h2>
          <p className="text-xs text-muted-foreground max-w-sm">
            Ingesting live vacancy signals, calculating curriculum modernity scores, and benchmarking regional salary bands...
          </p>
        </div>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/gov/dashboard')} className="gap-1.5 text-xs">
          <ArrowLeft className="size-4" />
          <span>Back to Courses</span>
        </Button>
        <Card className="p-8 text-center border-destructive/30 bg-destructive/5 space-y-3">
          <AlertTriangle className="size-8 text-destructive mx-auto" />
          <h3 className="text-base font-bold text-foreground">Failed to Load Health Report</h3>
          <p className="text-xs text-muted-foreground">{error || 'Course not found'}</p>
          <Button size="sm" onClick={() => window.location.reload()} className="mt-2 text-xs">
            Retry Analysis
          </Button>
        </Card>
      </div>
    )
  }

  const formatDuration = (minutes: number | null) => {
    if (!minutes || minutes <= 0) return 'Self-Paced'
    if (minutes < 60) return `${minutes} mins`
    const hrs = Math.floor(minutes / 60)
    const rem = minutes % 60
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs} hrs`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500'
    if (score >= 65) return 'text-blue-500'
    if (score >= 50) return 'text-amber-500'
    return 'text-rose-500'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
    if (score >= 65) return 'bg-blue-500/10 border-blue-500/20 text-blue-600'
    if (score >= 50) return 'bg-amber-500/10 border-amber-500/20 text-amber-600'
    return 'bg-rose-500/10 border-rose-500/20 text-rose-600'
  }

  const isDistrictScoped = selectedDistrict !== 'All Maharashtra'

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1)
              } else {
                navigate('/gov/dashboard')
              }
            }}
            className="h-8 px-2.5 text-xs gap-1.5 hover:bg-muted"
            title="Return to Previous Page"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back</span>
          </Button>
          <span className="text-muted-foreground text-xs">/</span>
          <span className="text-xs font-semibold text-foreground truncate max-w-[240px]">
            {report.title}
          </span>
        </div>

        {/* Action Controls & District Filter */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end">
          {/* District Scope Select Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground hidden sm:inline">District:</span>
            <Select value={selectedDistrict} onValueChange={(val) => { if (val) handleDistrictChange(val); }}>
              <SelectTrigger className="h-8 text-xs w-[170px] bg-background">
                <SelectValue placeholder="Select District" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {ALL_MAHARASHTRA_DISTRICTS.map((d) => (
                  <SelectItem key={d} value={d} className="text-xs">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="h-8 text-xs gap-1.5"
            title="Print or Export Intelligence Report"
          >
            <Printer className="size-3.5" />
            <span className="hidden sm:inline">Print</span>
          </Button>

          {report.course_url && (
            <a
              href={report.course_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              <span>View on SID</span>
              <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      </div>

      {/* Course Hero Banner */}
      <Card className="overflow-hidden border-border bg-card shadow-sm">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {/* District Scope Indicator Pill */}
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs flex items-center gap-1 font-semibold">
                  <MapPin className="size-3" />
                  <span>{report.district_scope_label}</span>
                </Badge>

                {report.course_type.toLowerCase() === 'online' ? (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-xs flex items-center gap-1">
                    <Globe className="size-3" />
                    <span>Online Delivery</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs flex items-center gap-1">
                    <MapPin className="size-3" />
                    <span>In-Center (Offline)</span>
                  </Badge>
                )}

                {report.nsqf_level && (
                  <Badge variant="secondary" className="text-xs">
                    NSQF Level {report.nsqf_level}
                  </Badge>
                )}

                {report.certificate_enabled && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs flex items-center gap-1">
                    <Award className="size-3" />
                    <span>Govt Certified</span>
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight">
                {report.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Building2 className="size-3.5 text-primary" />
                  <span className="font-medium text-foreground">{report.provider_name || 'Skill India Digital'}</span>
                </div>
                {report.sectors && report.sectors.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Layers className="size-3.5 text-muted-foreground" />
                    <span>{report.sectors.join(', ')}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="size-3.5 text-muted-foreground" />
                  <span>{formatDuration(report.duration_minutes)}</span>
                </div>
              </div>
            </div>

            {/* Overall Composite Health Score Circular Card */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/40 border border-border shrink-0 self-start lg:self-center">
              <div className="relative size-20 sm:size-24 rounded-full flex flex-col items-center justify-center bg-background border-4 border-primary/20 shadow-inner">
                <span className={`text-2xl sm:text-3xl font-black ${getScoreColor(report.overall_health_score)}`}>
                  {report.overall_health_score.toFixed(0)}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground">/ 100</span>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Course Health Index
                </span>
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${getScoreBg(report.overall_health_score)}`}>
                  {report.health_grade}
                </span>
                <span className="text-xs text-muted-foreground block">
                  {report.health_status_label}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 5-Column Executive KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Industry Demand */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {isDistrictScoped ? `${selectedDistrict} Demand` : 'Statewide Demand'}
            </CardTitle>
            <Briefcase className="size-3.5 text-primary" />
          </CardHeader>
          <CardContent className="p-3.5 pt-1">
            <div className="text-xl sm:text-2xl font-bold text-foreground">{report.industry_demand_score.toFixed(0)}%</div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium text-emerald-600 truncate">
              {report.total_state_openings.toLocaleString()} Active Vacancies
            </p>
          </CardContent>
        </Card>

        {/* Avg Salary Benchmark */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {isDistrictScoped ? `${selectedDistrict} Salary` : 'Market Salary'}
            </CardTitle>
            <span className="text-primary font-bold text-xs">₹</span>
          </CardHeader>
          <CardContent className="p-3.5 pt-1">
            <div className="text-xl sm:text-2xl font-bold text-foreground">
              ₹{(report.avg_salary_inr / 100000).toFixed(1)}L
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              ₹{(report.entry_salary_inr / 100000).toFixed(1)}L - ₹{(report.senior_salary_inr / 100000).toFixed(1)}L
            </p>
          </CardContent>
        </Card>

        {/* Curriculum Modernity */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">Curriculum Modernity</CardTitle>
            <Zap className="size-3.5 text-amber-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-1">
            <div className="text-xl sm:text-2xl font-bold text-foreground">{report.curriculum_modernity_score.toFixed(0)}%</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Contemporary standards</p>
          </CardContent>
        </Card>

        {/* Obsolescence Risk */}
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">Obsolescence Risk</CardTitle>
            <AlertTriangle className="size-3.5 text-rose-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-1">
            <div className="text-xl sm:text-2xl font-bold text-rose-600">{report.obsolescence_risk_score.toFixed(0)}%</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {report.obsolescence_risk_score < 25 ? 'Low Risk · Contemporary' : 'Moderate Overhaul Risk'}
            </p>
          </CardContent>
        </Card>

        {/* Placement Potential */}
        <Card className="shadow-sm border-border bg-card col-span-2 sm:col-span-1">
          <CardHeader className="p-3.5 pb-1 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-medium text-muted-foreground">Placement Potential</CardTitle>
            <TrendingUp className="size-3.5 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-3.5 pt-1">
            <div className="text-xl sm:text-2xl font-bold text-foreground">{report.placement_potential_score.toFixed(0)}%</div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {isDistrictScoped ? `${selectedDistrict} absorption` : 'Statewide absorption'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Tabs Navigation */}
      <div className="flex border-b border-border space-x-2 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('summary')}
          className={`pb-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'summary'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="size-3.5" />
          <span>Market Demand & Salaries</span>
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`pb-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'skills'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Zap className="size-3.5" />
          <span>Skill Gaps & Velocity</span>
          <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 h-4">
            {report.skills_analysis.filter(s => s.status === 'emerging_gap').length} Gaps
          </Badge>
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`pb-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'recommendations'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <CheckCircle2 className="size-3.5" />
          <span>Curriculum Upgrades</span>
          <Badge className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/20">
            {report.recommendations.length} Actions
          </Badge>
        </button>
        <button
          onClick={() => setActiveTab('districts')}
          className={`pb-3 px-3.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'districts'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <MapPin className="size-3.5" />
          <span>District Demand Map</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SUMMARY & MARKET DEMAND                                            */}
      {/* ========================================================================= */}
      {activeTab === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Salary Distribution Histogram */}
            <Card className="lg:col-span-2 shadow-sm border-border bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <span>Compensation Distribution ({report.district_scope_label})</span>
                </CardTitle>
                <CardDescription>
                  Annual salary brackets offered by hiring companies for roles requiring this course's skill profile
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-hidden">
                <ChartContainer config={{ salary: { label: 'Vacancies', color: '#3b82f6' } }} className="h-[260px] w-full aspect-auto">
                  <BarChart data={report.salary_bands} margin={{ top: 20, right: 20, left: -10, bottom: 20 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} height={40} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: any) => [`${val} Active Postings`, 'Vacancies']}
                      contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={44}>
                      {report.salary_bands.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={BLUE_PALETTE[index % BLUE_PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Top Hiring Companies Leaderboard */}
            <Card className="shadow-sm border-border bg-card">
              <CardHeader>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="size-4 text-primary" />
                  <span>Top Hiring Companies</span>
                </CardTitle>
                <CardDescription>Major employers hiring in {report.district_scope_label}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {report.top_employers.map((emp, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                    <div className="space-y-0.5 truncate mr-2">
                      <span className="text-xs font-semibold text-foreground block truncate" title={emp.name}>
                        {emp.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground block truncate">
                        {emp.location || selectedDistrict} · Avg ₹{( (emp.average_salary || report.avg_salary_inr) / 100000).toFixed(1)}L
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {emp.active_openings} jobs
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SKILL MATCH & GAPS MATRIX                                          */}
      {/* ========================================================================= */}
      {activeTab === 'skills' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="shadow-sm border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Curriculum Competency vs. Industry Skill Gap Matrix</span>
                <span className="text-xs font-normal text-muted-foreground">
                  Analyzed against live 2026 employer postings in {report.district_scope_label}
                </span>
              </CardTitle>
              <CardDescription>
                Compare competencies currently taught in this course against emerging industry skills missing from the syllabus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Taught Skills */}
                <div className="space-y-3 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CheckCircle2 className="size-4" />
                      <span>Taught in Course</span>
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 border-emerald-500/20 text-emerald-600">
                      {report.skills_analysis.filter(s => s.status === 'taught').length} Skills
                    </Badge>
                  </div>
                  <div className="space-y-2 pt-2">
                    {report.skills_analysis.filter(s => s.status === 'taught').map((s, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-card border border-border shadow-xs text-xs space-y-1">
                        <div className="font-semibold text-foreground">{s.skill_name}</div>
                        <div className="text-[10px] text-muted-foreground flex items-center justify-between">
                          <span>{s.category}</span>
                          <span className="text-emerald-600 font-medium">Covered in Syllabus</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Missing Emerging Gaps */}
                <div className="space-y-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Flame className="size-4" />
                      <span>Missing Critical Gaps</span>
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 border-amber-500/20 text-amber-600">
                      High Priority
                    </Badge>
                  </div>
                  <div className="space-y-2 pt-2">
                    {report.skills_analysis.filter(s => s.status === 'emerging_gap').map((s, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-card border border-amber-500/30 shadow-xs text-xs space-y-1">
                        <div className="font-semibold text-foreground flex items-center justify-between">
                          <span>{s.skill_name}</span>
                          {s.demand_growth_pct && (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                              <ArrowUpRight className="size-3" />
                              +{s.demand_growth_pct}% YoY
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                          Required by 40%+ employers · Add to Module
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Declining / Deprecated */}
                <div className="space-y-3 p-4 rounded-xl bg-muted/40 border border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingDown className="size-4" />
                      <span>Legacy / Declining</span>
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      Low Market Value
                    </Badge>
                  </div>
                  <div className="space-y-2 pt-2">
                    {report.skills_analysis.filter(s => s.status === 'declining').length > 0 ? (
                      report.skills_analysis.filter(s => s.status === 'declining').map((s, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-card border border-border shadow-xs text-xs space-y-1">
                          <div className="font-semibold text-muted-foreground line-through">{s.skill_name}</div>
                          <div className="text-[10px] text-rose-500 font-medium">
                            Diminishing demand ({s.demand_growth_pct}% YoY)
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        No deprecated technical skills detected in this course.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CURRICULUM UPGRADE ACTION PLAN                                     */}
      {/* ========================================================================= */}
      {activeTab === 'recommendations' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="shadow-sm border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" />
                <span>Actionable Curriculum & Capacity Recommendations ({report.district_scope_label})</span>
              </CardTitle>
              <CardDescription>
                Evidence-based modifications for university boards, training providers, and government skill missions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {report.recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl border border-border bg-muted/20 hover:border-primary/40 transition-all space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-xs font-semibold ${
                          rec.priority === 'High'
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                        }`}
                      >
                        {rec.priority} Priority
                      </Badge>
                      <Badge variant="secondary" className="text-xs uppercase text-[10px] tracking-wider">
                        {rec.category.replace('_', ' ')}
                      </Badge>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      {rec.expected_impact}
                    </span>
                  </div>

                  <h4 className="font-semibold text-sm sm:text-base text-foreground">{rec.title}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {rec.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MAHARASHTRA DISTRICT DEMAND BREAKDOWN                              */}
      {/* ========================================================================= */}
      {activeTab === 'districts' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <Card className="shadow-sm border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <span>Maharashtra District-Wise Employment Demand Breakdown</span>
              </CardTitle>
              <CardDescription>
                Geographic concentration of open job postings for graduates of this skill curriculum across Maharashtra
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.district_demand.map((d, i) => {
                  const isSelected = isDistrictScoped && d.district.toLowerCase() === selectedDistrict.toLowerCase()
                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border transition-all space-y-2 cursor-pointer ${
                        isSelected
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border bg-muted/20 hover:border-primary/40'
                      }`}
                      onClick={() => handleDistrictChange(d.district)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                          <span>{d.district}</span>
                          {isSelected && (
                            <span className="size-2 rounded-full bg-primary inline-block" />
                          )}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            isSelected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : d.demand_intensity === 'Critical Demand'
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                              : 'bg-primary/10 text-primary border-primary/20'
                          }`}
                        >
                          {d.demand_intensity}
                        </Badge>
                      </div>
                      <div className="flex items-baseline justify-between pt-1 border-t border-border">
                        <span className="text-xs text-muted-foreground">Estimated Openings</span>
                        <span className="text-base font-bold text-primary">{d.openings_count} jobs</span>
                      </div>
                      {d.avg_salary && (
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="text-muted-foreground">Regional Avg Salary</span>
                          <span className="font-semibold text-foreground">₹{(d.avg_salary / 100000).toFixed(2)} LPA</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
