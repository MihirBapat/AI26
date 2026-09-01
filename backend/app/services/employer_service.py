"""Employer Profile, Job Posting, and Validation Management Service."""

from datetime import datetime, timezone
import logging
from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.course import Course
from app.models.employer import Employer
from app.models.employer_validation import EmployerCourseValidation, EmployerFeedback
from app.models.job_posting import JobPosting, JobPostingSkill
from app.models.skill import Skill
from app.models.user import User
from app.schemas.employer import (
    EmployerFeedbackCreate,
    EmployerFeedbackResponse,
    EmployerProfileCreate,
    EmployerProfileResponse,
    EmployerProfileUpdate,
    EmployerValidationCreate,
    EmployerValidationResponse,
    JobPostingCreate,
    JobPostingListItem,
    JobPostingResponse,
    JobPostingUpdate,
    JobSkillDetail,
    PaginatedJobPostings,
)
from app.services.skill_service import skill_service

logger = logging.getLogger(__name__)


class EmployerService:
    """Service handling Employer profile, persistent job postings, validations, and feedback."""

    def get_or_create_profile(self, db: Session, current_user: User) -> Employer:
        """Fetch existing employer profile or auto-initialize one for the authenticated employer user."""
        profile = db.execute(
            select(Employer).where(Employer.user_id == current_user.id)
        ).scalar_one_or_none()

        if not profile:
            # Auto-create basic profile from User credentials
            company_name_guess = current_user.full_name or current_user.email.split("@")[0].capitalize()
            profile = Employer(
                user_id=current_user.id,
                company_name=company_name_guess,
                contact_email=current_user.email,
                state="Maharashtra",
                verification_status="verified" if current_user.is_verified else "pending",
            )
            db.add(profile)
            db.commit()
            db.refresh(profile)

        return profile

    def update_profile(
        self, db: Session, current_user: User, payload: EmployerProfileUpdate
    ) -> Employer:
        """Update authenticated employer organization profile."""
        profile = self.get_or_create_profile(db, current_user)
        update_data = payload.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(profile, key, value)

        db.commit()
        db.refresh(profile)
        return profile

    def create_job(
        self, db: Session, current_user: User, payload: JobPostingCreate
    ) -> JobPosting:
        """Create a new job posting for the employer with automatic skill extraction."""
        employer = self.get_or_create_profile(db, current_user)
        now = datetime.now(timezone.utc)

        job = JobPosting(
            employer_id=employer.id,
            source="EMPLOYER",
            title=payload.title,
            normalized_title=skill_service.normalize_string(payload.title),
            description=payload.description,
            role_category=payload.role_category or payload.title,
            industry=payload.industry or employer.industry,
            sector_id=payload.sector_id or employer.sector_id,
            location=payload.location,
            district=payload.district or employer.district or "Pune",
            state=payload.state,
            employment_type=payload.employment_type,
            work_mode=payload.work_mode,
            min_experience_years=payload.min_experience_years,
            max_experience_years=payload.max_experience_years,
            min_salary=payload.min_salary,
            max_salary=payload.max_salary,
            currency=payload.currency,
            status=payload.status,
            posted_at=now if payload.status == "published" else None,
        )
        db.add(job)
        db.flush()

        # Handle Skills (Manual or Auto-Extracted)
        if payload.skills and len(payload.skills) > 0:
            for s_in in payload.skills:
                skill_obj = skill_service.get_or_create_skill(db, s_in.skill_name)
                jps = JobPostingSkill(
                    job_posting_id=job.id,
                    skill_id=skill_obj.id,
                    requirement_type=s_in.requirement_type,
                    proficiency_level=s_in.proficiency_level,
                    importance_weight=s_in.importance_weight,
                    confidence_score=1.0,
                    extraction_source="manual",
                )
                db.add(jps)
        else:
            # Auto extract skills from title and description
            extracted_skills = skill_service.extract_skills_from_text(db, payload.title, payload.description)
            for ext in extracted_skills:
                if ext.canonical_id:
                    jps = JobPostingSkill(
                        job_posting_id=job.id,
                        skill_id=ext.canonical_id,
                        requirement_type=ext.requirement_type,
                        proficiency_level=ext.proficiency_level,
                        importance_weight=ext.importance_weight,
                        confidence_score=ext.confidence_score,
                        extraction_source="rule_extracted",
                    )
                    db.add(jps)

        db.commit()
        db.refresh(job)
        return job

    def get_job_by_id(self, db: Session, job_id: int, current_user: User | None = None) -> JobPosting:
        """Fetch job posting by ID with eager-loaded skills and optional employer ownership check."""
        job = db.execute(
            select(JobPosting)
            .options(
                joinedload(JobPosting.employer),
                joinedload(JobPosting.skills).joinedload(JobPostingSkill.skill),
            )
            .where(JobPosting.id == job_id)
        ).unique().scalar_one_or_none()

        if not job:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Job posting {job_id} not found.")

        if current_user and current_user.role == "employer":
            employer = self.get_or_create_profile(db, current_user)
            if job.employer_id != employer.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. You can only view and manage your own job postings.",
                )

        return job

    def list_employer_jobs(
        self,
        db: Session,
        current_user: User,
        status_filter: str | None = None,
        district_filter: str | None = None,
        search: str | None = None,
        page: int = 1,
        size: int = 20,
    ) -> PaginatedJobPostings:
        """List job postings for the authenticated employer with filters and pagination."""
        employer = self.get_or_create_profile(db, current_user)

        query = (
            select(JobPosting)
            .options(
                joinedload(JobPosting.employer),
                joinedload(JobPosting.skills).joinedload(JobPostingSkill.skill),
            )
            .where(JobPosting.employer_id == employer.id)
        )

        count_query = select(func.count(JobPosting.id)).where(JobPosting.employer_id == employer.id)

        if status_filter:
            query = query.where(JobPosting.status == status_filter)
            count_query = count_query.where(JobPosting.status == status_filter)

        if district_filter:
            query = query.where(JobPosting.district.ilike(f"%{district_filter}%"))
            count_query = count_query.where(JobPosting.district.ilike(f"%{district_filter}%"))

        if search:
            query = query.where(
                or_(
                    JobPosting.title.ilike(f"%{search}%"),
                    JobPosting.description.ilike(f"%{search}%"),
                )
            )
            count_query = count_query.where(
                or_(
                    JobPosting.title.ilike(f"%{search}%"),
                    JobPosting.description.ilike(f"%{search}%"),
                )
            )

        total = db.scalar(count_query) or 0
        query = query.order_by(JobPosting.created_at.desc()).offset((page - 1) * size).limit(size)
        rows = db.execute(query).unique().scalars().all()

        items = []
        for r in rows:
            skill_names = [s.skill.name for s in r.skills if s.skill]
            items.append(
                JobPostingListItem(
                    id=r.id,
                    title=r.title,
                    company_name=employer.company_name,
                    district=r.district,
                    employment_type=r.employment_type,
                    work_mode=r.work_mode,
                    min_salary=float(r.min_salary) if r.min_salary else None,
                    max_salary=float(r.max_salary) if r.max_salary else None,
                    status=r.status,
                    posted_at=r.posted_at,
                    skills_count=len(skill_names),
                    top_skills=skill_names[:4],
                )
            )

        return PaginatedJobPostings(
            items=items,
            total=total,
            page=page,
            size=size,
            pages=(total + size - 1) // size if size else 0,
        )

    def update_job(
        self, db: Session, job_id: int, current_user: User, payload: JobPostingUpdate
    ) -> JobPosting:
        """Update an existing job posting and optionally replace its required skills."""
        job = self.get_job_by_id(db, job_id, current_user)
        update_data = payload.model_dump(exclude_unset=True, exclude={"skills"})

        for key, value in update_data.items():
            setattr(job, key, value)

        # Update skills if specified
        if payload.skills is not None:
            # Remove old skills
            db.execute(JobPostingSkill.__table__.delete().where(JobPostingSkill.job_posting_id == job.id))
            for s_in in payload.skills:
                skill_obj = skill_service.get_or_create_skill(db, s_in.skill_name)
                jps = JobPostingSkill(
                    job_posting_id=job.id,
                    skill_id=skill_obj.id,
                    requirement_type=s_in.requirement_type,
                    proficiency_level=s_in.proficiency_level,
                    importance_weight=s_in.importance_weight,
                    confidence_score=1.0,
                    extraction_source="manual",
                )
                db.add(jps)

        db.commit()
        return self.get_job_by_id(db, job_id, current_user)

    def set_job_status(self, db: Session, job_id: int, current_user: User, new_status: str) -> JobPosting:
        """Change job status (e.g. publish, close, pause)."""
        job = self.get_job_by_id(db, job_id, current_user)
        job.status = new_status
        if new_status == "published" and not job.posted_at:
            job.posted_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(job)
        return job

    def delete_job(self, db: Session, job_id: int, current_user: User) -> dict:
        """Delete an employer's job posting."""
        job = self.get_job_by_id(db, job_id, current_user)
        db.delete(job)
        db.commit()
        return {"message": f"Job posting {job_id} deleted successfully."}

    def submit_course_validation(
        self, db: Session, current_user: User, payload: EmployerValidationCreate
    ) -> EmployerCourseValidation:
        """Submit employer evaluation and relevance rating for a course."""
        employer = self.get_or_create_profile(db, current_user)

        # Verify course exists
        course = db.execute(select(Course).where(Course.id == payload.course_id)).scalar_one_or_none()
        if not course:
            raise HTTPException(status_code=404, detail=f"Course {payload.course_id} not found.")

        validation = EmployerCourseValidation(
            employer_id=employer.id,
            course_id=payload.course_id,
            skill_id=payload.skill_id,
            validation_status=payload.validation_status,
            rating=payload.rating,
            feedback_text=payload.feedback_text,
            curriculum_recommendation=payload.curriculum_recommendation,
            industry_relevance_score=payload.industry_relevance_score,
        )
        db.add(validation)
        db.commit()
        db.refresh(validation)
        return validation

    def list_validations(self, db: Session, current_user: User) -> list[EmployerCourseValidation]:
        """List course validations submitted by authenticated employer."""
        employer = self.get_or_create_profile(db, current_user)
        return list(
            db.execute(
                select(EmployerCourseValidation)
                .options(
                    joinedload(EmployerCourseValidation.course),
                    joinedload(EmployerCourseValidation.skill),
                )
                .where(EmployerCourseValidation.employer_id == employer.id)
                .order_by(EmployerCourseValidation.created_at.desc())
            ).scalars().all()
        )

    def submit_feedback(
        self, db: Session, current_user: User, payload: EmployerFeedbackCreate
    ) -> EmployerFeedback:
        """Submit structured feedback to Government / Training Providers."""
        employer = self.get_or_create_profile(db, current_user)
        feedback = EmployerFeedback(
            employer_id=employer.id,
            feedback_category=payload.feedback_category,
            subject=payload.subject,
            district=payload.district or employer.district,
            sector_id=payload.sector_id or employer.sector_id,
            detailed_comments=payload.detailed_comments,
            proposed_interventions=payload.proposed_interventions,
            urgency_level=payload.urgency_level,
        )
        db.add(feedback)
        db.commit()
        db.refresh(feedback)
        return feedback

    def list_feedbacks(self, db: Session, current_user: User) -> list[EmployerFeedback]:
        """List feedback submitted by authenticated employer."""
        employer = self.get_or_create_profile(db, current_user)
        return list(
            db.execute(
                select(EmployerFeedback)
                .where(EmployerFeedback.employer_id == employer.id)
                .order_by(EmployerFeedback.created_at.desc())
            ).scalars().all()
        )


employer_service = EmployerService()

