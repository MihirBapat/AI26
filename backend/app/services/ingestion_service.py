"""Job Posting Ingestion, Deduplication, and Normalization Pipeline."""

from datetime import datetime, timezone
import json
import logging
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.ingestion import IngestionRun
from app.models.job_posting import JobPosting, JobPostingSkill
from app.services.adzuna_service import adzuna_service
from app.services.skill_service import skill_service

logger = logging.getLogger(__name__)


class IngestionService:
    """Automated and idempotent Ingestion Pipeline for External Job Postings."""

    async def ingest_adzuna_jobs(
        self,
        db: Session,
        query: str = "Developer",
        district: str = "Pune",
        pages: int = 1,
        results_per_page: int = 20,
    ) -> IngestionRun:
        """Fetch, deduplicate, normalize, extract skills, and persist live Adzuna jobs into the database."""
        start_time = datetime.now(timezone.utc)
        run_record = IngestionRun(
            source="ADZUNA",
            status="running",
            started_at=start_time,
        )
        db.add(run_record)
        db.commit()
        db.refresh(run_record)

        fetched_count = 0
        inserted_count = 0
        skipped_count = 0
        failed_count = 0
        error_messages = []

        for page in range(1, pages + 1):
            try:
                search_res = await adzuna_service.search_jobs(
                    what=query,
                    where=district,
                    page=page,
                    results_per_page=results_per_page,
                )

                if not search_res.results:
                    continue

                for item in search_res.results:
                    fetched_count += 1
                    ext_id = str(item.id)

                    # Deduplication check by (source, source_job_id)
                    existing_job = db.execute(
                        select(JobPosting).where(
                            JobPosting.source == "ADZUNA",
                            JobPosting.source_job_id == ext_id,
                        )
                    ).scalar_one_or_none()

                    if existing_job:
                        skipped_count += 1
                        continue

                    # Create JobPosting
                    posted_date = None
                    if item.created:
                        try:
                            posted_date = datetime.fromisoformat(item.created.replace("Z", "+00:00"))
                        except Exception:
                            posted_date = datetime.now(timezone.utc)

                    new_job = JobPosting(
                        employer_id=None,
                        source="ADZUNA",
                        source_job_id=ext_id,
                        company_name_raw=item.company_name,
                        title=item.title,
                        normalized_title=skill_service.normalize_string(item.title),
                        description=item.description,
                        role_category=query,
                        location=item.location_display or district,
                        district=district,
                        state="Maharashtra",
                        employment_type="Full-time" if not item.contract_time else item.contract_time.capitalize(),
                        work_mode="On-site",
                        min_salary=item.salary_min,
                        max_salary=item.salary_max,
                        currency="INR",
                        status="published",
                        posted_at=posted_date or datetime.now(timezone.utc),
                        raw_data=json.dumps(item.model_dump(), default=str),
                    )
                    db.add(new_job)
                    db.flush()

                    # Extract and link skills
                    extracted = skill_service.extract_skills_from_text(db, item.title, item.description)
                    for ext_s in extracted:
                        if ext_s.canonical_id:
                            jps = JobPostingSkill(
                                job_posting_id=new_job.id,
                                skill_id=ext_s.canonical_id,
                                requirement_type=ext_s.requirement_type,
                                proficiency_level=ext_s.proficiency_level,
                                importance_weight=ext_s.importance_weight,
                                confidence_score=ext_s.confidence_score,
                                extraction_source="rule_extracted",
                            )
                            db.add(jps)

                    inserted_count += 1

                db.commit()

            except Exception as e:
                logger.error("Ingestion failed on page %d: %s", page, e)
                failed_count += 1
                error_messages.append(f"Page {page} error: {str(e)}")

        end_time = datetime.now(timezone.utc)
        run_record.status = "completed" if failed_count == 0 else "completed_with_errors"
        run_record.records_fetched = fetched_count
        run_record.records_inserted = inserted_count
        run_record.records_skipped = skipped_count
        run_record.records_failed = failed_count
        run_record.error_summary = "; ".join(error_messages) if error_messages else None
        run_record.completed_at = end_time

        db.commit()
        db.refresh(run_record)
        return run_record


ingestion_service = IngestionService()

