"""Seed script — populates Canonical Skills, Aliases, and Course-Skill mappings.

Usage:
    python -m app.scripts.seed_skills
"""

import logging
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import func, select
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.course import Course, CourseSkillSet, CourseTag
from app.models.skill import CourseSkill, Skill, SkillAlias
from app.services.skill_service import skill_service


def seed_skills_taxonomy():
    """Populate canonical skills taxonomy and link with existing courses."""
    print("=" * 60)
    print("  Seeding Canonical Skills & Course-Skill Relationships")
    print("=" * 60)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Seed foundational skills
        created_skills = skill_service.seed_foundational_skills(db)
        total_skills = db.scalar(select(func.count(Skill.id))) or 0
        print(f"   [+] Seeded {created_skills} new canonical skills (Total in DB: {total_skills})")

        # 2. Extract & Map skills for existing courses
        courses = db.execute(select(Course)).scalars().all()
        mapped_course_skills = 0

        for course in courses:
            # Check existing mappings
            existing_cs = db.execute(
                select(CourseSkill).where(CourseSkill.course_id == course.id)
            ).scalars().all()
            if existing_cs:
                continue

            extracted = skill_service.extract_skills_from_text(
                db, course.title, course.short_description or course.long_description or ""
            )

            for ext in extracted:
                if ext.canonical_id:
                    cs = CourseSkill(
                        course_id=course.id,
                        skill_id=ext.canonical_id,
                        proficiency_level=ext.proficiency_level,
                        is_core=True if ext.importance_weight >= 0.8 else False,
                        weight=ext.importance_weight,
                    )
                    db.add(cs)
                    mapped_course_skills += 1

        db.commit()
        print(f"   [+] Created {mapped_course_skills} Course-Skill bridge mappings.")
        print("[OK] Skill taxonomy seeding completed successfully.")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Skill seeding failed: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed_skills_taxonomy()
