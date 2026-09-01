import { useState, useEffect } from 'react'
import {
  Search,
  BookOpen,
  ExternalLink,
  Award,
  Clock,
  Star,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/lib/api'

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
  enrolment_count?: number | null
}

interface CourseDetail extends CourseItem {
  description?: string | null
  provider_name?: string | null
  sectors?: { id: number; name: string }[]
  domains?: { id: number; name: string }[]
  tags?: { id: number; name: string }[]
  qp_codes?: { id: number; code: string }[]
  nos_codes?: { id: number; code: string }[]
  skill_sets?: { id: number; name: string }[]
}

interface Sector {
  id: number
  name: string
}

interface CourseCatalogViewProps {
  initialSectorId?: string
  initialSearch?: string
  onBack?: () => void
}

export function CourseCatalogView({ initialSectorId, initialSearch, onBack }: CourseCatalogViewProps = {}) {
  const [courses, setCourses] = useState<CourseItem[]>([])
  const [totalCourses, setTotalCourses] = useState<number>(0)
  const [page, setPage] = useState<number>(1)
  const [pageSize] = useState<number>(12)
  const [search, setSearch] = useState<string>(initialSearch || '')
  const [debouncedSearch, setDebouncedSearch] = useState<string>(initialSearch || '')

  const [sectors, setSectors] = useState<Sector[]>([])
  const [selectedSectorId, setSelectedSectorId] = useState<string>(initialSectorId || 'all')
  const [courseType, setCourseType] = useState<string>('all')
  const [freeOnly, setFreeOnly] = useState<boolean>(false)
  const [hasCertificate, setHasCertificate] = useState<boolean>(false)

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [selectedCourseDetail, setSelectedCourseDetail] = useState<CourseDetail | null>(null)

  // Sync initialSectorId when prop changes
  useEffect(() => {
    if (initialSectorId) {
      setSelectedSectorId(initialSectorId)
      setPage(1)
    }
  }, [initialSectorId])

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(handler)
  }, [search])

  // Load Sectors list
  useEffect(() => {
    const loadSectors = async () => {
      try {
        const data = await apiFetch<Sector[]>('/lookups/sectors')
        setSectors(data)
      } catch (err) {
        console.error('Failed to load sectors', err)
      }
    }
    loadSectors()
  }, [])

  // Load Courses with filters
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        params.append('page', page.toString())
        params.append('size', pageSize.toString())

        if (debouncedSearch.trim()) {
          params.append('search', debouncedSearch.trim())
        }
        if (selectedSectorId !== 'all') {
          params.append('sector_id', selectedSectorId)
        }
        if (courseType !== 'all') {
          params.append('course_type', courseType)
        }
        if (freeOnly) {
          params.append('free_only', 'true')
        }
        if (hasCertificate) {
          params.append('has_certificate', 'true')
        }

        const res = await apiFetch<{ items: CourseItem[]; total: number }>(`/courses?${params.toString()}`)
        setCourses(res.items || [])
        setTotalCourses(res.total || 0)
      } catch (err) {
        console.error('Failed to fetch courses', err)
        setCourses([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourses()
  }, [page, pageSize, debouncedSearch, selectedSectorId, courseType, freeOnly, hasCertificate])

  const openCourseDetail = async (id: number) => {
    try {
      const data = await apiFetch<CourseDetail>(`/courses/${id}`)
      setSelectedCourseDetail(data)
    } catch (err) {
      console.error('Failed to load course detail', err)
    }
  }

  const totalPages = Math.ceil(totalCourses / pageSize) || 1

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back Button if routed from Dashboard */}
      {onBack && (
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="gap-2 text-xs font-semibold hover:bg-muted shadow-xs"
          >
            <ChevronLeft className="size-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="size-6 text-primary" />
            Skill India Digital Course Catalog
          </h1>
          <p className="text-muted-foreground text-sm">
            Explore 1,890+ certified courses, NSQF qualifications, and modular training programs
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1.5 text-xs font-semibold text-primary border-primary/30 bg-primary/5">
          {totalCourses.toLocaleString()} Courses Available
        </Badge>
      </div>

      {/* Filter & Search Bar Card */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4 sm:p-6 space-y-4">
          {/* Search Row */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search courses by skill, topic, technology, or title (e.g. Python, Solar, CNC, Electrician)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-11 text-sm bg-background"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Filter Controls Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            {/* Sector Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">Sector</label>
              <select
                value={selectedSectorId}
                onChange={e => {
                  setSelectedSectorId(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Sectors ({sectors.length})</option>
                {sectors.map(s => (
                  <option key={s.id} value={s.id.toString()}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Course Mode Dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">Delivery Mode</label>
              <select
                value={courseType}
                onChange={e => {
                  setCourseType(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="all">All Modes</option>
                <option value="Online">Online Courses</option>
                <option value="Offline">Offline / Classroom Training</option>
              </select>
            </div>

            {/* Free Courses Toggle */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">Pricing Filter</label>
              <button
                onClick={() => {
                  setFreeOnly(!freeOnly)
                  setPage(1)
                }}
                className={`w-full h-[38px] px-3 rounded-lg border text-xs font-medium flex items-center justify-between transition-colors ${
                  freeOnly
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-input bg-background text-muted-foreground hover:bg-muted/30'
                }`}
              >
                <span>Free Courses Only</span>
                {freeOnly && <CheckCircle className="size-3.5 text-primary" />}
              </button>
            </div>

            {/* Certificate Toggle */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">Certification</label>
              <button
                onClick={() => {
                  setHasCertificate(!hasCertificate)
                  setPage(1)
                }}
                className={`w-full h-[38px] px-3 rounded-lg border text-xs font-medium flex items-center justify-between transition-colors ${
                  hasCertificate
                    ? 'border-primary bg-primary/10 text-primary font-semibold'
                    : 'border-input bg-background text-muted-foreground hover:bg-muted/30'
                }`}
              >
                <span>Certificate Included</span>
                {hasCertificate && <Award className="size-3.5 text-primary" />}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-muted/40 animate-pulse border border-border" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <BookOpen className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="text-base font-semibold text-foreground">No courses found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Try adjusting your search keywords, sector, or removing filters.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {courses.map(course => (
            <Card
              key={course.id}
              className="border-border shadow-sm flex flex-col justify-between hover:border-primary/50 transition-all group cursor-pointer"
              onClick={() => openCourseDetail(course.id)}
            >
              <CardHeader className="p-4 pb-2 space-y-2">
                <div className="flex items-center justify-between gap-1.5">
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {course.course_type || 'Online'}
                  </Badge>
                  {course.nsqf_level && (
                    <Badge variant="secondary" className="text-[10px]">
                      NSQF {course.nsqf_level}
                    </Badge>
                  )}
                  {course.certificate_enabled && (
                    <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 font-medium">
                      Cert
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-sm font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                  {course.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 pt-0 space-y-3">
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {course.short_description || 'Structured course curriculum designed to build practical industry competencies.'}
                </p>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
                  <div className="flex items-center gap-1 font-semibold text-foreground">
                    {course.price && course.price > 0 ? (
                      `₹${course.price.toLocaleString()}`
                    ) : (
                      <span className="text-emerald-600 font-bold">Free</span>
                    )}
                  </div>
                  {course.duration && (
                    <div className="flex items-center gap-1 text-muted-foreground text-[11px]">
                      <Clock className="size-3" />
                      <span>{course.duration}</span>
                    </div>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-8 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                  onClick={e => {
                    e.stopPropagation()
                    openCourseDetail(course.id)
                  }}
                >
                  View Details &amp; Curriculum
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            Showing Page <span className="font-semibold text-foreground">{page}</span> of{' '}
            <span className="font-semibold text-foreground">{totalPages}</span> ({totalCourses.toLocaleString()} total)
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="h-8 text-xs"
            >
              <ChevronLeft className="size-3.5 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="h-8 text-xs"
            >
              Next
              <ChevronRight className="size-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Course Details Modal */}
      {selectedCourseDetail && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {selectedCourseDetail.course_type}
                  </Badge>
                  {selectedCourseDetail.nsqf_level && (
                    <Badge variant="secondary" className="text-xs">
                      NSQF Level {selectedCourseDetail.nsqf_level}
                    </Badge>
                  )}
                  {selectedCourseDetail.certificate_enabled && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                      Certificate Included
                    </Badge>
                  )}
                </div>
                <h2 className="text-xl font-bold text-foreground leading-tight">
                  {selectedCourseDetail.title}
                </h2>
              </div>

              <button
                onClick={() => setSelectedCourseDetail(null)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border text-xs">
              <div>
                <span className="text-muted-foreground block">Price</span>
                <span className="font-bold text-foreground text-sm">
                  {selectedCourseDetail.price && selectedCourseDetail.price > 0
                    ? `₹${selectedCourseDetail.price.toLocaleString()}`
                    : 'Free of Cost'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Duration</span>
                <span className="font-semibold text-foreground">
                  {selectedCourseDetail.duration || 'Self-paced'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Rating</span>
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <Star className="size-3 text-amber-500 fill-amber-500" />
                  {selectedCourseDetail.rating_average ? selectedCourseDetail.rating_average.toFixed(1) : '4.5 / 5.0'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Provider</span>
                <span className="font-semibold text-foreground line-clamp-1">
                  {selectedCourseDetail.provider_name || 'Skill India Digital'}
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Course Overview</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {selectedCourseDetail.description || selectedCourseDetail.short_description || 'Detailed industry curriculum addressing core occupational standards and technical competencies.'}
              </p>
            </div>

            {/* Mapped Sectors & Domains */}
            {selectedCourseDetail.sectors && selectedCourseDetail.sectors.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Industry Sectors</h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCourseDetail.sectors.map(sec => (
                    <Badge key={sec.id} variant="secondary" className="text-xs">
                      {sec.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* QP / NOS Codes */}
            {((selectedCourseDetail.qp_codes && selectedCourseDetail.qp_codes.length > 0) ||
              (selectedCourseDetail.nos_codes && selectedCourseDetail.nos_codes.length > 0)) && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">National Occupational Standards</h3>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCourseDetail.qp_codes?.map(qp => (
                    <Badge key={qp.id} variant="outline" className="text-[11px] font-mono">
                      QP: {qp.code}
                    </Badge>
                  ))}
                  {selectedCourseDetail.nos_codes?.map(nos => (
                    <Badge key={nos.id} variant="outline" className="text-[11px] font-mono">
                      NOS: {nos.code}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setSelectedCourseDetail(null)}>
                Close
              </Button>
              {selectedCourseDetail.course_url && (
                <a
                  href={selectedCourseDetail.course_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  <span>Go to Skill India Digital</span>
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
