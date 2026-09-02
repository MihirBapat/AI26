/**
 * TypeScript definitions for Employer Module.
 * Exactly matches backend schemas in `app/schemas/employer.py`.
 */

export interface EmployerProfile {
  id: number
  user_id: number
  company_name: string
  legal_name?: string | null
  industry?: string | null
  sector_id?: number | null
  company_size?: string | null
  description?: string | null
  website?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  address?: string | null
  city?: string | null
  district?: string | null
  state: string
  pincode?: string | null
  logo_url?: string | null
  verification_status: 'pending' | 'verified' | 'rejected' | string
  created_at: string
  updated_at: string
}

export interface EmployerProfileUpdatePayload {
  company_name?: string
  legal_name?: string | null
  industry?: string | null
  sector_id?: number | null
  company_size?: string | null
  description?: string | null
  website?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  address?: string | null
  city?: string | null
  district?: string | null
  state?: string | null
  pincode?: string | null
  logo_url?: string | null
}

export interface SkillRead {
  id: number
  name: string
  normalized_name: string
  category: string
  description?: string | null
  is_emerging: boolean
  parent_skill_id?: number | null
}

export interface SkillNormalizeResponse {
  raw_input: string
  canonical_skill: SkillRead | null
  matched_via: 'exact' | 'alias' | 'fuzzy' | 'unmatched'
  confidence: number
}

export interface ExtractedSkillItem {
  name: string
  canonical_id?: number | null
  category: string
  requirement_type: 'required' | 'preferred'
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  importance_weight: number
  confidence_score: number
  extraction_source: string
}

export interface SkillExtractionResponse {
  role_category?: string | null
  extracted_skills: ExtractedSkillItem[]
  total_skills_found: number
}

export interface JobSkillInput {
  skill_name: string
  requirement_type: 'required' | 'preferred'
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  importance_weight: number
}

export interface JobPostingCreatePayload {
  title: string
  description: string
  role_category?: string | null
  industry?: string | null
  sector_id?: number | null
  location?: string | null
  district?: string | null
  state?: string
  employment_type?: string
  work_mode?: string
  min_experience_years?: number | null
  max_experience_years?: number | null
  min_salary?: number | null
  max_salary?: number | null
  currency?: string
  status?: 'draft' | 'published'
  skills?: JobSkillInput[] | null
}

export interface JobPostingUpdatePayload {
  title?: string
  description?: string
  role_category?: string | null
  industry?: string | null
  sector_id?: number | null
  location?: string | null
  district?: string | null
  state?: string
  employment_type?: string
  work_mode?: string
  min_experience_years?: number | null
  max_experience_years?: number | null
  min_salary?: number | null
  max_salary?: number | null
  status?: 'draft' | 'published' | 'paused' | 'closed'
  skills?: JobSkillInput[] | null
}

export interface JobSkillDetail {
  id: number
  skill_id: number
  skill_name: string
  category: string
  requirement_type: 'required' | 'preferred'
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  importance_weight: number
  confidence_score: number
  extraction_source: string
}

export interface JobPostingResponse {
  id: number
  employer_id?: number | null
  company_name?: string | null
  source: string
  source_job_id?: string | null
  title: string
  normalized_title?: string | null
  description: string
  role_category?: string | null
  industry?: string | null
  sector_id?: number | null
  location?: string | null
  district?: string | null
  state: string
  employment_type: string
  work_mode: string
  min_experience_years?: number | null
  max_experience_years?: number | null
  min_salary?: number | null
  max_salary?: number | null
  currency: string
  status: 'draft' | 'published' | 'paused' | 'closed'
  posted_at?: string | null
  expires_at?: string | null
  created_at: string
  updated_at: string
  skills: JobSkillDetail[]
}

export interface JobPostingListItem {
  id: number
  title: string
  company_name?: string | null
  district?: string | null
  employment_type: string
  work_mode: string
  min_salary?: number | null
  max_salary?: number | null
  status: 'draft' | 'published' | 'paused' | 'closed'
  posted_at?: string | null
  skills_count: number
  top_skills: string[]
}

export interface PaginatedJobPostings {
  items: JobPostingListItem[]
  total: number
  page: number
  size: number
  pages: number
}

export interface SkillCoverageDetail {
  skill_id: number
  skill_name: string
  category: string
  requirement_type: string
  importance_weight: number
  status: 'covered' | 'partial' | 'missing'
  matching_course_ids: number[]
  coverage_score: number
}

export interface SkillGapResponse {
  job_id?: number | null
  role_title: string
  district?: string | null
  total_required_skills: number
  covered_skills_count: number
  partial_skills_count: number
  missing_skills_count: number
  overall_coverage_percentage: number
  gap_severity: 'Low' | 'Moderate' | 'High' | 'Critical'
  skill_breakdown: SkillCoverageDetail[]
  recommendations: string[]
}

export interface CourseMatchItem {
  course_id: number
  sid_course_id: string
  title: string
  provider_name?: string | null
  course_type: string
  price?: number | null
  rating_average?: number | null
  enrollment_count: number
  matched_skills: string[]
  missing_skills: string[]
  alignment_score: number
}

export interface JobCourseMatchesResponse {
  job_id: number
  job_title: string
  required_skills: string[]
  matched_courses: CourseMatchItem[]
  total_courses_evaluated: number
}

export interface EmployerValidationCreatePayload {
  course_id: number
  skill_id?: number | null
  validation_status: 'adequate' | 'partially_adequate' | 'inadequate' | 'obsolete'
  rating: number
  feedback_text?: string | null
  curriculum_recommendation?: string | null
  industry_relevance_score?: number
}

export interface EmployerValidationResponse {
  id: number
  employer_id: number
  course_id: number
  course_title?: string | null
  skill_id?: number | null
  skill_name?: string | null
  validation_status: 'adequate' | 'partially_adequate' | 'inadequate' | 'obsolete'
  rating: number
  feedback_text?: string | null
  curriculum_recommendation?: string | null
  industry_relevance_score: number
  created_at: string
}

export interface EmployerFeedbackCreatePayload {
  feedback_category:
    | 'skill_gap'
    | 'candidate_readiness'
    | 'curriculum_quality'
    | 'equipment_infrastructure'
    | 'trainer_quality'
    | 'emerging_skill'
    | 'obsolete_skill'
    | string
  subject: string
  district?: string | null
  sector_id?: number | null
  detailed_comments: string
  proposed_interventions?: string | null
  urgency_level: 'low' | 'medium' | 'high' | 'critical'
}

export interface EmployerFeedbackResponse {
  id: number
  employer_id: number
  company_name?: string | null
  feedback_category: string
  subject: string
  district?: string | null
  sector_id?: number | null
  detailed_comments: string
  proposed_interventions?: string | null
  urgency_level: string
  created_at: string
}

export interface EmployerOverviewStats {
  total_jobs: number
  active_jobs: number
  draft_jobs: number
  closed_jobs: number
  total_validations_submitted: number
  total_feedback_submitted: number
  top_demanded_skills_in_company: string[]
  average_skill_coverage_pct: number
}

export interface SkillDemandItem {
  skill_id: number
  skill_name: string
  category: string
  postings_count: number
  unique_employers_count: number
  demand_share_pct: number
  demand_index: number
  is_emerging: boolean
}

export interface SkillDemandAnalyticsResponse {
  district_filter?: string | null
  sector_filter?: string | null
  total_postings_analyzed: number
  top_demanded_skills: SkillDemandItem[]
}

export interface SalaryBenchmarkItem {
  role_category: string
  district?: string | null
  min_salary: number
  avg_salary: number
  max_salary: number
  sample_size: number
}

export interface SalaryBenchmarkResponse {
  district?: string | null
  benchmarks: SalaryBenchmarkItem[]
}

export interface ToolExecutionTrace {
  tool_name: string
  parameters: Record<string, any>
  result_summary: string
}

export interface EmployerIntelligenceResponse {
  query: string
  answer: string
  tools_executed: ToolExecutionTrace[]
  grounded_metrics: Record<string, any>
  confidence: number
}

