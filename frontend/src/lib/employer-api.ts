/**
 * Employer Module API Client.
 * All functions communicate with the `/api/v1/employer/...` backend router.
 */

import { apiFetch } from '@/lib/api'
import type {
  EmployerFeedbackCreatePayload,
  EmployerFeedbackResponse,
  EmployerIntelligenceResponse,
  EmployerOverviewStats,
  EmployerProfile,
  EmployerProfileUpdatePayload,
  EmployerValidationCreatePayload,
  EmployerValidationResponse,
  JobCourseMatchesResponse,
  JobPostingCreatePayload,
  JobPostingResponse,
  JobPostingUpdatePayload,
  PaginatedJobPostings,
  SalaryBenchmarkResponse,
  SkillDemandAnalyticsResponse,
  SkillExtractionResponse,
  SkillNormalizeResponse,
  SkillRead,
  SkillGapResponse,
} from '@/types/employer'

// ---------------------------------------------------------------------------
// 1. Profile Management
// ---------------------------------------------------------------------------

export async function getEmployerProfile(): Promise<EmployerProfile> {
  return apiFetch<EmployerProfile>('/employer/profile')
}

export async function updateEmployerProfile(
  payload: EmployerProfileUpdatePayload
): Promise<EmployerProfile> {
  return apiFetch<EmployerProfile>('/employer/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

// ---------------------------------------------------------------------------
// 2. Job Postings Management
// ---------------------------------------------------------------------------

export interface ListEmployerJobsParams {
  status?: string
  district?: string
  search?: string
  page?: number
  size?: number
}

export async function getEmployerJobs(
  params: ListEmployerJobsParams = {}
): Promise<PaginatedJobPostings> {
  const query = new URLSearchParams()
  if (params.status && params.status !== 'all') query.set('status_filter', params.status)
  if (params.district && params.district !== 'All Maharashtra') query.set('district', params.district)
  if (params.search) query.set('search', params.search)
  if (params.page) query.set('page', params.page.toString())
  if (params.size) query.set('size', params.size.toString())

  const queryString = query.toString()
  return apiFetch<PaginatedJobPostings>(
    `/employer/jobs${queryString ? `?${queryString}` : ''}`
  )
}

export async function getEmployerJob(jobId: number | string): Promise<JobPostingResponse> {
  return apiFetch<JobPostingResponse>(`/employer/jobs/${jobId}`)
}

export async function createEmployerJob(
  payload: JobPostingCreatePayload
): Promise<JobPostingResponse> {
  return apiFetch<JobPostingResponse>('/employer/jobs', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateEmployerJob(
  jobId: number | string,
  payload: JobPostingUpdatePayload
): Promise<JobPostingResponse> {
  return apiFetch<JobPostingResponse>(`/employer/jobs/${jobId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteEmployerJob(jobId: number | string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/employer/jobs/${jobId}`, {
    method: 'DELETE',
  })
}

export async function publishEmployerJob(jobId: number | string): Promise<JobPostingResponse> {
  return apiFetch<JobPostingResponse>(`/employer/jobs/${jobId}/publish`, {
    method: 'POST',
  })
}

export async function closeEmployerJob(jobId: number | string): Promise<JobPostingResponse> {
  return apiFetch<JobPostingResponse>(`/employer/jobs/${jobId}/close`, {
    method: 'POST',
  })
}

// ---------------------------------------------------------------------------
// 3. Skill Taxonomy & Extraction
// ---------------------------------------------------------------------------

export async function extractJobSkills(payload: {
  title: string
  description: string
  additional_requirements?: string
}): Promise<SkillExtractionResponse> {
  return apiFetch<SkillExtractionResponse>('/employer/jobs/extract-skills', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getCanonicalSkills(params: {
  category?: string
  search?: string
  limit?: number
} = {}): Promise<SkillRead[]> {
  const query = new URLSearchParams()
  if (params.category && params.category !== 'all') query.set('category', params.category)
  if (params.search) query.set('search', params.search)
  if (params.limit) query.set('limit', params.limit.toString())

  const queryString = query.toString()
  return apiFetch<SkillRead[]>(`/employer/skills${queryString ? `?${queryString}` : ''}`)
}

export async function normalizeSkill(raw_skill: string): Promise<SkillNormalizeResponse> {
  return apiFetch<SkillNormalizeResponse>('/employer/skills/normalize', {
    method: 'POST',
    body: JSON.stringify({ raw_skill }),
  })
}

// ---------------------------------------------------------------------------
// 4. Skill Gap Engine & Course Matching
// ---------------------------------------------------------------------------

export async function getJobSkillGap(jobId: number | string): Promise<SkillGapResponse> {
  return apiFetch<SkillGapResponse>(`/employer/jobs/${jobId}/skill-gap`)
}

export async function getJobCourseMatches(
  jobId: number | string,
  limit: number = 10
): Promise<JobCourseMatchesResponse> {
  return apiFetch<JobCourseMatchesResponse>(`/employer/jobs/${jobId}/course-matches?limit=${limit}`)
}

// ---------------------------------------------------------------------------
// 5. Course Validations & Feedback
// ---------------------------------------------------------------------------

export async function createEmployerValidation(
  payload: EmployerValidationCreatePayload
): Promise<EmployerValidationResponse> {
  return apiFetch<EmployerValidationResponse>('/employer/validations', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getEmployerValidations(): Promise<EmployerValidationResponse[]> {
  return apiFetch<EmployerValidationResponse[]>('/employer/validations')
}

export async function createEmployerFeedback(
  payload: EmployerFeedbackCreatePayload
): Promise<EmployerFeedbackResponse> {
  return apiFetch<EmployerFeedbackResponse>('/employer/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getEmployerFeedback(): Promise<EmployerFeedbackResponse[]> {
  return apiFetch<EmployerFeedbackResponse[]>('/employer/feedback')
}

// ---------------------------------------------------------------------------
// 6. Analytics & Intelligence Agent
// ---------------------------------------------------------------------------

export async function getEmployerOverviewStats(): Promise<EmployerOverviewStats> {
  return apiFetch<EmployerOverviewStats>('/employer/analytics/overview')
}

export async function getSkillDemandAnalytics(params: {
  district?: string
  sector_id?: number
  limit?: number
} = {}): Promise<SkillDemandAnalyticsResponse> {
  const query = new URLSearchParams()
  if (params.district && params.district !== 'All Maharashtra') query.set('district', params.district)
  if (params.sector_id) query.set('sector_id', params.sector_id.toString())
  if (params.limit) query.set('limit', params.limit.toString())

  const queryString = query.toString()
  return apiFetch<SkillDemandAnalyticsResponse>(
    `/employer/analytics/skill-demand${queryString ? `?${queryString}` : ''}`
  )
}

export async function getSalaryBenchmarks(
  district?: string
): Promise<SalaryBenchmarkResponse> {
  const query = new URLSearchParams()
  if (district && district !== 'All Maharashtra') query.set('district', district)

  const queryString = query.toString()
  return apiFetch<SalaryBenchmarkResponse>(
    `/employer/analytics/salary-benchmarks${queryString ? `?${queryString}` : ''}`
  )
}

export async function queryEmployerIntelligence(payload: {
  query: string
  district?: string
  role_category?: string
}): Promise<EmployerIntelligenceResponse> {
  return apiFetch<EmployerIntelligenceResponse>('/employer/intelligence/query', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

