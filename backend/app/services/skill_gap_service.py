"""Skill Gap Engine and Course Relevance Matching Service."""

import logging
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.course import Course, CourseOccupation, CourseSkillSet, CourseTag
from app.models.job_posting import JobPosting, JobPostingSkill
from app.models.lookups import Occupation, Provider, SkillSet, Tag
from app.models.skill import CourseSkill, Skill
from app.schemas.employer import (
    CourseMatchItem,
    JobCourseMatchesResponse,
    SkillCoverageDetail,
    SkillGapResponse,
)
from app.services.skill_service import skill_service

logger = logging.getLogger(__name__)


class SkillGapService:
    """Mathematical and explainable Skill Gap Analyzer connecting Industry Jobs with Skill India Digital Courses."""

    def _get_course_skill_names(self, course: Course) -> set[str]:
        """Extract all taught skills/tags/skill_sets associated with a course normalized."""
        skill_names: set[str] = set()

        # From course title & descriptions
        title_norm = skill_service.normalize_string(course.title)
        skill_names.add(title_norm)

        # From course_skills bridge table
        if hasattr(course, "course_skill_mappings"):
            for cs in course.course_skill_mappings:
                if cs.skill:
                    skill_names.add(cs.skill.normalized_name)

        # From course_skill_sets
        for css in course.course_skill_sets:
            if css.skill_set and css.skill_set.name:
                skill_names.add(skill_service.normalize_string(css.skill_set.name))

        # From course_tags
        for ct in course.course_tags:
            if ct.tag and ct.tag.name:
                skill_names.add(skill_service.normalize_string(ct.tag.name))

        # From course_occupations
        for co in course.course_occupations:
            if co.occupation and co.occupation.name:
                skill_names.add(skill_service.normalize_string(co.occupation.name))

        return skill_names

    def analyze_job_skill_gap(self, db: Session, job: JobPosting) -> SkillGapResponse:
        """Analyze skill gap for an existing persistent job posting against the entire course catalog."""
        # Get all required skills for this job
        job_skills = db.execute(
            select(JobPostingSkill)
            .options(joinedload(JobPostingSkill.skill))
            .where(JobPostingSkill.job_posting_id == job.id)
        ).scalars().all()

        if not job_skills:
            # If no skills stored, auto-extract them now
            extracted = skill_service.extract_skills_from_text(db, job.title, job.description)
            for item in extracted:
                if item.canonical_id:
                    jps = JobPostingSkill(
                        job_posting_id=job.id,
                        skill_id=item.canonical_id,
                        requirement_type=item.requirement_type,
                        proficiency_level=item.proficiency_level,
                        importance_weight=item.importance_weight,
                        confidence_score=item.confidence_score,
                        extraction_source="rule_extracted",
                    )
                    db.add(jps)
            db.commit()
            job_skills = db.execute(
                select(JobPostingSkill)
                .options(joinedload(JobPostingSkill.skill))
                .where(JobPostingSkill.job_posting_id == job.id)
            ).scalars().all()

        # Load courses
        courses = db.execute(
            select(Course)
            .options(
                joinedload(Course.provider),
                joinedload(Course.course_skill_sets).joinedload(CourseSkillSet.skill_set),
                joinedload(Course.course_tags).joinedload(CourseTag.tag),
                joinedload(Course.course_occupations).joinedload(CourseOccupation.occupation),
            )
            .limit(300)
        ).unique().scalars().all()

        # Build course skill map
        course_skill_maps = [(c, self._get_course_skill_names(c)) for c in courses]

        breakdown: list[SkillCoverageDetail] = []
        covered_count = 0
        partial_count = 0
        missing_count = 0
        weighted_coverage_sum = 0.0
        total_weight = 0.0

        for js in job_skills:
            skill = js.skill
            if not skill:
                continue

            weight = js.importance_weight
            total_weight += weight
            norm_skill = skill.normalized_name

            # Find matching courses
            matching_courses = []
            partial_matches = []

            for c, c_skills in course_skill_maps:
                # Direct match in course skills
                if norm_skill in c_skills or any(norm_skill in s for s in c_skills):
                    matching_courses.append(c.id)
                # Word-level overlap (partial)
                elif any(word in s for word in norm_skill.split() for s in c_skills if len(word) > 3):
                    partial_matches.append(c.id)

            if len(matching_courses) >= 3:
                status = "covered"
                score = 1.0
                covered_count += 1
                matched_ids = matching_courses[:5]
            elif len(matching_courses) > 0 or len(partial_matches) >= 2:
                status = "partial"
                score = 0.5
                partial_count += 1
                matched_ids = (matching_courses + partial_matches)[:5]
            else:
                status = "missing"
                score = 0.0
                missing_count += 1
                matched_ids = []

            weighted_coverage_sum += weight * score

            breakdown.append(
                SkillCoverageDetail(
                    skill_id=skill.id,
                    skill_name=skill.name,
                    category=skill.category,
                    requirement_type=js.requirement_type,
                    importance_weight=weight,
                    status=status,
                    matching_course_ids=matched_ids,
                    coverage_score=score,
                )
            )

        total_skills = len(breakdown)
        overall_coverage = (weighted_coverage_sum / total_weight * 100.0) if total_weight > 0 else 0.0

        # Gap severity classification
        if overall_coverage >= 80.0:
            severity = "Low"
        elif overall_coverage >= 55.0:
            severity = "Moderate"
        elif overall_coverage >= 30.0:
            severity = "High"
        else:
            severity = "Critical"

        # Generate actionable recommendations
        recommendations = []
        missing_names = [d.skill_name for d in breakdown if d.status == "missing"]
        partial_names = [d.skill_name for d in breakdown if d.status == "partial"]

        if missing_names:
            recommendations.append(
                f"Urgent training gap: Develop new practical modules or short-term certifications for {', '.join(missing_names[:4])}."
            )
        if partial_names:
            recommendations.append(
                f"Curriculum upgrade needed: Enhance depth and hands-on lab exercises for partially covered skills: {', '.join(partial_names[:3])}."
            )
        if overall_coverage >= 80.0:
            recommendations.append(
                "Strong curriculum alignment: Existing state vocational and online courses sufficiently cover core requirements for this role."
            )
        else:
            recommendations.append(
                f"District planning signal: Allocate capacity in {job.district or 'local'} centers prioritizing modern industry-standard frameworks."
            )

        return SkillGapResponse(
            job_id=job.id,
            role_title=job.title,
            district=job.district,
            total_required_skills=total_skills,
            covered_skills_count=covered_count,
            partial_skills_count=partial_count,
            missing_skills_count=missing_count,
            overall_coverage_percentage=round(overall_coverage, 1),
            gap_severity=severity,
            skill_breakdown=breakdown,
            recommendations=recommendations,
        )

    def find_matching_courses_for_job(self, db: Session, job: JobPosting, limit: int = 10) -> JobCourseMatchesResponse:
        """Find and rank existing Skill India Digital courses according to percentage of job skills covered."""
        # Get required skills
        job_skills = db.execute(
            select(JobPostingSkill)
            .options(joinedload(JobPostingSkill.skill))
            .where(JobPostingSkill.job_posting_id == job.id)
        ).scalars().all()

        required_skill_names = [js.skill.name for js in job_skills if js.skill]
        if not required_skill_names:
            extracted = skill_service.extract_skills_from_text(db, job.title, job.description)
            required_skill_names = [item.name for item in extracted]

        if not required_skill_names:
            return JobCourseMatchesResponse(
                job_id=job.id,
                job_title=job.title,
                required_skills=[],
                matched_courses=[],
                total_courses_evaluated=0,
            )

        req_norm_map = {skill_service.normalize_string(name): name for name in required_skill_names}

        # Query all courses
        courses = db.execute(
            select(Course)
            .options(
                joinedload(Course.provider),
                joinedload(Course.course_skill_sets).joinedload(CourseSkillSet.skill_set),
                joinedload(Course.course_tags).joinedload(CourseTag.tag),
                joinedload(Course.course_occupations).joinedload(CourseOccupation.occupation),
            )
            .limit(500)
        ).unique().scalars().all()

        match_items: list[CourseMatchItem] = []

        for c in courses:
            c_skills = self._get_course_skill_names(c)
            matched_for_course = []
            missing_for_course = []

            for norm_req, original_name in req_norm_map.items():
                if norm_req in c_skills or any(norm_req in cs for cs in c_skills):
                    matched_for_course.append(original_name)
                elif any(word in cs for word in norm_req.split() for cs in c_skills if len(word) > 3):
                    matched_for_course.append(original_name)
                else:
                    missing_for_course.append(original_name)

            if matched_for_course:
                alignment_score = (len(matched_for_course) / len(required_skill_names)) * 100.0
                match_items.append(
                    CourseMatchItem(
                        course_id=c.id,
                        sid_course_id=c.sid_course_id,
                        title=c.title,
                        provider_name=c.provider.name if c.provider else None,
                        course_type=c.course_type,
                        price=float(c.price) if c.price is not None else None,
                        rating_average=c.rating_average,
                        enrollment_count=c.enrollment_count,
                        matched_skills=matched_for_course,
                        missing_skills=missing_for_course,
                        alignment_score=round(alignment_score, 1),
                    )
                )

        # Sort by alignment_score descending, then enrollment count
        match_items.sort(key=lambda x: (x.alignment_score, x.enrollment_count), reverse=True)

        return JobCourseMatchesResponse(
            job_id=job.id,
            job_title=job.title,
            required_skills=required_skill_names,
            matched_courses=match_items[:limit],
            total_courses_evaluated=len(courses),
        )


skill_gap_service = SkillGapService()

