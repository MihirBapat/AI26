"""Course API routes — list, detail, stats, search."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, or_
from sqlalchemy.orm import Session, joinedload, selectinload

from app.db.session import get_db
from app.models.course import (
    Course,
    CourseDomain,
    CourseInitiative,
    CourseNosCode,
    CourseOccupation,
    CourseProductType,
    CourseProgram,
    CourseQpCode,
    CourseSector,
    CourseSkillSet,
    CourseTag,
)
from app.models.lookups import Provider, Sector
from app.schemas.course import (
    CourseDetail,
    CourseListItem,
    CourseStats,
    PaginatedCourses,
)

router = APIRouter(prefix="/courses", tags=["courses"])


def _base_query():
    """Base select with common joinedloads for list views."""
    return (
        select(Course)
        .options(
            joinedload(Course.provider),
            selectinload(Course.course_sectors).joinedload(CourseSector.sector),
            selectinload(Course.course_domains).joinedload(CourseDomain.domain),
        )
    )


def _detail_query():
    """Select with ALL relations loaded for detail view."""
    return (
        select(Course)
        .options(
            joinedload(Course.provider),
            joinedload(Course.program_sponsor),
            selectinload(Course.course_sectors).joinedload(CourseSector.sector),
            selectinload(Course.course_domains).joinedload(CourseDomain.domain),
            selectinload(Course.course_occupations).joinedload(CourseOccupation.occupation),
            selectinload(Course.course_tags).joinedload(CourseTag.tag),
            selectinload(Course.course_nos_codes).joinedload(CourseNosCode.nos_code),
            selectinload(Course.course_qp_codes).joinedload(CourseQpCode.qp_code),
            selectinload(Course.course_programs).joinedload(CourseProgram.program),
            selectinload(Course.course_initiatives).joinedload(CourseInitiative.initiative),
            selectinload(Course.course_product_types).joinedload(CourseProductType.product_type),
            selectinload(Course.course_skill_sets).joinedload(CourseSkillSet.skill_set),
        )
    )


@router.get("/stats", response_model=CourseStats)
def get_course_stats(db: Session = Depends(get_db)):
    """Aggregate statistics across all courses."""
    total = db.scalar(select(func.count(Course.id)))
    online = db.scalar(select(func.count(Course.id)).where(Course.course_type == "Online"))
    offline = db.scalar(select(func.count(Course.id)).where(Course.course_type == "Offline"))
    free = db.scalar(select(func.count(Course.id)).where(or_(Course.price == 0, Course.price.is_(None))))
    paid = db.scalar(select(func.count(Course.id)).where(Course.price > 0))
    enrollments = db.scalar(select(func.coalesce(func.sum(Course.enrollment_count), 0)))
    providers = db.scalar(select(func.count(func.distinct(Course.provider_id))))
    sectors = db.scalar(select(func.count(func.distinct(CourseSector.sector_id))))
    avg_rating = db.scalar(select(func.avg(Course.rating_average)).where(Course.rating_average.isnot(None)))
    with_cert = db.scalar(select(func.count(Course.id)).where(Course.certificate_enabled.is_(True)))

    return CourseStats(
        total_courses=total or 0,
        online_courses=online or 0,
        offline_courses=offline or 0,
        free_courses=free or 0,
        paid_courses=paid or 0,
        total_enrollments=enrollments or 0,
        unique_providers=providers or 0,
        unique_sectors=sectors or 0,
        avg_rating=round(avg_rating, 2) if avg_rating else None,
        with_certificate=with_cert or 0,
    )


@router.get("", response_model=PaginatedCourses)
def list_courses(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: str | None = Query(None, description="Full-text search on title/description"),
    course_type: str | None = Query(None, description="'Online' or 'Offline'"),
    sector_id: int | None = Query(None, description="Filter by sector ID"),
    provider_id: int | None = Query(None, description="Filter by provider ID"),
    language: str | None = Query(None, description="Filter by language"),
    free_only: bool = Query(False, description="Show only free courses"),
    has_certificate: bool | None = Query(None, description="Filter by certificate availability"),
    sort_by: str = Query("enrollment_count", description="Sort field: enrollment_count, rating_average, price, title"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    db: Session = Depends(get_db),
):
    """Paginated course listing with filtering, search, and sorting."""

    query = _base_query()
    count_query = select(func.count(func.distinct(Course.id)))


    if search:
        ts_query = func.plainto_tsquery("english", search)
        query = query.where(Course.search_vector.op("@@")(ts_query))
        count_query = count_query.where(Course.search_vector.op("@@")(ts_query))

    if course_type:
        query = query.where(Course.course_type == course_type)
        count_query = count_query.where(Course.course_type == course_type)

    if sector_id:
        query = query.join(CourseSector, Course.id == CourseSector.course_id).where(CourseSector.sector_id == sector_id)
        count_query = count_query.join(CourseSector, Course.id == CourseSector.course_id).where(CourseSector.sector_id == sector_id)

    if provider_id:
        query = query.where(Course.provider_id == provider_id)
        count_query = count_query.where(Course.provider_id == provider_id)

    if language:
        query = query.where(Course.language.ilike(f"%{language}%"))
        count_query = count_query.where(Course.language.ilike(f"%{language}%"))

    if free_only:
        query = query.where(or_(Course.price == 0, Course.price.is_(None)))
        count_query = count_query.where(or_(Course.price == 0, Course.price.is_(None)))

    if has_certificate is not None:
        query = query.where(Course.certificate_enabled.is_(has_certificate))
        count_query = count_query.where(Course.certificate_enabled.is_(has_certificate))


    total = db.scalar(count_query) or 0


    sort_col_map = {
        "enrollment_count": Course.enrollment_count,
        "rating_average": Course.rating_average,
        "price": Course.price,
        "title": Course.title,
        "total_ratings": Course.total_ratings,
        "duration_minutes": Course.duration_minutes,
    }
    sort_col = sort_col_map.get(sort_by, Course.enrollment_count)
    if sort_order == "asc":
        query = query.order_by(sort_col.asc().nullslast())
    else:
        query = query.order_by(sort_col.desc().nullslast())


    offset = (page - 1) * size
    query = query.offset(offset).limit(size)

    courses = db.execute(query).unique().scalars().all()

    return PaginatedCourses(
        items=[CourseListItem.from_course(c) for c in courses],
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size if size else 0,
    )


@router.get("/{course_id}", response_model=CourseDetail)
def get_course(course_id: int, db: Session = Depends(get_db)):
    """Get full course detail by internal ID."""
    query = _detail_query().where(Course.id == course_id)
    course = db.execute(query).unique().scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return CourseDetail.from_course(course)


@router.get("/by-sid/{sid_course_id}", response_model=CourseDetail)
def get_course_by_sid(sid_course_id: str, db: Session = Depends(get_db)):
    """Get full course detail by original Skill India Digital course ID."""
    query = _detail_query().where(Course.sid_course_id == sid_course_id)
    course = db.execute(query).unique().scalar_one_or_none()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return CourseDetail.from_course(course)
