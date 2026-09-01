import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus,
  Search,
  Eye,
  Trash2,
  CheckCircle2,
  XCircle,
  Briefcase,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { EmployerLayout } from '@/components/employer/EmployerLayout'
import { JobStatusBadge } from '@/components/employer/JobStatusBadge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  getEmployerJobs,
  deleteEmployerJob,
  publishEmployerJob,
  closeEmployerJob,
} from '@/lib/employer-api'
import type { PaginatedJobPostings, JobPostingListItem } from '@/types/employer'

const MAHARASHTRA_DISTRICTS = [
  'All Maharashtra',
  'Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara',
  'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli',
  'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai', 'Mumbai Suburban',
  'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar',
  'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara',
  'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal',
]

export function EmployerJobs() {
  const [data, setData] = useState<PaginatedJobPostings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [districtFilter, setDistrictFilter] = useState('All Maharashtra')
  const [page, setPage] = useState(1)

  // Action modals
  const [jobToDelete, setJobToDelete] = useState<JobPostingListItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadJobs = useCallback(async () => {
    setIsLoading(true)
    setErrorMsg(null)
    try {
      const res = await getEmployerJobs({
        search: search.trim() || undefined,
        status: statusFilter,
        district: districtFilter,
        page,
        size: 15,
      })
      setData(res)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch job postings.')
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter, districtFilter, page])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  const handleDelete = async () => {
    if (!jobToDelete) return
    setIsDeleting(true)
    try {
      await deleteEmployerJob(jobToDelete.id)
      setJobToDelete(null)
      loadJobs()
    } catch (err: any) {
      alert(err.message || 'Failed to delete job.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handlePublish = async (jobId: number) => {
    try {
      await publishEmployerJob(jobId)
      loadJobs()
    } catch (err: any) {
      alert(err.message || 'Failed to publish job.')
    }
  }

  const handleClose = async (jobId: number) => {
    try {
      await closeEmployerJob(jobId)
      loadJobs()
    } catch (err: any) {
      alert(err.message || 'Failed to close job.')
    }
  }

  const formatSalary = (min?: number | null, max?: number | null) => {
    if (!min && !max) return 'Not specified'
    if (min && max) return `₹${(min / 100000).toFixed(1)}L - ₹${(max / 100000).toFixed(1)}L`
    if (min) return `From ₹${(min / 100000).toFixed(1)}L`
    return `Up to ₹${(max! / 100000).toFixed(1)}L`
  }

  return (
    <EmployerLayout
      title="Job Postings Management"
      subtitle="Manage your company vacancies, trigger skill extractions, and inspect live curriculum alignment"
      actions={
        <Link
          to="/employer/jobs/new"
          className={buttonVariants({ size: 'sm', className: 'gap-1 text-xs' })}
        >
          <Plus className="size-3.5" />
          <span>Create Vacancy</span>
        </Link>
      }
    >
      {errorMsg && (
        <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <Card className="border border-border/80 shadow-2xs">
        <CardContent className="p-3.5 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by job title or keyword..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-8 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                if (val) {
                  setStatusFilter(val)
                  setPage(1)
                }
              }}
            >
              <SelectTrigger className="w-full md:w-[140px] h-9 text-xs">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                <SelectItem value="published" className="text-xs">Published</SelectItem>
                <SelectItem value="draft" className="text-xs">Draft</SelectItem>
                <SelectItem value="closed" className="text-xs">Closed</SelectItem>
              </SelectContent>
            </Select>

            {/* District Filter */}
            <Select
              value={districtFilter}
              onValueChange={(val) => {
                if (val) {
                  setDistrictFilter(val)
                  setPage(1)
                }
              }}
            >
              <SelectTrigger className="w-full md:w-[160px] h-9 text-xs">
                <SelectValue placeholder="Select District" />
              </SelectTrigger>
              <SelectContent>
                {MAHARASHTRA_DISTRICTS.map((d) => (
                  <SelectItem key={d} value={d} className="text-xs">
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <Card className="border border-border/80 shadow-xs">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2">
              <Loader2 className="size-6 text-primary animate-spin" />
              <span>Loading job postings from database...</span>
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="text-center py-16 px-4 space-y-3">
              <Briefcase className="size-10 text-muted-foreground mx-auto opacity-40" />
              <h3 className="text-sm font-semibold text-foreground">No job postings found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No vacancies match the current search or filters. Try adjusting your query or create a new job posting.
              </p>
              <Link
                to="/employer/jobs/new"
                className={buttonVariants({ size: 'sm', className: 'text-xs' })}
              >
                Post New Vacancy
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-border/60 text-muted-foreground bg-muted/30">
                    <th className="py-3 px-4 font-semibold">Title & Category</th>
                    <th className="py-3 px-4 font-semibold">Location</th>
                    <th className="py-3 px-4 font-semibold">Compensation</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Extracted Skills</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {data.items.map((job) => (
                    <tr key={job.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        <Link
                          to={`/employer/jobs/${job.id}`}
                          className="hover:text-primary hover:underline font-semibold block text-sm text-foreground"
                        >
                          {job.title}
                        </Link>
                        <span className="text-[11px] text-muted-foreground">
                          {job.employment_type} &middot; {job.work_mode}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground">
                        {job.district || 'Maharashtra'}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {formatSalary(job.min_salary, job.max_salary)}
                      </td>

                      <td className="py-3.5 px-4">
                        <JobStatusBadge status={job.status} />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {job.top_skills.slice(0, 3).map((s, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium text-foreground"
                            >
                              {s}
                            </span>
                          ))}
                          {job.skills_count > 3 && (
                            <span className="px-1 py-0.5 text-[10px] text-muted-foreground font-semibold">
                              +{job.skills_count - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/employer/jobs/${job.id}`}
                            className={buttonVariants({
                              variant: 'outline',
                              size: 'sm',
                              className: 'h-7 text-xs gap-1',
                            })}
                          >
                            <Eye className="size-3.5" />
                            <span>View</span>
                          </Link>

                          {job.status === 'draft' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePublish(job.id)}
                              className="h-7 text-xs text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30"
                              title="Publish Job"
                            >
                              <CheckCircle2 className="size-3.5" />
                            </Button>
                          )}

                          {job.status === 'published' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleClose(job.id)}
                              className="h-7 text-xs text-zinc-600 hover:bg-zinc-500/10"
                              title="Close Job"
                            >
                              <XCircle className="size-3.5" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setJobToDelete(job)}
                            className="h-7 text-xs text-destructive hover:bg-destructive/10"
                            title="Delete Job"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {data && data.pages > 1 && (
            <div className="p-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Showing {(page - 1) * data.size + 1} - {Math.min(page * data.size, data.total)} of{' '}
                {data.total} jobs
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="h-7 px-2"
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <span className="px-2 font-medium text-foreground">
                  Page {page} of {data.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-7 px-2"
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!jobToDelete} onOpenChange={(open) => !open && setJobToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job Posting?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">"{jobToDelete?.title}"</span>?
              This will remove all linked skill alignments and course recommendations for this vacancy.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setJobToDelete(null)}
              disabled={isDeleting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs gap-1.5"
            >
              {isDeleting && <Loader2 className="size-3.5 animate-spin" />}
              <span>Delete Posting</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </EmployerLayout>
  )
}

