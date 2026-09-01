import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.db.session import SessionLocal, engine
from sqlalchemy import select, func
from app.models.skill import Skill, SkillAlias
from app.services.skill_service import skill_service

db = SessionLocal()
print('=== DATABASE ENGINE INFO ===')
print('Engine URL:', engine.url)
print('Dialect:', engine.dialect.name)

total_skills = db.scalar(select(func.count(Skill.id)))
total_aliases = db.scalar(select(func.count(SkillAlias.id)))
print(f'Total Skills in DB: {total_skills}')
print(f'Total Skill Aliases in DB: {total_aliases}')

skills = db.execute(select(Skill).limit(10)).scalars().all()
print('Sample skills in DB:')
for s in skills:
    print(f'  - id={s.id}, name="{s.name}", normalized_name="{s.normalized_name}", category="{s.category}"')

sample_aliases = db.execute(select(SkillAlias).limit(10)).scalars().all()
print('Sample aliases in DB:')
for a in sample_aliases:
    print(f'  - id={a.id}, skill_id={a.skill_id}, alias="{a.alias}", normalized_alias="{a.normalized_alias}"')

test_names = ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Git', 'AWS', 'Redis', 'REST API', 'REST APIs']
print('\n=== NORMALIZATION CHECK ===')
for name in test_names:
    norm = skill_service.normalize_string(name)
    skill_match = db.execute(select(Skill).where(Skill.normalized_name == norm)).scalar_one_or_none()
    alias_match = db.execute(select(SkillAlias).where(SkillAlias.normalized_alias == norm)).scalar_one_or_none()
    print(f'"{name}" -> normalized: "{norm}" | in Skill: {bool(skill_match)} | in SkillAlias: {bool(alias_match)}')

title = 'Backend Developer'
description = 'We are looking for a Backend Developer with strong experience in Python, FastAPI, PostgreSQL, REST APIs, Docker and Git. AWS and Redis are preferred.'
print('\n=== RUNNING EXTRACT_SKILLS_FROM_TEXT ===')
res = skill_service.extract_skills_from_text(db, title, description)
print(f'Extracted count: {len(res)}')
for r in res:
    print(f'  - {r}')

db.close()
