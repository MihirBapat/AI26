import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BookOpen,
  Users,
  Building2,
  Layers,
  Search,
  Award,
  Globe,
  MapPin,
  Clock,
  Star,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  Loader2,
  CheckCircle2,
  FileText,
  Briefcase,
  Sparkles
} from 'lucide-react'
import { apiFetch } from '@/lib/api'

interface CourseStats {
  total_courses: number
  online_courses: number
  offline_courses: number
  free_courses: number
  paid_courses: number
  total_enrollments: number
  unique_providers: number
  unique_sectors: number
  avg_rating: number | null
  with_certificate: number
}

interface ProviderBrief {
  id: number
  name: string
}

interface SectorBrief {
  id: number
  name: string
}

interface DomainBrief {
  id: number
  name: string
}

interface CourseListItem {
  id: number
  sid_course_id: string
  title: string
  course_type: string
  language: string | null
  price: number | null
  duration_minutes: number | null
  enrollment_count: number
  rating_average: number | null
  total_ratings: number
  availability: string | null
  certificate_enabled: boolean | null
  course_image_url: string | null
  provider: ProviderBrief | null
  sectors: SectorBrief[]
  domains: DomainBrief[]
}

interface CourseDetail extends CourseListItem {
  short_description: string | null
  long_description: string | null
  learning_outcome: string | null
  nsqf_level: string | null
  min_age: number | null
  max_age: number | null
  min_education: string | null
  course_url: string | null
  occupations?: { id: number; name: string }[]
  tags?: { id: number; name: string }[]
  qp_codes?: { id: number; code: string }[]
  nos_codes?: { id: number; code: string }[]
  skill_sets?: { id: number; name: string }[]
}

interface PaginatedCourses {
  items: CourseListItem[]
  total: number
  page: number
  size: number
  pages: number
}

interface Sector {
  id: number
  name: string
}

interface CourseViewProps {
  district?: string
}

export function CourseView({ district = 'All Maharashtra' }: CourseViewProps) {
  const navigate = useNavigate()

  const openHealthReport = (courseId: number) => {
    const query = district && district !== 'All Maharashtra' ? `?district=${encodeURIComponent(district)}` : ''
    navigate(`/gov/course/${courseId}${query}`)
  }

  // Stats KPI State
  const [stats, setStats] = useState<CourseStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Course Listing State
  const [courses, setCourses] = useState<CourseListItem[]>([])
  const [totalCourses, setTotalCourses] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(12)
  const [coursesLoading, setCoursesLoading] = useState(false)

  // Filters State
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [sectors, setSectors] = useState<Sector[]>([])
  const [selectedSectorId, setSelectedSectorId] = useState<string>('all')
  const [selectedCourseType, setSelectedCourseType] = useState<string>('all')
  const [selectedPriceFilter, setSelectedPriceFilter] = useState<string>('all')
  const [certificateOnly, setCertificateOnly] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('enrollment_count')
  const [sortOrder, setSortOrder] = useState<string>('desc')

  // Selected Course Detail for Modal
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Fetch KPI Stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true)
        const data = await apiFetch<CourseStats>('/courses/stats')
        setStats(data)
      } catch (err) {
        console.error('Failed to load course stats', err)
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [])

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

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch Courses with Filters
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setCoursesLoading(true)
        const params = new URLSearchParams()
        params.append('page', page.toString())
        params.append('size', pageSize.toString())

        if (debouncedSearch.trim()) {
          params.append('search', debouncedSearch.trim())
        }
        if (selectedSectorId !== 'all') {
          params.append('sector_id', selectedSectorId)
        }
        if (selectedCourseType !== 'all') {
          params.append('course_type', selectedCourseType)
        }
        if (selectedPriceFilter === 'free') {
          params.append('free_only', 'true')
        }
        if (certificateOnly === 'true') {
          params.append('has_certificate', 'true')
        }
        if (sortBy) {
          params.append('sort_by', sortBy)
          params.append('sort_order', sortOrder)
        }

        const data = await apiFetch<PaginatedCourses>(`/courses?${params.toString()}`)
        setCourses(data.items || [])
        setTotalCourses(data.total || 0)
      } catch (err) {
        console.error('Failed to load courses', err)
        setCourses([])
      } finally {
        setCoursesLoading(false)
      }
    }
    fetchCourses()
  }, [page, pageSize, debouncedSearch, selectedSectorId, selectedCourseType, selectedPriceFilter, certificateOnly, sortBy, sortOrder])

  // Fetch Course Details when ID changes
  useEffect(() => {
    if (!selectedCourseId) {
      setCourseDetail(null)
      return
    }

    const fetchDetail = async () => {
      try {
        setDetailLoading(true)
        const data = await apiFetch<CourseDetail>(`/courses/${selectedCourseId}`)
        setCourseDetail(data)
      } catch (err) {
        console.error('Failed to load course details', err)
      } finally {
        setDetailLoading(false)
      }
    }
    fetchDetail()
  }, [selectedCourseId])

  const handleResetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setSelectedSectorId('all')
    setSelectedCourseType('all')
    setSelectedPriceFilter('all')
    setCertificateOnly('all')
    setSortBy('enrollment_count')
    setSortOrder('desc')
    setPage(1)
  }

  const hasActiveFilters =
    debouncedSearch.trim() !== '' ||
    selectedSectorId !== 'all' ||
    selectedCourseType !== 'all' ||
    selectedPriceFilter !== 'all' ||
    certificateOnly !== 'all' ||
    sortBy !== 'enrollment_count'

  const totalPages = Math.ceil(totalCourses / pageSize) || 1

  const formatDuration = (minutes: number | null) => {
    if (!minutes || minutes <= 0) return 'Self-Paced'
    if (minutes < 60) return `${minutes} mins`
    const hrs = Math.floor(minutes / 60)
    const rem = minutes % 60
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs} hrs`
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ========================================================================= */}
      {/* 1. TOP KPI STATS SUMMARY CARDS                                           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Courses Catalogued</CardTitle>
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {statsLoading ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : (stats?.total_courses ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-primary font-semibold">{stats?.online_courses ?? 0}</span> Online ·{' '}
              <span className="text-foreground font-semibold">{stats?.offline_courses ?? 0}</span> In-Center
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Student Enrollments</CardTitle>
            <div className="size-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {statsLoading ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : (stats?.total_enrollments ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all registered candidates</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Certified Training Providers</CardTitle>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Building2 className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {statsLoading ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : (stats?.unique_providers ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">NSDC / SID registered institutions</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">Industry Sectors Covered</CardTitle>
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Layers className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {statsLoading ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : (stats?.unique_sectors ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-emerald-600 font-semibold">{stats?.free_courses ?? 0}</span> Free ·{' '}
              <span className="text-muted-foreground font-semibold">{stats?.paid_courses ?? 0}</span> Subsidized/Paid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 2. SEARCH & FILTER CONTROLS BAR                                           */}
      {/* ========================================================================= */}
      <Card className="shadow-sm border-border bg-card">
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Row 1: Search & Reset */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search courses by keyword, role, technology, or skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 h-10 text-sm bg-background"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-10 px-3 text-xs text-muted-foreground hover:text-foreground shrink-0 flex items-center gap-1.5"
              >
                <RotateCcw className="size-3.5" />
                <span>Reset Filters</span>
              </Button>
            )}
          </div>

          {/* Row 2: Select Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1 border-t border-border">
            {/* Sector Select */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Sector</label>
              <Select
                value={selectedSectorId}
                onValueChange={(val) => {
                  if (val) {
                    setSelectedSectorId(val)
                    setPage(1)
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="All Sectors">
                    {selectedSectorId === 'all'
                      ? 'All Sectors'
                      : sectors.find((s) => s.id.toString() === selectedSectorId)?.name || 'All Sectors'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all" className="text-xs font-semibold">All Sectors</SelectItem>
                  {sectors.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()} className="text-xs">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Delivery Mode / Location Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Delivery Mode</label>
              <Select
                value={selectedCourseType}
                onValueChange={(val) => {
                  if (val) {
                    setSelectedCourseType(val)
                    setPage(1)
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="All Modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs font-semibold">All Modes</SelectItem>
                  <SelectItem value="Online" className="text-xs">Online / Digital</SelectItem>
                  <SelectItem value="Offline" className="text-xs">Offline / In-Center</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pricing Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Pricing Structure</label>
              <Select
                value={selectedPriceFilter}
                onValueChange={(val) => {
                  if (val) {
                    setSelectedPriceFilter(val)
                    setPage(1)
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="All Pricing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs font-semibold">All Pricing</SelectItem>
                  <SelectItem value="free" className="text-xs text-emerald-600 font-medium">Free of Cost</SelectItem>
                  <SelectItem value="paid" className="text-xs">Paid / Subsidized</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Certificate Filter */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Certification</label>
              <Select
                value={certificateOnly}
                onValueChange={(val) => {
                  if (val) {
                    setCertificateOnly(val)
                    setPage(1)
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="All Courses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs font-semibold">All Courses</SelectItem>
                  <SelectItem value="true" className="text-xs text-primary font-medium">Certificate Included</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sorting Order */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground">Sort By</label>
              <Select
                value={`${sortBy}:${sortOrder}`}
                onValueChange={(val) => {
                  if (val) {
                    const [field, order] = val.split(':')
                    setSortBy(field)
                    setSortOrder(order)
                    setPage(1)
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs bg-background">
                  <SelectValue placeholder="Sort Order" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enrollment_count:desc" className="text-xs">Most Enrolled</SelectItem>
                  <SelectItem value="rating_average:desc" className="text-xs">Highest Rated</SelectItem>
                  <SelectItem value="price:asc" className="text-xs">Price: Low to High</SelectItem>
                  <SelectItem value="price:desc" className="text-xs">Price: High to Low</SelectItem>
                  <SelectItem value="title:asc" className="text-xs">Title: A to Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 3. COURSES RESULTS HEADER & SUMMARY                                       */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{courses.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to{' '}
          <span className="font-semibold text-foreground">{Math.min(page * pageSize, totalCourses)}</span> of{' '}
          <span className="font-semibold text-foreground">{totalCourses.toLocaleString()}</span> Courses
          {debouncedSearch && (
            <span> matching <strong className="text-foreground">"{debouncedSearch}"</strong></span>
          )}
        </div>

        {totalPages > 1 && (
          <div className="text-xs text-muted-foreground">
            Page <span className="font-semibold text-foreground">{page}</span> of <span className="font-semibold text-foreground">{totalPages}</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. COURSE CARDS GRID                                                      */}
      {/* ========================================================================= */}
      {coursesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-card border-border h-[280px] flex flex-col justify-between p-5 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="h-5 w-20 bg-muted rounded-full" />
                  <div className="h-5 w-16 bg-muted rounded-full" />
                </div>
                <div className="h-6 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded" />
              </div>
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-muted rounded" />
                  <div className="h-4 w-20 bg-muted rounded" />
                </div>
                <div className="h-9 w-full bg-muted rounded-xl mt-2" />
              </div>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-border bg-card">
          <BookOpen className="size-10 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">No courses found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            We couldn't find any courses matching your selected search query or filters. Try adjusting your criteria.
          </p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-4 text-xs">
              <RotateCcw className="size-3.5 mr-1.5" />
              Clear All Filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => {
            const isOnline = course.course_type.toLowerCase() === 'online'
            const isFree = course.price === 0 || course.price === null

            return (
              <Card
                key={course.id}
                className="group flex flex-col justify-between border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200 overflow-hidden"
              >
                <div>
                  {/* Top Badge Strip */}
                  <div className="p-4 pb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {isOnline ? (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[11px] font-medium flex items-center gap-1">
                          <Globe className="size-3" />
                          <span>Online</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px] font-medium flex items-center gap-1">
                          <MapPin className="size-3" />
                          <span>In-Center (Offline)</span>
                        </Badge>
                      )}

                      {course.certificate_enabled && (
                        <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
                          <Award className="size-3" />
                          <span>Certificate</span>
                        </Badge>
                      )}
                    </div>

                    <div className="font-bold text-xs">
                      {isFree ? (
                        <span className="text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">Free</span>
                      ) : (
                        <span className="text-foreground">₹{course.price?.toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Course Title & Provider */}
                  <div className="px-4 py-1 space-y-1.5">
                    <h3
                      className="font-semibold text-sm sm:text-base text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors cursor-pointer"
                      onClick={() => openHealthReport(course.id)}
                      title={course.title}
                    >
                      {course.title}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                      <Building2 className="size-3.5 shrink-0 text-muted-foreground/70" />
                      <span className="truncate" title={course.provider?.name || 'Skill India Digital'}>
                        {course.provider?.name || 'Skill India Digital'}
                      </span>
                    </div>
                  </div>

                  {/* Sectors / Domains Chips */}
                  {course.sectors && course.sectors.length > 0 && (
                    <div className="px-4 py-2 flex flex-wrap gap-1.5">
                      {course.sectors.slice(0, 2).map((sec) => (
                        <span
                          key={sec.id}
                          className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60"
                        >
                          {sec.name}
                        </span>
                      ))}
                      {course.sectors.length > 2 && (
                        <span className="text-[10px] text-muted-foreground self-center">
                          +{course.sectors.length - 2} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Bottom: Metadata & Action */}
                <div className="p-4 pt-3 border-t border-border/80 bg-muted/10 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
                    <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-background border border-border/50">
                      <Clock className="size-3.5 text-muted-foreground/70 mb-0.5" />
                      <span className="text-[11px] font-medium text-foreground truncate max-w-full">
                        {formatDuration(course.duration_minutes)}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-background border border-border/50">
                      <Users className="size-3.5 text-blue-500/80 mb-0.5" />
                      <span className="text-[11px] font-medium text-foreground truncate max-w-full">
                        {course.enrollment_count ? course.enrollment_count.toLocaleString() : '0'}
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center p-1.5 rounded-lg bg-background border border-border/50">
                      <Star className="size-3.5 text-amber-500 fill-amber-500 mb-0.5" />
                      <span className="text-[11px] font-medium text-foreground">
                        {course.rating_average ? course.rating_average.toFixed(1) : '4.5'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-[11px] font-medium hover:bg-muted"
                      onClick={() => setSelectedCourseId(course.id)}
                    >
                      <span>Preview</span>
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-[11px] font-semibold bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-1 shadow-xs"
                      onClick={() => openHealthReport(course.id)}
                    >
                      <Sparkles className="size-3" />
                      <span>Health Report</span>
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PAGINATION CONTROLS                                                     */}
      {/* ========================================================================= */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Showing Page <span className="font-semibold text-foreground">{page}</span> of <span className="font-semibold text-foreground">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || coursesLoading}
              className="h-8 text-xs gap-1"
            >
              <ChevronLeft className="size-3.5" />
              <span>Previous</span>
            </Button>

            <div className="flex items-center gap-1 px-2 text-xs">
              <span className="font-semibold text-foreground">{page}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{totalPages}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || coursesLoading}
              className="h-8 text-xs gap-1"
            >
              <span>Next</span>
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. COURSE DETAILS MODAL / DIALOG                                          */}
      {/* ========================================================================= */}
      {selectedCourseId !== null && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            {detailLoading || !courseDetail ? (
              <div className="flex flex-col items-center justify-center p-12 space-y-3">
                <Loader2 className="size-8 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Loading course curriculum...</span>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {courseDetail.course_type === 'Online' ? 'Online Mode' : 'In-Center / Offline'}
                      </Badge>
                      {courseDetail.nsqf_level && (
                        <Badge variant="secondary" className="text-xs">
                          NSQF Level {courseDetail.nsqf_level}
                        </Badge>
                      )}
                      {courseDetail.certificate_enabled && (
                        <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                          Certificate Included
                        </Badge>
                      )}
                    </div>

                    <h2 className="text-xl font-bold text-foreground leading-tight">
                      {courseDetail.title}
                    </h2>

                    <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-primary" />
                      <span>{courseDetail.provider?.name || 'Skill India Digital Partner'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCourseId(null)}
                    className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                  >
                    <X className="size-5" />
                  </button>
                </div>

                {/* Key Metrics Quick Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border text-xs">
                  <div>
                    <span className="text-muted-foreground block">Cost</span>
                    <span className="font-bold text-foreground text-sm">
                      {courseDetail.price && courseDetail.price > 0
                        ? `₹${courseDetail.price.toLocaleString()}`
                        : 'Free of Cost'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Duration</span>
                    <span className="font-semibold text-foreground text-sm">
                      {formatDuration(courseDetail.duration_minutes)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Total Enrolled</span>
                    <span className="font-semibold text-foreground text-sm">
                      {courseDetail.enrollment_count ? courseDetail.enrollment_count.toLocaleString() : '0'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Rating</span>
                    <span className="font-semibold text-foreground text-sm flex items-center gap-1">
                      <Star className="size-3.5 text-amber-500 fill-amber-500" />
                      {courseDetail.rating_average ? courseDetail.rating_average.toFixed(1) : '4.5'}
                    </span>
                  </div>
                </div>

                {/* Course Overview */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <FileText className="size-4 text-primary" />
                    Course Overview
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {courseDetail.long_description ||
                      courseDetail.short_description ||
                      'Standard curriculum mapped to national occupational standards and industry competency requirements.'}
                  </p>
                </div>

                {/* Learning Outcomes */}
                {courseDetail.learning_outcome && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="size-4 text-emerald-500" />
                      Expected Learning Outcomes
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-lg border border-border">
                      {courseDetail.learning_outcome}
                    </p>
                  </div>
                )}

                {/* Sectors & Domains */}
                {courseDetail.sectors && courseDetail.sectors.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Layers className="size-4 text-primary" />
                      Mapped Industry Sectors
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {courseDetail.sectors.map((sec) => (
                        <Badge key={sec.id} variant="secondary" className="text-xs">
                          {sec.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mapped Occupations & Roles */}
                {courseDetail.occupations && courseDetail.occupations.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <Briefcase className="size-4 text-primary" />
                      Target Occupations & Job Roles
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {courseDetail.occupations.map((occ) => (
                        <Badge key={occ.id} variant="outline" className="text-xs bg-background">
                          {occ.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* National Occupational Standards (QP & NOS) */}
                {((courseDetail.qp_codes && courseDetail.qp_codes.length > 0) ||
                  (courseDetail.nos_codes && courseDetail.nos_codes.length > 0)) && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      National Occupational Standards (NOS / QP)
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {courseDetail.qp_codes?.map((qp) => (
                        <Badge key={qp.id} variant="outline" className="text-[11px] font-mono">
                          QP: {qp.code}
                        </Badge>
                      ))}
                      {courseDetail.nos_codes?.map((nos) => (
                        <Badge key={nos.id} variant="outline" className="text-[11px] font-mono">
                          NOS: {nos.code}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                  <Button variant="outline" size="sm" onClick={() => setSelectedCourseId(null)}>
                    Close
                  </Button>
                  {courseDetail.course_url && (
                    <a
                      href={courseDetail.course_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      <span>Open on Skill India Digital</span>
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
