import { useState, useEffect } from 'react'
import {
  Briefcase,
  Search,
  MapPin,
  Building2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/lib/api'

interface JobItem {
  id: string
  title: string
  company: { display_name: string }
  location: { display_name: string }
  salary_min?: number
  salary_max?: number
  description?: string
  redirect_url: string
  created?: string
  contract_time?: string
  category?: { label: string }
}

interface TopCompany {
  company: string
  job_count: number
  avg_salary?: number
}

interface JobMarketViewProps {
  selectedDistrict: string
}

export function JobMarketView({ selectedDistrict }: JobMarketViewProps) {
  const [keyword, setKeyword] = useState<string>('Technician')
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>('Technician')
  const [district, setDistrict] = useState<string>(selectedDistrict)
  const [page, setPage] = useState<number>(1)

  const [jobs, setJobs] = useState<JobItem[]>([])
  const [totalJobs, setTotalJobs] = useState<number>(0)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const [topCompanies, setTopCompanies] = useState<TopCompany[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(false)

  // Sync selectedDistrict prop
  useEffect(() => {
    setDistrict(selectedDistrict)
  }, [selectedDistrict])

  // Debounce keyword
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword)
      setPage(1)
    }, 400)
    return () => clearTimeout(handler)
  }, [keyword])

  // Fetch Jobs
  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true)
      try {
        const whereParam = district === 'All Maharashtra' ? 'Maharashtra' : district
        const res = await apiFetch<{ results: JobItem[]; count: number }>(
          `/jobs/search?what=${encodeURIComponent(debouncedKeyword || '')}&where=${encodeURIComponent(whereParam)}&page=${page}&results_per_page=9`
        )
        setJobs(res.results || [])
        setTotalJobs(res.count || 0)
      } catch (err) {
        console.error('Failed to load jobs', err)
        setJobs([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchJobs()
  }, [debouncedKeyword, district, page])

  // Fetch Top Companies leaderboard
  useEffect(() => {
    const fetchCompanies = async () => {
      setLoadingCompanies(true)
      try {
        const whereParam = district === 'All Maharashtra' ? 'Maharashtra' : district
        const res = await apiFetch<{ companies: TopCompany[] }>(
          `/jobs/top-companies?what=${encodeURIComponent(debouncedKeyword || '')}&where=${encodeURIComponent(whereParam)}`
        )
        setTopCompanies(res.companies || [])
      } catch {
        setTopCompanies([])
      } finally {
        setLoadingCompanies(false)
      }
    }

    fetchCompanies()
  }, [debouncedKeyword, district])

  const totalPages = Math.ceil(totalJobs / 9) || 1

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Briefcase className="size-6 text-primary" />
            Live Maharashtra Job Market
          </h1>
          <p className="text-muted-foreground text-sm">
            Live job postings, hiring company leaderboards, and district salary intelligence
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1.5 text-xs font-semibold text-primary border-primary/30 bg-primary/5">
          {totalJobs.toLocaleString()} Vacancies Found
        </Badge>
      </div>

      {/* Search Bar */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-8 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search job title or skill (e.g. Electrician, Data Analyst, Welder, Developer)..."
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                className="pl-10 h-11 text-sm bg-background"
              />
            </div>
            <div className="sm:col-span-4 relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="District / City (e.g. Pune, Mumbai, Nagpur)..."
                value={district}
                onChange={e => setDistrict(e.target.value)}
                className="pl-10 h-11 text-sm bg-background"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Jobs List + Top Hiring Employers Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Jobs Grid */}
        <div className="lg:col-span-8 space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-44 rounded-2xl bg-muted/40 animate-pulse border border-border" />
              ))}
            </div>
          ) : jobs.length === 0 ? (
            <Card className="p-12 text-center border-dashed">
              <Briefcase className="size-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-semibold text-foreground">No matching jobs found</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Try searching for a broader role title or checking "All Maharashtra".
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map(job => (
                <Card
                  key={job.id}
                  className="border-border shadow-sm flex flex-col justify-between hover:border-primary/50 transition-all p-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="secondary" className="text-[10px] font-normal">
                        {job.contract_time || 'Full-time'}
                      </Badge>
                      <span className="text-xs text-emerald-600 font-bold">
                        {job.salary_min
                          ? `₹${Math.round(job.salary_min / 1000)}k - ₹${Math.round((job.salary_max || job.salary_min * 1.4) / 1000)}k/yr`
                          : 'Market Standard'}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug">
                      {job.title}
                    </h3>

                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="size-3.5 shrink-0 text-primary" />
                        <span className="font-medium text-foreground line-clamp-1">
                          {job.company?.display_name || 'Direct Employer'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                        <span className="line-clamp-1">{job.location?.display_name || district}</span>
                      </div>
                    </div>

                    {job.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 pt-1 border-t border-border/50">
                        {job.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-border">
                    <a
                      href={job.redirect_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      <span>Apply on Portal</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground">
                Page <span className="font-semibold text-foreground">{page}</span> of{' '}
                <span className="font-semibold text-foreground">{totalPages}</span>
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
        </div>

        {/* Right: Top Employers Leaderboard & Market Intelligence */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="size-4 text-primary" />
                Top Hiring Employers
              </CardTitle>
              <CardDescription className="text-xs">
                Active companies recruiting for {keyword || 'industry roles'} in {district}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingCompanies ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <div key={n} className="h-10 rounded-lg bg-muted/40 animate-pulse" />
                  ))}
                </div>
              ) : topCompanies.length === 0 ? (
                <p className="text-xs text-muted-foreground">No specific company leaderboard available for this search.</p>
              ) : (
                topCompanies.slice(0, 6).map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="size-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                        #{i + 1}
                      </div>
                      <span className="font-semibold text-foreground line-clamp-1">{c.company}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-medium shrink-0">
                      {c.job_count} open roles
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm bg-gradient-to-br from-primary/5 to-background border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                Career Guidance Tip
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2 leading-relaxed">
              <p>
                Employers in Maharashtra increasingly value <strong>Skill India Digital certified</strong> modular credentials when hiring entry and mid-level technical staff.
              </p>
              <p>
                Complete your skill gap training in the <strong>Career GPS</strong> tab to increase your candidate profile match by up to <strong>3x</strong>.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
