"""Skill Taxonomy, Normalization, and Extraction Service."""

import logging
import re
from difflib import SequenceMatcher
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.skill import CourseSkill, Skill, SkillAlias
from app.schemas.employer import (
    ExtractedSkillItem,
    SkillNormalizeResponse,
    SkillRead,
)

logger = logging.getLogger(__name__)

# Standard canonical seed skills across key sectors in Maharashtra
FOUNDATIONAL_SKILLS = [
    # Information Technology & Software
    {"name": "Python", "category": "Programming Language", "aliases": ["python3", "python 3", "python programming", "py"]},
    {"name": "FastAPI", "category": "Framework", "aliases": ["fast-api", "fastapi framework"]},
    {"name": "Django", "category": "Framework", "aliases": ["django framework", "django rest"]},
    {"name": "Flask", "category": "Framework", "aliases": ["flask framework"]},
    {"name": "Java", "category": "Programming Language", "aliases": ["core java", "java 8", "java 11", "java 17", "java programming"]},
    {"name": "Spring Boot", "category": "Framework", "aliases": ["springboot", "spring-boot", "spring framework"]},
    {"name": "JavaScript", "category": "Programming Language", "aliases": ["js", "ecmascript", "javascript programming"]},
    {"name": "TypeScript", "category": "Programming Language", "aliases": ["ts", "typescript programming"]},
    {"name": "React", "category": "Framework", "aliases": ["reactjs", "react.js", "react js", "react native"]},
    {"name": "Node.js", "category": "Framework", "aliases": ["nodejs", "node.js", "node js", "node"]},
    {"name": "PostgreSQL", "category": "Database", "aliases": ["postgres", "postgre sql", "psql", "postgresql db"]},
    {"name": "MySQL", "category": "Database", "aliases": ["my-sql", "mysql database"]},
    {"name": "MongoDB", "category": "Database", "aliases": ["mongo", "mongo db", "mongodb database"]},
    {"name": "Redis", "category": "Database", "aliases": ["redis cache", "redis db"]},
    {"name": "Docker", "category": "Cloud & DevOps", "aliases": ["docker containers", "dockerization"]},
    {"name": "Kubernetes", "category": "Cloud & DevOps", "aliases": ["k8s", "kubernetes cluster"]},
    {"name": "AWS", "category": "Cloud & DevOps", "aliases": ["amazon web services", "aws cloud"]},
    {"name": "Azure", "category": "Cloud & DevOps", "aliases": ["microsoft azure", "azure cloud"]},
    {"name": "Git", "category": "Tools", "aliases": ["github", "gitlab", "version control", "git vcs"]},
    {"name": "REST API", "category": "Architecture", "aliases": ["restful api", "rest apis", "restful web services"]},
    {"name": "Machine Learning", "category": "AI & Data", "aliases": ["ml", "applied machine learning"]},
    {"name": "Data Analysis", "category": "AI & Data", "aliases": ["data analytics", "data analyst skills"]},
    {"name": "SQL", "category": "Database", "aliases": ["structured query language", "sql queries"]},
    {"name": "Linux", "category": "Operating System", "aliases": ["linux administration", "ubuntu", "centos", "redhat", "unix"]},

    # Manufacturing & Automotive
    {"name": "CNC Machining", "category": "Manufacturing", "aliases": ["cnc operator", "cnc programming", "cnc milling", "cnc lathe", "cnc machine"]},
    {"name": "AutoCAD", "category": "Design & Engineering", "aliases": ["autocad 2d", "autocad 3d", "cad drafting"]},
    {"name": "SolidWorks", "category": "Design & Engineering", "aliases": ["solid works", "3d cad modeling"]},
    {"name": "PLC Programming", "category": "Automation", "aliases": ["plc scada", "programmable logic controller", "allen bradley plc", "siemens plc"]},
    {"name": "Industrial Automation", "category": "Automation", "aliases": ["factory automation", "robotics automation"]},
    {"name": "Arc Welding", "category": "Manufacturing", "aliases": ["smaw", "shielded metal arc welding", "electric arc welding"]},
    {"name": "TIG Welding", "category": "Manufacturing", "aliases": ["gtaw", "gas tungsten arc welding"]},
    {"name": "MIG Welding", "category": "Manufacturing", "aliases": ["gmaw", "gas metal arc welding"]},
    {"name": "Quality Inspection", "category": "Quality & Standards", "aliases": ["qa qc", "quality assurance", "quality control inspector", "six sigma"]},
    {"name": "EV Powertrain Maintenance", "category": "Automotive", "aliases": ["electric vehicle battery", "ev technician", "ev motor repair"], "is_emerging": True},

    # Electrical & Electronics
    {"name": "PCB Design", "category": "Electronics", "aliases": ["printed circuit board", "pcb layout", "altium designer", "kicad"]},
    {"name": "Embedded C", "category": "Electronics", "aliases": ["embedded systems", "microcontroller programming", "c for embedded"]},
    {"name": "Solar PV Installation", "category": "Renewable Energy", "aliases": ["solar technician", "solar panel installation", "rooftop solar"]},
    {"name": "Electrical Wiring & Maintenance", "category": "Electrical", "aliases": ["electrician", "wireman", "industrial wiring", "panel wiring"]},

    # Healthcare, BFSI & Professional
    {"name": "Clinical Documentation", "category": "Healthcare", "aliases": ["medical records", "patient charting"]},
    {"name": "Phlebotomy", "category": "Healthcare", "aliases": ["blood collection", "venipuncture"]},
    {"name": "Financial Risk Analysis", "category": "BFSI", "aliases": ["credit risk", "risk management", "financial modeling"]},
    {"name": "GST & Statutory Compliance", "category": "BFSI", "aliases": ["gst filing", "tally prime", "taxation", "accounting compliance"]},
    {"name": "Supply Chain & Logistics Management", "category": "Logistics", "aliases": ["warehouse management", "inventory control", "supply chain operations"]},
]


class SkillService:
    """Service handling Canonical Skill Taxonomy, Normalization, and Extraction."""

    def normalize_string(self, text: str) -> str:
        """Strip punctuation and lowercase string for robust matching."""
        if not text:
            return ""
        cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
        return " ".join(cleaned.split())

    def seed_foundational_skills(self, db: Session) -> int:
        """Seed foundational canonical skills and aliases if not present."""
        created_count = 0
        seen_aliases: set[str] = set(
            db.execute(select(SkillAlias.normalized_alias)).scalars().all()
        )

        for item in FOUNDATIONAL_SKILLS:
            norm_name = self.normalize_string(item["name"])
            existing_skill = db.execute(
                select(Skill).where(
                    or_(Skill.normalized_name == norm_name, Skill.name == item["name"])
                )
            ).scalar_one_or_none()

            if not existing_skill:
                existing_skill = Skill(
                    name=item["name"],
                    normalized_name=norm_name,
                    category=item.get("category", "General"),
                    is_emerging=item.get("is_emerging", False),
                )
                db.add(existing_skill)
                db.flush()
                created_count += 1

            # Seed aliases safely
            for alias in item.get("aliases", []):
                norm_alias = self.normalize_string(alias)
                if not norm_alias or norm_alias == norm_name:
                    continue
                if norm_alias not in seen_aliases:
                    new_alias = SkillAlias(
                        skill_id=existing_skill.id,
                        alias=alias,
                        normalized_alias=norm_alias,
                    )
                    db.add(new_alias)
                    seen_aliases.add(norm_alias)

        db.commit()
        return created_count

    def normalize_skill(self, db: Session, raw_skill: str) -> SkillNormalizeResponse:
        """Normalize a raw skill name to a canonical Skill using exact, alias, and fuzzy matching."""
        cleaned_raw = raw_skill.strip()
        norm = self.normalize_string(cleaned_raw)

        if not norm:
            return SkillNormalizeResponse(raw_input=raw_skill, canonical_skill=None, matched_via="unmatched", confidence=0.0)

        # 1. Exact match on Skill name or normalized_name
        skill = db.execute(
            select(Skill).where(
                or_(func.lower(Skill.name) == cleaned_raw.lower(), Skill.normalized_name == norm)
            )
        ).scalar_one_or_none()

        if skill:
            return SkillNormalizeResponse(
                raw_input=raw_skill,
                canonical_skill=SkillRead.model_validate(skill),
                matched_via="exact",
                confidence=1.0,
            )

        # 2. Match on SkillAlias
        alias_record = db.execute(
            select(SkillAlias).where(
                or_(func.lower(SkillAlias.alias) == cleaned_raw.lower(), SkillAlias.normalized_alias == norm)
            )
        ).scalar_one_or_none()

        if alias_record and alias_record.skill:
            return SkillNormalizeResponse(
                raw_input=raw_skill,
                canonical_skill=SkillRead.model_validate(alias_record.skill),
                matched_via="alias",
                confidence=0.95,
            )

        # 3. Fuzzy matching against all canonical skills and aliases
        all_skills = db.execute(select(Skill)).scalars().all()
        best_skill = None
        best_ratio = 0.0

        for s in all_skills:
            # Check skill name ratio
            ratio = SequenceMatcher(None, norm, s.normalized_name).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_skill = s

            # Check aliases ratio
            for a in s.aliases:
                a_ratio = SequenceMatcher(None, norm, a.normalized_alias).ratio()
                if a_ratio > best_ratio:
                    best_ratio = a_ratio
                    best_skill = s

        if best_ratio >= 0.85 and best_skill:
            return SkillNormalizeResponse(
                raw_input=raw_skill,
                canonical_skill=SkillRead.model_validate(best_skill),
                matched_via="fuzzy",
                confidence=round(best_ratio, 2),
            )

        return SkillNormalizeResponse(
            raw_input=raw_skill,
            canonical_skill=None,
            matched_via="unmatched",
            confidence=0.0,
        )

    def extract_skills_from_text(
        self,
        db: Session,
        title: str,
        description: str,
        additional_requirements: str | None = None,
    ) -> list[ExtractedSkillItem]:
        """Extract canonical skills from job title, description, and requirements using regex and alias mapping."""
        combined_text = f"{title}\n{description}\n{additional_requirements or ''}"
        norm_text = f" {self.normalize_string(combined_text)} "

        # Load all canonical skills and aliases into memory for fast parsing
        skills = db.execute(select(Skill)).scalars().all()
        if not skills:
            self.seed_foundational_skills(db)
            skills = db.execute(select(Skill)).scalars().all()

        extracted: dict[int, ExtractedSkillItem] = {}

        # Look for requirement keywords (e.g. 'required', 'must have', 'preferred', 'nice to have')
        preferred_section_regex = r"(preferred|good to have|nice to have|plus|bonus|optional)[\s\S]*"
        preferred_match = re.search(preferred_section_regex, combined_text, re.IGNORECASE)
        preferred_text = preferred_match.group(0).lower() if preferred_match else ""

        for skill in skills:
            # Check canonical name match
            pattern_skill = r"\b" + re.escape(skill.normalized_name) + r"\b"
            matched = bool(re.search(pattern_skill, norm_text))
            matched_name = skill.name

            # Check aliases match
            if not matched:
                for alias in skill.aliases:
                    pattern_alias = r"\b" + re.escape(alias.normalized_alias) + r"\b"
                    if re.search(pattern_alias, norm_text):
                        matched = True
                        matched_name = alias.alias
                        break

            if matched:
                # Determine requirement type
                is_preferred = bool(preferred_text and (matched_name.lower() in preferred_text or skill.normalized_name in preferred_text))
                req_type = "preferred" if is_preferred else "required"

                # Check if mentioned in title (higher importance)
                is_in_title = bool(re.search(r"\b" + re.escape(skill.normalized_name) + r"\b", self.normalize_string(title)))
                importance = 1.0 if is_in_title else (0.8 if req_type == "required" else 0.5)

                extracted[skill.id] = ExtractedSkillItem(
                    name=skill.name,
                    canonical_id=skill.id,
                    category=skill.category,
                    requirement_type=req_type,
                    proficiency_level="advanced" if is_in_title else "intermediate",
                    importance_weight=importance,
                    confidence_score=0.95 if is_in_title else 0.85,
                    extraction_source="rule_extracted",
                )

        return list(extracted.values())

    def get_or_create_skill(self, db: Session, skill_name: str, category: str = "General") -> Skill:
        """Find existing skill by name/alias or create a new canonical skill."""
        norm_name = self.normalize_string(skill_name)
        existing = db.execute(
            select(Skill).where(
                or_(Skill.normalized_name == norm_name, func.lower(Skill.name) == skill_name.strip().lower())
            )
        ).scalar_one_or_none()

        if existing:
            return existing

        alias_match = db.execute(
            select(SkillAlias).where(SkillAlias.normalized_alias == norm_name)
        ).scalar_one_or_none()

        if alias_match and alias_match.skill:
            return alias_match.skill

        # Create new canonical skill
        new_skill = Skill(
            name=skill_name.strip(),
            normalized_name=norm_name,
            category=category,
            is_emerging=False,
        )
        db.add(new_skill)
        db.commit()
        db.refresh(new_skill)
        return new_skill


skill_service = SkillService()
