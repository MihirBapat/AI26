import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  FileText,
  Sparkles,
  MapPin,
  BookOpen,
  Flame,
  Printer,
  Download,
  Loader2,
  ArrowRight
} from 'lucide-react'
import { apiFetch } from '@/lib/api'

const ALL_MAHARASHTRA_DISTRICTS = [
  'All Maharashtra', 'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara',
  'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon',
  'Jalna', 'Kolhapur', 'Latur', 'Mumbai', 'Mumbai Suburban', 'Nagpur', 'Nanded',
  'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar', 'Parbhani', 'Pune', 'Raigad',
  'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha',
  'Washim', 'Yavatmal'
]

interface Sector {
  id: number
  name: string
}

interface NewCourseRecommendation {
  skill_name: string
  recommended_course_title: string
  market_demand_openings: number
  avg_salary_inr: float
  target_nsqf_level: string
  suggested_duration_hours: number
  suggested_modules: string[]
  priority: 'Critical' | 'High' | 'Medium' | string
  justification: string
}

type float = number

interface ExistingCourseAuditItem {
  course_id: number
  title: string
  provider_name: string | null
  course_type: string
  enrollment_count: number
  rating_average: number | null
  overall_health_score: number
  health_grade: string
  obsolescence_risk_score: number
  status: 'Highly Aligned' | 'Needs Curriculum Refresh' | 'High Obsolescence Risk' | string
  missing_critical_skills: string[]
}

interface DistrictCapacityAllocation {
  district: string
  openings_count: number
  demand_intensity: string
  avg_salary: number | null
}

interface SectorCurriculumReport {
  sector_name: string
  sector_id: number | null
  district_scope: string
  selected_district: string
  generated_at: string
  total_active_vacancies: number
  total_courses_count: number
  courses_to_vacancies_ratio: string
  average_sector_salary: number
  sector_health_index: number
  curriculum_coverage_pct: number
  new_courses_required: NewCourseRecommendation[]
  existing_courses_audit: ExistingCourseAuditItem[]
  district_capacity_allocation: DistrictCapacityAllocation[]
  ai_executive_summary: string
  policy_action_items: string[]
}

export function GenerateReportsView() {
  const navigate = useNavigate()

  // Filter States
  const [sectors, setSectors] = useState<Sector[]>([])
  const [selectedSectorId, setSelectedSectorId] = useState<string>('all')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Maharashtra')

  // Report Data State
  const [report, setReport] = useState<SectorCurriculumReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [reportGenerated, setReportGenerated] = useState(false)

  // Fetch Sectors Lookup
  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const data = await apiFetch<Sector[]>('/lookups/sectors')
        setSectors(data || [])
      } catch (err) {
        console.error('Failed to load sectors', err)
      }
    }
    fetchSectors()
  }, [])

  const handleGenerateReport = async () => {
    try {
      setLoading(true)
      const selectedSectorObj = sectors.find((s) => s.id.toString() === selectedSectorId)
      const sectorName = selectedSectorObj ? selectedSectorObj.name : 'All Sectors'

      const params = new URLSearchParams()
      if (selectedSectorId !== 'all') {
        params.append('sector_id', selectedSectorId)
        params.append('sector_name', sectorName)
      }
      if (selectedDistrict) {
        params.append('district', selectedDistrict)
      }

      const data = await apiFetch<SectorCurriculumReport>(
        `/reports/sector-curriculum-intelligence?${params.toString()}`
      )
      setReport(data)
      setReportGenerated(true)
    } catch (err) {
      console.error('Failed to generate sector report', err)
    } finally {
      setLoading(false)
    }
  }

  // Generate on initial load with default values
  useEffect(() => {
    handleGenerateReport()
  }, [])

  const exportCSV = () => {
    if (!report) return

    let csvContent = 'data:text/csv;charset=utf-8,'
    csvContent += `Sector Curriculum Intelligence Report - ${report.sector_name} (${report.district_scope})\r\n`
    csvContent += `Generated At: ${report.generated_at}\r\n`
    csvContent += `Active Vacancies: ${report.total_active_vacancies}, Courses Catalogued: ${report.total_courses_count}, Coverage: ${report.curriculum_coverage_pct}%\r\n\r\n`

    csvContent += '--- CRITICAL UNMET SKILLS (NEW COURSES REQUIRED) ---\r\n'
    csvContent += 'Skill Name,Recommended Course Title,Target NSQF,Duration Hours,Est Openings,Avg Salary (INR),Priority\r\n'
    report.new_courses_required.forEach((nc) => {
      csvContent += `"${nc.skill_name}","${nc.recommended_course_title}","${nc.target_nsqf_level}",${nc.suggested_duration_hours},${nc.market_demand_openings},${nc.avg_salary_inr},"${nc.priority}"\r\n`
    })

    csvContent += '\r\n--- EXISTING COURSES AUDIT ---\r\n'
    csvContent += 'Course ID,Title,Provider,Enrollments,Rating,Health Score,Grade,Status\r\n'
    report.existing_courses_audit.forEach((c) => {
      csvContent += `${c.course_id},"${c.title}","${c.provider_name || 'Skill India Digital'}",${c.enrollment_count},${c.rating_average || 'N/A'},${c.overall_health_score},"${c.health_grade}","${c.status}"\r\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Curriculum_Report_${report.sector_name.replace(/\s+/g, '_')}_${report.selected_district}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. REPORT GENERATOR CONTROLS BAR                                          */}
      {/* ========================================================================= */}
      <Card className="shadow-sm border-border bg-card">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <span>Sector Curriculum Gap & New Courses Report Generator</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Audit existing course health and dynamically identify unmet industry skills where new courses must be designed.
              </p>
            </div>

            {reportGenerated && report && (
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportCSV}
                  className="h-8 text-xs gap-1.5"
                  title="Export Report as CSV"
                >
                  <Download className="size-3.5" />
                  <span>CSV Export</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                  className="h-8 text-xs gap-1.5"
                  title="Print Policy Report"
                >
                  <Printer className="size-3.5" />
                  <span>Print Report</span>
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 items-end">
            {/* Sector Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">Select Industry Sector</label>
              <Select value={selectedSectorId} onValueChange={(val) => { if (val) setSelectedSectorId(val); }}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="All Sectors">
                    {selectedSectorId === 'all'
                      ? 'All Sectors (Aggregate)'
                      : sectors.find((s) => s.id.toString() === selectedSectorId)?.name || 'All Sectors'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="all" className="text-xs font-semibold">
                    All Sectors (Aggregate)
                  </SelectItem>
                  {sectors.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()} className="text-xs">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* District Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground">Select District Scope</label>
              <Select value={selectedDistrict} onValueChange={(val) => { if (val) setSelectedDistrict(val); }}>
                <SelectTrigger className="h-9 text-xs bg-background">
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

            {/* Generate Action Button */}
            <div className="w-full mb-[6px]">
              <Button
                onClick={handleGenerateReport}
                disabled={loading}
                className="h-9 text-xs font-bold gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Analyzing Job Vacancies...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-3.5" />
                    <span>Generate Intelligence Report</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 2. REPORT CONTENT VIEW                                                    */}
      {/* ========================================================================= */}
      {loading ? (
        <Card className="p-12 text-center border-border bg-card">
          <Loader2 className="size-10 animate-spin text-primary mx-auto mb-3" />
          <h3 className="text-base font-bold text-foreground">Generating Curriculum Gap Audit</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Cross-referencing live employer hiring signals against government course catalog to pinpoint unmet competency areas...
          </p>
        </Card>
      ) : report ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Simplified 4-Card Executive Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Sector Vacancies</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold text-primary">{report.total_active_vacancies.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{report.district_scope}</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Catalogued Courses</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold text-foreground">{report.total_courses_count}</div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{report.courses_to_vacancies_ratio}</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Market Skill Coverage</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold text-emerald-600">{report.curriculum_coverage_pct.toFixed(0)}%</div>
                <p className="text-xs text-amber-600 font-medium mt-0.5 truncate">
                  {report.new_courses_required.length} Unmet Skill Gaps Identified
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border bg-card">
              <CardHeader className="p-4 pb-1">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Benchmark Market Salary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1">
                <div className="text-2xl font-bold text-foreground">₹{(report.average_sector_salary / 100000).toFixed(1)}L</div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">Annual average compensation</p>
              </CardContent>
            </Card>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 1: CRITICAL UNMET SKILLS (NEW COURSES REQUIRED)                   */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Flame className="size-4 text-amber-500" />
                  <span>Critical Unmet Industry Skills (New Courses Required)</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  High-priority competencies actively demanded by employers in {report.district_scope} for which no standard public course currently exists.
                </p>
              </div>
              <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
                {report.new_courses_required.length} Course Blueprints Generated
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {report.new_courses_required.map((nc, idx) => (
                <Card
                  key={idx}
                  className="flex flex-col justify-between border-amber-500/30 bg-card hover:border-primary/50 shadow-sm transition-all duration-200"
                >
                  <div className="p-5 space-y-3.5">
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          nc.priority === 'Critical'
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                        }`}
                      >
                        {nc.priority} Need
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {nc.target_nsqf_level}
                      </Badge>
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        ₹{(nc.avg_salary_inr / 100000).toFixed(1)} LPA
                      </span>
                    </div>

                    {/* Target Skill & Recommended Title */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Unmet Competency Gap
                      </span>
                      <h4 className="font-bold text-sm text-foreground leading-snug">
                        {nc.recommended_course_title}
                      </h4>
                      <p className="text-xs font-medium text-primary">
                        Focus: {nc.skill_name}
                      </p>
                    </div>

                    {/* Justification Callout */}
                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border">
                      {nc.justification}
                    </p>

                    {/* Suggested Syllabus Modules */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                        <span>Suggested Syllabus Modules</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {nc.suggested_duration_hours} Hours
                        </span>
                      </span>
                      <div className="space-y-1">
                        {nc.suggested_modules.map((m, mIdx) => (
                          <div
                            key={mIdx}
                            className="text-[11px] text-muted-foreground bg-background p-1.5 rounded border border-border/70 truncate"
                            title={m}
                          >
                            {m}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Metric */}
                  <div className="p-4 pt-3 border-t border-border bg-muted/10 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Market Demand</span>
                    <span className="font-bold text-foreground">
                      ~{nc.market_demand_openings} Local Openings
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: EXISTING COURSES PERFORMANCE AUDIT TABLE                       */}
          {/* ========================================================================= */}
          <Card className="shadow-sm border-border bg-card">
            <CardHeader className="pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BookOpen className="size-4 text-primary" />
                  <span>Existing Courses Performance & Obsolescence Audit ({report.existing_courses_audit.length} Courses)</span>
                </CardTitle>
                <CardDescription>
                  Detailed health ratings, student registrations, and alignment status for current courses in {report.sector_name}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-semibold border-b border-border">
                    <tr>
                      <th className="p-3">Course Title</th>
                      <th className="p-3">Training Provider</th>
                      <th className="p-3 text-center">Delivery</th>
                      <th className="p-3 text-center">Enrollments</th>
                      <th className="p-3 text-center">Health Score</th>
                      <th className="p-3 text-center">Alignment Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {report.existing_courses_audit.map((c) => {
                      const isHighRisk = c.status === 'High Obsolescence Risk'
                      const isRefresh = c.status === 'Needs Curriculum Refresh'
                      return (
                        <tr key={c.course_id} className="hover:bg-muted/20 transition-colors">
                          <td className="p-3 font-medium text-foreground max-w-[240px] truncate" title={c.title}>
                            {c.title}
                          </td>
                          <td className="p-3 text-muted-foreground max-w-[180px] truncate" title={c.provider_name || 'Skill India Digital'}>
                            {c.provider_name || 'Skill India Digital'}
                          </td>
                          <td className="p-3 text-center">
                            <Badge variant="outline" className="text-[10px]">
                              {c.course_type}
                            </Badge>
                          </td>
                          <td className="p-3 text-center font-mono">
                            {c.enrollment_count.toLocaleString()}
                          </td>
                          <td className="p-3 text-center font-bold">
                            <span
                              className={
                                c.overall_health_score >= 80
                                  ? 'text-emerald-600'
                                  : c.overall_health_score >= 65
                                  ? 'text-blue-600'
                                  : 'text-rose-600'
                              }
                            >
                              {c.overall_health_score.toFixed(0)}%
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                isHighRisk
                                  ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                  : isRefresh
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              }`}
                            >
                              {c.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-[11px] gap-1 hover:text-primary"
                              onClick={() => navigate(`/gov/course/${c.course_id}?district=${encodeURIComponent(report.selected_district)}`)}
                            >
                              <span>Health View</span>
                              <ArrowRight className="size-3" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ========================================================================= */}
          {/* SECTION 3: DISTRICT CAPACITY & DEFICIT ANALYSIS                           */}
          {/* ========================================================================= */}
          <Card className="shadow-sm border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MapPin className="size-4 text-primary" />
                <span>Regional Training Capacity Allocation & Seat Deficit Matrix</span>
              </CardTitle>
              <CardDescription>
                Statewide analysis of districts requiring center seat quota expansion for {report.sector_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {report.district_capacity_allocation.map((d, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">{d.district}</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          d.demand_intensity.includes('Critical')
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                            : 'bg-primary/10 text-primary border-primary/20'
                        }`}
                      >
                        {d.demand_intensity}
                      </Badge>
                    </div>
                    <div className="flex items-baseline justify-between text-xs pt-1 border-t border-border">
                      <span className="text-muted-foreground">Active Sector Openings</span>
                      <span className="font-bold text-primary">{d.openings_count} jobs</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
