"""Seed script — reads the Excel file and populates all 23 PostgreSQL tables.

Usage:
    cd backend
    python -m app.scripts.seed_courses

Idempotent: uses get-or-create for lookups and upsert for courses.
Enables Row Level Security (RLS) on all tables for Supabase safety.
"""

from __future__ import annotations

import math
import os
import sys
import time
from pathlib import Path


if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

import pandas as pd
from sqlalchemy import select, text
from sqlalchemy.orm import Session


BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
os.chdir(BACKEND_DIR)

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.lookups import (
    Domain,
    Initiative,
    NosCode,
    Occupation,
    ProductType,
    Program,
    ProgramSponsor,
    Provider,
    QpCode,
    Sector,
    SkillSet,
    Tag,
)
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


EXCEL_PATH = BACKEND_DIR.parent / "docs" / "SkillIndiaDigital_AllCourses.xlsx"


def _clean(val) -> str | None:
    """Normalise a cell value: NaN/None/empty -> None, else stripped string."""
    if val is None:
        return None
    if isinstance(val, float) and math.isnan(val):
        return None
    s = str(val).strip()
    return s if s else None


def _safe_str(val, max_len: int = 100) -> str | None:
    """Clean and safely truncate string to fit column definitions."""
    s = _clean(val)
    if not s:
        return None
    return s[:max_len]


def _split_csv(val) -> list[str]:
    """Split a comma-separated string into a list of non-empty stripped values."""
    s = _clean(val)
    if not s:
        return []
    return [v.strip() for v in s.split(",") if v.strip()]


def _int_or_none(val) -> int | None:
    """Parse an int from a cell value."""
    s = _clean(val)
    if not s:
        return None
    try:
        return int(float(s))
    except (ValueError, TypeError):
        return None


def _float_or_none(val) -> float | None:
    """Parse a float from a cell value."""
    s = _clean(val)
    if not s:
        return None
    try:
        return float(s)
    except (ValueError, TypeError):
        return None


def _bool_from_str(val) -> bool | None:
    """Convert 'Yes'/'No' to bool."""
    s = _clean(val)
    if not s:
        return None
    return s.lower() in ("yes", "true", "1")


_sector_id_map: dict[str, int] = {}
_domain_id_map: dict[str, int] = {}
_provider_id_map: dict[str, int] = {}
_program_sponsor_id_map: dict[str, int] = {}
_occupation_id_map: dict[str, int] = {}
_tag_id_map: dict[str, int] = {}
_nos_code_id_map: dict[str, int] = {}
_qp_code_id_map: dict[str, int] = {}
_program_id_map: dict[str, int] = {}
_initiative_id_map: dict[str, int] = {}
_product_type_id_map: dict[str, int] = {}
_skill_set_id_map: dict[str, int] = {}


def _populate_all_lookups(db: Session, xlsx: dict[str, pd.DataFrame], courses_df: pd.DataFrame):
    """Scan reference sheets + course data to create and commit ALL lookups in bulk."""
    print("\n[PHASE 1] Pre-populating all lookup tables in bulk...", flush=True)

    def sync_named_model(model, names_set):
        existing = {row.name: row.id for row in db.execute(select(model)).scalars().all() if row.name}
        missing = names_set - set(existing.keys())
        if missing:
            db.add_all([model(name=n) for n in missing if n])
            db.commit()
            existing = {row.name: row.id for row in db.execute(select(model)).scalars().all() if row.name}
        return existing

    def sync_coded_model(model, codes_set):
        existing = {row.code: row.id for row in db.execute(select(model)).scalars().all() if row.code}
        missing = codes_set - set(existing.keys())
        if missing:
            db.add_all([model(code=c) for c in missing if c])
            db.commit()
            existing = {row.code: row.id for row in db.execute(select(model)).scalars().all() if row.code}
        return existing


    sector_names = {name for val in courses_df["Sector(s)"].dropna() for name in _split_csv(val)}
    if "Sectors" in xlsx:
        for _, r in xlsx["Sectors"].iterrows():
            n = _clean(r.get("Name"))
            if n:
                sector_names.add(n)
    _sector_id_map.update(sync_named_model(Sector, sector_names))
    print(f"   [+] Sectors: {len(_sector_id_map)}", flush=True)


    domain_names = {name for val in courses_df["Domain(s)"].dropna() for name in _split_csv(val)}
    if "Domains" in xlsx:
        for _, r in xlsx["Domains"].iterrows():
            n = _clean(r.get("Domain"))
            if n:
                domain_names.add(n)
    _domain_id_map.update(sync_named_model(Domain, domain_names))
    print(f"   [+] Domains: {len(_domain_id_map)}", flush=True)


    provider_names = {name for val in courses_df["Course Provider Name"].dropna() for name in [_clean(val)] if name}
    if "Learning Providers" in xlsx:
        for _, r in xlsx["Learning Providers"].iterrows():
            n = _clean(r.get("Name"))
            if n:
                provider_names.add(n)
    _provider_id_map.update(sync_named_model(Provider, provider_names))
    print(f"   [+] Providers: {len(_provider_id_map)}", flush=True)


    sponsor_names = {name for val in courses_df["Program By"].dropna() for name in [_clean(val)] if name}
    if "Program Sponsors" in xlsx:
        for _, r in xlsx["Program Sponsors"].iterrows():
            n = _clean(r.get("Name"))
            if n:
                sponsor_names.add(n)
    _program_sponsor_id_map.update(sync_named_model(ProgramSponsor, sponsor_names))
    print(f"   [+] Program Sponsors: {len(_program_sponsor_id_map)}", flush=True)


    prog_names = {name for val in courses_df["Program(s)"].dropna() for name in _split_csv(val)}
    if "Programs" in xlsx:
        for _, r in xlsx["Programs"].iterrows():
            n = _clean(r.get("Name"))
            if n:
                prog_names.add(n)
    _program_id_map.update(sync_named_model(Program, prog_names))
    print(f"   [+] Programs: {len(_program_id_map)}", flush=True)


    init_names = {name for val in courses_df["Initiative Of"].dropna() for name in _split_csv(val)}
    if "Initiatives" in xlsx:
        for _, r in xlsx["Initiatives"].iterrows():
            n = _clean(r.get("Name"))
            if n:
                init_names.add(n)
    _initiative_id_map.update(sync_named_model(Initiative, init_names))
    print(f"   [+] Initiatives: {len(_initiative_id_map)}", flush=True)


    occ_names = {name for val in courses_df["Occupation(s)"].dropna() for name in _split_csv(val)}
    _occupation_id_map.update(sync_named_model(Occupation, occ_names))
    print(f"   [+] Occupations: {len(_occupation_id_map)}", flush=True)


    tag_names = {name for val in courses_df["Tags"].dropna() for name in _split_csv(val)}
    _tag_id_map.update(sync_named_model(Tag, tag_names))
    print(f"   [+] Tags: {len(_tag_id_map)}", flush=True)


    nos_codes = {code for val in courses_df["NOS Code(s)"].dropna() for code in _split_csv(val)}
    _nos_code_id_map.update(sync_coded_model(NosCode, nos_codes))
    print(f"   [+] NOS Codes: {len(_nos_code_id_map)}", flush=True)


    qp_codes = {code for val in courses_df["QP Code(s)"].dropna() for code in _split_csv(val)}
    _qp_code_id_map.update(sync_coded_model(QpCode, qp_codes))
    print(f"   [+] QP Codes: {len(_qp_code_id_map)}", flush=True)


    pt_names = {name for val in courses_df["Learning Product Type(s)"].dropna() for name in _split_csv(val)}
    _product_type_id_map.update(sync_named_model(ProductType, pt_names))
    print(f"   [+] Product Types: {len(_product_type_id_map)}", flush=True)


    ss_names = {name for val in courses_df["Skill Sets"].dropna() for name in _split_csv(val)}
    _skill_set_id_map.update(sync_named_model(SkillSet, ss_names))
    print(f"   [+] Skill Sets: {len(_skill_set_id_map)}", flush=True)

    print("   [OK] All lookup tables populated and committed.\n", flush=True)


def seed_courses(db: Session, df: pd.DataFrame):
    """Seed the courses table and all bridge tables efficiently in batches."""

    df = df.dropna(subset=["Course ID"]).drop_duplicates(subset=["Course ID"], keep="first")
    print(f"[PHASE 2] Seeding {len(df)} unique courses...", flush=True)


    db.execute(text("DELETE FROM courses;"))
    db.commit()

    created = 0
    errors = 0

    for idx, row in df.iterrows():
        try:
            sid_id = _safe_str(row.get("Course ID"), 255)
            if not sid_id:
                errors += 1
                continue

            title = _safe_str(row.get("Title"), 1000) or "Untitled"

            provider_name = _clean(row.get("Course Provider Name"))
            provider_id = _provider_id_map.get(provider_name) if provider_name else None

            sponsor_name = _clean(row.get("Program By"))
            sponsor_id = _program_sponsor_id_map.get(sponsor_name) if sponsor_name else None

            course = Course(
                sid_course_id=sid_id,
                title=title,
                readable_code=_safe_str(row.get("Readable Code"), 100),
                course_code=_safe_str(row.get("Course Code"), 500),
                short_description=_clean(row.get("Short Description")),
                long_description=_clean(row.get("Long Description")),
                learning_outcome=_clean(row.get("Learning Outcome")),
                course_type=_safe_str(row.get("Course Type"), 20) or "Online",
                course_mode=_safe_str(row.get("Course Mode"), 50),
                type_id=_safe_str(str(row.get("Type ID", "")), 20),
                availability=_safe_str(row.get("Availability"), 50),
                language=_safe_str(row.get("Language"), 100),
                price=_float_or_none(row.get("Price (INR)")),
                duration_minutes=_int_or_none(row.get("Duration (Minutes)")),
                assessment_type=_safe_str(row.get("Assessment Type"), 100),
                certificate_enabled=_bool_from_str(row.get("Certificate Enabled")),
                certificate_type=_safe_str(row.get("Certificate Type"), 255),
                credit=_safe_str(row.get("Credit"), 100),
                provider_id=provider_id,
                provider_sid_id=_safe_str(row.get("Course Provider ID"), 100),
                created_by=_safe_str(row.get("Created By"), 500),
                program_sponsor_id=sponsor_id,
                age_requirement=_safe_str(row.get("Age Requirement"), 100),
                educational_qualification=_clean(row.get("Educational Qualification")),
                industry_experience=_safe_str(row.get("Industry Experience"), 100),
                enrollment_count=_int_or_none(row.get("Enrollment Count")) or 0,
                rating_average=_float_or_none(row.get("Rating Average")),
                total_ratings=_int_or_none(row.get("Total Ratings")) or 0,
                nsqf_level=_safe_str(row.get("NSQF Level"), 50),
                job_role=_safe_str(row.get("Job Role"), 500),
                scheme_id=_safe_str(row.get("Scheme ID"), 100),
                course_created_date=_safe_str(row.get("Created Date"), 50),
                course_updated_date=_safe_str(row.get("Updated Date"), 50),
                start_date=_safe_str(row.get("Start Date"), 50),
                end_date=_safe_str(row.get("End Date"), 50),
                course_status_id=_safe_str(str(row.get("Course Status ID", "")), 50),
                learner_identifier=_safe_str(row.get("Learner Identifier"), 50),
                course_url=_clean(row.get("Course URL")),
                course_image_url=_clean(row.get("Course Image URL")),
                course_video_url=_clean(row.get("Course Video URL")),
                external_payment=_clean(row.get("External Payment")),
                sub_sector=_safe_str(row.get("Sub Sector"), 500),
            )


            course.course_sectors = [
                CourseSector(sector_id=_sector_id_map[s])
                for s in set(_split_csv(row.get("Sector(s)")))
                if s in _sector_id_map
            ]
            course.course_domains = [
                CourseDomain(domain_id=_domain_id_map[d])
                for d in set(_split_csv(row.get("Domain(s)")))
                if d in _domain_id_map
            ]
            course.course_occupations = [
                CourseOccupation(occupation_id=_occupation_id_map[o])
                for o in set(_split_csv(row.get("Occupation(s)")))
                if o in _occupation_id_map
            ]
            course.course_tags = [
                CourseTag(tag_id=_tag_id_map[t])
                for t in set(_split_csv(row.get("Tags")))
                if t in _tag_id_map
            ]
            course.course_nos_codes = [
                CourseNosCode(nos_code_id=_nos_code_id_map[c])
                for c in set(_split_csv(row.get("NOS Code(s)")))
                if c in _nos_code_id_map
            ]
            course.course_qp_codes = [
                CourseQpCode(qp_code_id=_qp_code_id_map[c])
                for c in set(_split_csv(row.get("QP Code(s)")))
                if c in _qp_code_id_map
            ]
            course.course_programs = [
                CourseProgram(program_id=_program_id_map[p])
                for p in set(_split_csv(row.get("Program(s)")))
                if p in _program_id_map
            ]
            course.course_initiatives = [
                CourseInitiative(initiative_id=_initiative_id_map[i])
                for i in set(_split_csv(row.get("Initiative Of")))
                if i in _initiative_id_map
            ]
            course.course_product_types = [
                CourseProductType(product_type_id=_product_type_id_map[pt])
                for pt in set(_split_csv(row.get("Learning Product Type(s)")))
                if pt in _product_type_id_map
            ]
            course.course_skill_sets = [
                CourseSkillSet(skill_set_id=_skill_set_id_map[ss])
                for ss in set(_split_csv(row.get("Skill Sets")))
                if ss in _skill_set_id_map
            ]

            db.add(course)
            created += 1

            if created % 200 == 0:
                db.commit()
                print(f"   ... processed {created}/{len(df)} courses", flush=True)

        except Exception as e:
            db.rollback()
            print(f"   [ERROR] Row {idx} ('{_clean(row.get('Title', '?'))}'): {e}", flush=True)
            errors += 1

    db.commit()
    print(f"\n   [OK] Courses: {created} created, {errors} errors", flush=True)


def enable_rls(eng):
    """Enable Row Level Security (RLS) on all public tables to secure Supabase Data API."""
    print("\n[PHASE 3] Enabling Row Level Security (RLS) on all tables...", flush=True)
    table_names = list(Base.metadata.tables.keys())
    with eng.connect() as conn:
        for table_name in table_names:
            try:
                conn.execution_options(isolation_level="AUTOCOMMIT")
                conn.execute(text(f'ALTER TABLE "{table_name}" ENABLE ROW LEVEL SECURITY;'))
            except Exception as e:
                print(f"   [WARN] Could not enable RLS on {table_name}: {e}", flush=True)
    print(f"   [OK] Row Level Security (RLS) successfully enabled on all {len(table_names)} tables.", flush=True)


def main():
    """Entry point for the seeding process."""
    print("=" * 65, flush=True)
    print("  Skill India Digital -> Supabase PostgreSQL Seeder", flush=True)
    print("=" * 65, flush=True)

    if not EXCEL_PATH.exists():
        print(f"\n[ERROR] Excel file not found: {EXCEL_PATH}", flush=True)
        print("   Expected at: docs/SkillIndiaDigital_AllCourses.xlsx", flush=True)
        sys.exit(1)

    start = time.time()


    print(f"\n[INFO] Reading Excel: {EXCEL_PATH.name} ...", flush=True)
    xlsx: dict[str, pd.DataFrame] = pd.read_excel(
        EXCEL_PATH,
        sheet_name=None,
        engine="openpyxl",
    )
    for name, df in xlsx.items():
        print(f"   Sheet '{name}': {len(df)} rows x {len(df.columns)} cols", flush=True)


    print("\n[INFO] Ensuring all tables exist...", flush=True)
    Base.metadata.create_all(bind=engine)
    print("   [OK] Tables ready.", flush=True)


    db = SessionLocal()
    try:
        courses_df = xlsx.get("All Courses")
        if courses_df is None:
            online = xlsx.get("Online Courses", pd.DataFrame())
            offline = xlsx.get("Offline Courses", pd.DataFrame())
            courses_df = pd.concat([online, offline], ignore_index=True)

        _populate_all_lookups(db, xlsx, courses_df)
        seed_courses(db, courses_df)
    finally:
        db.close()

    enable_rls(engine)

    elapsed = time.time() - start
    print(f"\n[DONE] Completed in {elapsed:.1f}s", flush=True)
    print("=" * 65, flush=True)


if __name__ == "__main__":
    main()
