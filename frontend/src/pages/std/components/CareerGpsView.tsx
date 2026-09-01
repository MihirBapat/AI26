import { useState, useEffect } from 'react'
import {
  Compass,
  Target,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Briefcase,
  Building2,
  MapPin,
  ExternalLink,
  GraduationCap,
  Percent
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiFetch } from '@/lib/api'

interface CareerRoleData {
  id: string
  title: string
  sector: string
  avgSalary: string
  growthRate: string
  description: string
  requiredSkills: { name: string; priority: 'Critical' | 'High' | 'Medium'; category: string }[]
  searchKeywords: string
  sampleJobTitle: string
}

const POPULAR_ROLES: CareerRoleData[] = [
  {
    id: 'ev-tech',
    title: 'Electric Vehicle (EV) Technician',
    sector: 'Automotive & Clean Energy',
    avgSalary: '₹3.8 - ₹6.2 LPA',
    growthRate: '+34% YoY',
    description: 'Diagnose, repair, and maintain electric powertrain systems, battery management units, and high-voltage charging stations.',
    requiredSkills: [
      { name: 'Battery Management Systems (BMS)', priority: 'Critical', category: 'Technical' },
      { name: 'High-Voltage Safety Protocols', priority: 'Critical', category: 'Safety' },
      { name: 'Electric Motor Diagnostics', priority: 'High', category: 'Technical' },
      { name: 'EV Charging Infrastructure', priority: 'High', category: 'Domain' },
      { name: 'CAN Bus Communication', priority: 'Medium', category: 'Electronics' },
      { name: 'Regenerative Braking Systems', priority: 'Medium', category: 'Mechanical' },
    ],
    searchKeywords: 'electric vehicle EV battery automotive',
    sampleJobTitle: 'EV Technician',
  },
  {
    id: 'data-analyst',
    title: 'Data Analyst / Python Developer',
    sector: 'IT-ITeS & Analytics',
    avgSalary: '₹4.5 - ₹8.0 LPA',
    growthRate: '+28% YoY',
    description: 'Transform raw data into actionable business intelligence using SQL, Python, Excel, and interactive dashboards.',
    requiredSkills: [
      { name: 'Python Programming', priority: 'Critical', category: 'Technical' },
      { name: 'SQL & Database Querying', priority: 'Critical', category: 'Database' },
      { name: 'Data Visualization (PowerBI / Tableau)', priority: 'High', category: 'Analytics' },
      { name: 'Exploratory Data Analysis (Pandas / NumPy)', priority: 'High', category: 'Technical' },
      { name: 'Statistical Foundations', priority: 'Medium', category: 'Math' },
      { name: 'Business Presentation', priority: 'Medium', category: 'Soft Skill' },
    ],
    searchKeywords: 'python data analyst power bi analytics sql',
    sampleJobTitle: 'Data Analyst',
  },
  {
    id: 'solar-pv',
    title: 'Solar PV Installation & Energy Specialist',
    sector: 'Green Jobs & Renewable Energy',
    avgSalary: '₹3.2 - ₹5.5 LPA',
    growthRate: '+42% YoY',
    description: 'Design, mount, connect, and commission rooftop and grid-scale solar photovoltaic systems adhering to CEA safety norms.',
    requiredSkills: [
      { name: 'Solar PV Site Assessment & Layout', priority: 'Critical', category: 'Technical' },
      { name: 'Inverter & Grid Synchronization', priority: 'Critical', category: 'Electrical' },
      { name: 'Earthing & Surge Protection', priority: 'High', category: 'Safety' },
      { name: 'Solar Panel Array Wiring', priority: 'High', category: 'Installation' },
      { name: 'O&M Preventative Inspection', priority: 'Medium', category: 'Maintenance' },
      { name: 'Load Calculation', priority: 'Medium', category: 'Engineering' },
    ],
    searchKeywords: 'solar renewable energy electrical technician',
    sampleJobTitle: 'Solar Technician',
  },
  {
    id: 'cnc-operator',
    title: 'CNC Machine Operator & Programmer',
    sector: 'Capital Goods & Precision Manufacturing',
    avgSalary: '₹3.0 - ₹5.2 LPA',
    growthRate: '+21% YoY',
    description: 'Setup and operate precision CNC milling and lathe machines, write G-code, and verify mechanical tolerances.',
    requiredSkills: [
      { name: 'G-Code & M-Code Programming', priority: 'Critical', category: 'Programming' },
      { name: 'Blueprint & Engineering Drawing Reading', priority: 'Critical', category: 'Design' },
      { name: 'Precision Metrology (Vernier / Micrometer)', priority: 'High', category: 'Quality' },
      { name: 'Tooling & Fixture Setup', priority: 'High', category: 'Mechanical' },
      { name: 'CAD/CAM Basics', priority: 'Medium', category: 'Software' },
      { name: 'Workshop Safety Standards', priority: 'Medium', category: 'Safety' },
    ],
    searchKeywords: 'CNC lathe milling machining manufacturing',
    sampleJobTitle: 'CNC Operator',
  },
  {
    id: 'health-assistant',
    title: 'General Duty & Healthcare Assistant',
    sector: 'Healthcare & Life Sciences',
    avgSalary: '₹2.8 - ₹4.5 LPA',
    growthRate: '+25% YoY',
    description: 'Provide fundamental patient care, administer vitals monitoring, assist clinical teams, and maintain infection control.',
    requiredSkills: [
      { name: 'Vital Signs Monitoring & Recording', priority: 'Critical', category: 'Clinical' },
      { name: 'Infection Prevention & Sterilization', priority: 'Critical', category: 'Safety' },
      { name: 'Basic First Aid & CPR', priority: 'High', category: 'Emergency' },
      { name: 'Patient Mobility & Hygiene Care', priority: 'High', category: 'Caregiving' },
      { name: 'Medical Equipment Handling', priority: 'Medium', category: 'Technical' },
      { name: 'Biomedical Waste Disposal', priority: 'Medium', category: 'Compliance' },
    ],
    searchKeywords: 'healthcare patient care medical assistant nursing',
    sampleJobTitle: 'Healthcare Assistant',
  },
  {
    id: 'cyber-security',
    title: 'Cybersecurity Analyst & SOC Junior',
    sector: 'IT-ITeS & Information Security',
    avgSalary: '₹5.0 - ₹9.5 LPA',
    growthRate: '+38% YoY',
    description: 'Monitor network telemetry, identify vulnerability vectors, respond to threat incidents, and maintain security hygiene.',
    requiredSkills: [
      { name: 'Network Protocols & Packet Analysis', priority: 'Critical', category: 'Networking' },
      { name: 'Vulnerability Scanning & Assessment', priority: 'Critical', category: 'Security' },
      { name: 'SIEM Log Monitoring', priority: 'High', category: 'Operations' },
      { name: 'Linux Command Line Administration', priority: 'High', category: 'OS' },
      { name: 'Incident Response Procedures', priority: 'Medium', category: 'Security' },
      { name: 'OWASP Top 10 Awareness', priority: 'Medium', category: 'Web' },
    ],
    searchKeywords: 'cyber security network analyst security linux',
    sampleJobTitle: 'Cyber Security Analyst',
  },
]

interface CourseItem {
  id: number
  sid_course_id: string
  title: string
  course_type: string
  duration: string | null
  price: number | null
  rating_average: number | null
  certificate_enabled: boolean
  nsqf_level: string | null
  short_description: string | null
  course_url: string | null
}

interface JobItem {
  id: string
  title: string
  company: { display_name: string }
  location: { display_name: string }
  salary_min?: number
  salary_max?: number
  redirect_url: string
  contract_time?: string
}

interface CareerGpsViewProps {
  selectedDistrict: string
}

export function CareerGpsView({ selectedDistrict }: CareerGpsViewProps) {
  const [selectedRole, setSelectedRole] = useState<CareerRoleData>(POPULAR_ROLES[0])
  const [qualification, setQualification] = useState<string>('Diploma / ITI')
  const [acquiredSkills, setAcquiredSkills] = useState<string[]>([])
  
  const [recommendedCourses, setRecommendedCourses] = useState<CourseItem[]>([])
  const [matchingJobs, setMatchingJobs] = useState<JobItem[]>([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [loadingJobs, setLoadingJobs] = useState(false)

  // Pre-populate with first 2 skills as default when switching role
  useEffect(() => {
    if (selectedRole.requiredSkills.length > 0) {
      setAcquiredSkills([selectedRole.requiredSkills[0].name])
    }
  }, [selectedRole])

  // Toggle skill check
  const toggleSkill = (skillName: string) => {
    setAcquiredSkills(prev =>
      prev.includes(skillName)
        ? prev.filter(s => s !== skillName)
        : [...prev, skillName]
    )
  }

  // Calculate Match Score
  const totalSkillsCount = selectedRole.requiredSkills.length
  const matchedSkillsCount = selectedRole.requiredSkills.filter(s => acquiredSkills.includes(s.name)).length
  const matchPercentage = Math.round((matchedSkillsCount / totalSkillsCount) * 100)

  // Missing Skills
  const missingSkills = selectedRole.requiredSkills.filter(s => !acquiredSkills.includes(s.name))

  // Fetch Recommended SID Courses matching the role and missing skills
  useEffect(() => {
    const fetchCourses = async () => {
      setLoadingCourses(true)
      try {
        const queryTerm = selectedRole.title.split(' ')[0] // e.g. Electric, Data, Solar, CNC
        const res = await apiFetch<{ items: CourseItem[] }>(`/courses?search=${encodeURIComponent(queryTerm)}&size=4`)
        setRecommendedCourses(res.items || [])
      } catch {
        setRecommendedCourses([])
      } finally {
        setLoadingCourses(false)
      }
    }

    fetchCourses()
  }, [selectedRole])

  // Fetch Live Jobs for Role and District
  useEffect(() => {
    const fetchJobs = async () => {
      setLoadingJobs(true)
      try {
        const whereParam = selectedDistrict === 'All Maharashtra' ? 'Maharashtra' : selectedDistrict
        const res = await apiFetch<{ results: JobItem[] }>(`/jobs/search?what=${encodeURIComponent(selectedRole.sampleJobTitle)}&where=${encodeURIComponent(whereParam)}&results_per_page=3`)
        setMatchingJobs(res.results || [])
      } catch {
        setMatchingJobs([])
      } finally {
        setLoadingJobs(false)
      }
    }

    fetchJobs()
  }, [selectedRole, selectedDistrict])

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-background border border-primary/20 p-6 sm:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Compass className="size-3.5" />
              Evidence-Based Career GPS
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Map Your Path to High-Demand Careers
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Select your dream role, check your current skills, and let the AI detect your readiness score, flag skill gaps, and recommend certified courses aligned with employer demand in {selectedDistrict}.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-card/80 backdrop-blur-sm p-4 rounded-xl border border-border shadow-sm shrink-0">
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Percent className="size-6" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Skill Readiness</div>
              <div className="text-2xl font-bold text-foreground">{matchPercentage}% Match</div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1 & 2: Select Role & Qualification */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role Selector Card */}
        <Card className="lg:col-span-2 border-border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="size-5 text-primary" />
                  Step 1: Choose Your Target Career Role
                </CardTitle>
                <CardDescription>
                  High-demand job roles prioritized by Maharashtra State Innovation Society &amp; Industry councils
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {POPULAR_ROLES.map(role => {
                const isSelected = selectedRole.id === role.id
                return (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                        : 'border-border bg-card hover:border-border/80 hover:bg-muted/30'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-semibold text-sm text-foreground">{role.title}</span>
                        {isSelected && <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {role.sector}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
                      <span className="font-medium text-foreground">{role.avgSalary}</span>
                      <span className="text-emerald-600 font-semibold">{role.growthRate}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Candidate Profile Context */}
        <Card className="border-border shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" />
              Step 2: Candidate Context
            </CardTitle>
            <CardDescription>Your current educational qualification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Current Qualification
              </label>
              <select
                value={qualification}
                onChange={e => setQualification(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="10th / 12th Pass">10th / 12th Pass</option>
                <option value="Diploma / ITI">Diploma / ITI Certified</option>
                <option value="Graduate (B.Sc / B.Com / B.A)">Graduate (B.Sc / B.Com / B.A)</option>
                <option value="Engineering (B.Tech / B.E)">Engineering (B.Tech / B.E)</option>
                <option value="Post-Graduate / Professional">Post-Graduate / Professional</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Target District
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border bg-muted/40 text-sm font-medium text-foreground">
                <MapPin className="size-4 text-primary shrink-0" />
                <span>{selectedDistrict}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-foreground/90 space-y-1">
              <div className="font-semibold flex items-center gap-1.5 text-primary">
                <Sparkles className="size-3.5" />
                Industry Alignment Note
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Candidates with <strong>{qualification}</strong> in <strong>{selectedDistrict}</strong> can bridge requirements for <strong>{selectedRole.title}</strong> within 6 to 12 weeks of modular skilling.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step 3: Interactive Skill Assessment & Gap Analyzer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Skills Matrix */}
        <Card className="lg:col-span-7 border-border shadow-sm">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-primary" />
                  Step 3: Check Skills You Already Possess
                </CardTitle>
                <CardDescription>
                  Select what you know to discover your specific industry skill gaps
                </CardDescription>
              </div>
              <Badge variant="outline" className="w-fit text-xs font-normal">
                {matchedSkillsCount} of {totalSkillsCount} Acquired
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedRole.requiredSkills.map(skill => {
              const isChecked = acquiredSkills.includes(skill.name)
              return (
                <label
                  key={skill.name}
                  onClick={() => toggleSkill(skill.name)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'border-primary/60 bg-primary/10 text-foreground'
                      : 'border-border bg-card hover:bg-muted/30 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="size-4.5 rounded border-border text-primary focus:ring-primary/20 pointer-events-none"
                    />
                    <div>
                      <span className={`text-sm font-medium ${isChecked ? 'text-foreground font-semibold' : ''}`}>
                        {skill.name}
                      </span>
                      <div className="text-[11px] text-muted-foreground">{skill.category}</div>
                    </div>
                  </div>

                  <Badge
                    variant={skill.priority === 'Critical' ? 'destructive' : skill.priority === 'High' ? 'default' : 'secondary'}
                    className="text-[10px] px-2 py-0.5"
                  >
                    {skill.priority}
                  </Badge>
                </label>
              )
            })}
          </CardContent>
        </Card>

        {/* Skill Gap Results & Readiness Gauge */}
        <Card className="lg:col-span-5 border-border shadow-sm flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-500" />
              Skill Gap &amp; Readiness Analysis
            </CardTitle>
            <CardDescription>Real-time competency assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Progress Visual */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Career Match Score</span>
                <span className="text-primary font-bold text-sm">{matchPercentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    matchPercentage >= 70
                      ? 'bg-emerald-500'
                      : matchPercentage >= 40
                      ? 'bg-primary'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${matchPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {matchPercentage >= 80
                  ? '🎉 Outstanding! You are highly job-ready for this role.'
                  : matchPercentage >= 50
                  ? '⚡ Good foundation! Complete the recommended short courses below to close remaining gaps.'
                  : '🎯 High-priority gaps detected. Follow the recommended learning path to qualify.'}
              </p>
            </div>

            {/* Identified Missing Skills */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Missing Skills to Acquire ({missingSkills.length})
              </div>
              {missingSkills.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>All core skills acquired for this role!</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {missingSkills.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-background text-xs"
                    >
                      <span className="font-medium text-foreground">{s.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {s.priority} Gap
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step 4: Recommended Skill India Digital Courses */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="size-5 text-primary" />
              Recommended Courses to Bridge Your Gaps
            </h2>
            <p className="text-sm text-muted-foreground">
              Certified Skill India Digital courses mapping to <strong>{selectedRole.title}</strong>
            </p>
          </div>
        </div>

        {loadingCourses ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-48 rounded-xl bg-muted/40 animate-pulse border border-border" />
            ))}
          </div>
        ) : recommendedCourses.length === 0 ? (
          <Card className="p-8 text-center border-dashed">
            <p className="text-muted-foreground text-sm">No direct course mappings found for this search term.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedCourses.map(course => (
              <Card key={course.id} className="border-border shadow-sm flex flex-col justify-between hover:border-primary/50 transition-all">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {course.course_type || 'Online'}
                    </Badge>
                    {course.certificate_enabled && (
                      <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 font-medium">
                        Certificate
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-sm font-semibold leading-snug line-clamp-2 text-foreground">
                    {course.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {course.short_description || 'Master practical skills with certified curriculum aligned to industry requirements.'}
                  </p>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
                    <span className="font-semibold text-foreground">
                      {course.price && course.price > 0 ? `₹${course.price}` : 'Free'}
                    </span>
                    <span className="text-muted-foreground">{course.duration || 'Flexible'}</span>
                  </div>
                  {course.course_url && (
                    <a
                      href={course.course_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                    >
                      <span>Enroll on SID</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Step 5: Matching Live Job Postings in Maharashtra */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Briefcase className="size-5 text-primary" />
              Live Hiring Postings in {selectedDistrict}
            </h2>
            <p className="text-sm text-muted-foreground">
              Current employment vacancies seeking candidates for <strong>{selectedRole.title}</strong>
            </p>
          </div>
        </div>

        {loadingJobs ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-36 rounded-xl bg-muted/40 animate-pulse border border-border" />
            ))}
          </div>
        ) : matchingJobs.length === 0 ? (
          <Card className="p-6 text-center border-dashed">
            <p className="text-muted-foreground text-sm">
              No live job postings currently returned for this role in {selectedDistrict}. Check broader district filters in the Job Market tab.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {matchingJobs.map(job => (
              <Card key={job.id} className="border-border shadow-sm flex flex-col justify-between hover:border-primary/50 transition-all p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {job.contract_time || 'Full-time'}
                    </Badge>
                    <span className="text-xs text-emerald-600 font-semibold">
                      {job.salary_min ? `₹${Math.round(job.salary_min / 1000)}k - ₹${Math.round((job.salary_max || job.salary_min * 1.5) / 1000)}k` : 'Competitive'}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground line-clamp-1">{job.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="size-3.5 shrink-0" />
                    <span className="line-clamp-1">{job.company?.display_name || 'Hiring Employer'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="line-clamp-1">{job.location?.display_name || selectedDistrict}</span>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-border">
                  <a
                    href={job.redirect_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-border bg-background hover:bg-muted text-xs font-medium text-foreground transition-colors"
                  >
                    <span>View Opening</span>
                    <ExternalLink className="size-3" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
