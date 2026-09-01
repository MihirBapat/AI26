"""
SkillBridge AI Career Consultation Agent
=========================================
LiveKit Agents worker using Sarvam STT/TTS/LLM.

Run with:
    uv run python -m agent.main dev

Environment variables required (see README):
    LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
    SARVAM_API_KEY
    DATABASE_URL  (same as FastAPI)
"""

import asyncio
import logging
import os

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("skillbridge.agent")

# ---------------------------------------------------------------------------
# Import LiveKit Agents
# ---------------------------------------------------------------------------
try:
    from livekit.agents import (
        Agent,
        AgentSession,
        JobContext,
        WorkerOptions,
        cli,
        function_tool,
    )
    from livekit.agents.llm import ChatContext
    from livekit.plugins import sarvam
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "livekit-agents not installed. Run:\n"
        "  uv add livekit-agents livekit-api\n"
        "  uv add 'livekit-agents[sarvam]'"
    ) from exc

# ---------------------------------------------------------------------------
# Database helpers (reuse the FastAPI session machinery)
# ---------------------------------------------------------------------------
from app.db.session import SessionLocal
from app.models.candidate import CandidateProfile


def _get_profile(user_id: int) -> dict | None:
    """Fetch candidate profile by user_id outside of a request context."""
    with SessionLocal() as db:
        row = db.query(CandidateProfile).filter(CandidateProfile.user_id == user_id).first()
        if row is None:
            return None
        return {
            "full_name": row.full_name or "Candidate",
            "age": row.age,
            "district": row.district,
            "primary_goal": row.primary_goal,
            "current_education_level": row.current_education_level or "Not specified",
            "field_of_interest": row.field_of_interest or "Not specified",
            "current_skills": row.current_skills,
            "employment_status": row.employment_status or "Not specified",
            "willing_to_relocate": row.willing_to_relocate,
            "preferred_language": row.preferred_language or "en",
            "user_id": row.user_id,
        }


# ---------------------------------------------------------------------------
# System-prompt builder
# ---------------------------------------------------------------------------
_GOAL_LABELS = {
    "further_education": "pursuing further education/studies",
    "skill_development_course": "learning a job skill via a course",
    "looking_for_job": "looking for a job now",
    "undecided": "undecided / seeking guidance",
}

_LANG_CODE = {"mr": "mr-IN", "hi": "hi-IN", "en": "en-IN"}


def build_instructions(profile: dict) -> str:
    goal_label = _GOAL_LABELS.get(profile["primary_goal"], profile["primary_goal"])
    relocation = "willing to consider nearby districts" if profile["willing_to_relocate"] else "prefers to stay in their home district"
    lang = profile.get("preferred_language", "en")
    lang_prompt = {
        "mr": "CRITICAL: The candidate's preferred language is Marathi. You MUST respond and converse strictly in natural, conversational Marathi (मराठी).",
        "hi": "CRITICAL: The candidate's preferred language is Hindi. You MUST respond and converse strictly in natural, conversational Hindi (हिंदी).",
        "en": "Converse in English."
    }.get(lang, "Converse in English.")

    return f"""You are a warm, knowledgeable career and education guidance assistant for the Maharashtra Skill Development platform.

You are speaking with {profile['full_name']}, based in {profile['district']}, Maharashtra.

## Candidate Profile
- Age: {profile['age'] or 'not specified'}
- Education level: {profile['current_education_level']}
- Primary goal: {goal_label}
- Field of interest: {profile['field_of_interest']}
- Current skills: {profile['current_skills'] or 'none stated yet'}
- Employment status: {profile['employment_status']}
## Language Instruction
{lang_prompt}

## Tool Calling Rules
- CRITICAL: When calling any tool (`get_district_job_market`, `get_field_job_market`, `search_courses`, `get_courses_for_occupation`, `get_courses_by_sector`), you MUST ALWAYS pass all function arguments (district names, keywords, occupations, sectors) in standard English (e.g. use "Pune" instead of "पुणे", "Software Developer" instead of "सॉफ्टवेअर डेव्हलपर", "Electrician" instead of "इलेक्ट्रिशियन", "Paints" instead of "रंग").
- Once you receive the tool response in English, translate the information and converse naturally with the user in their preferred language.

## Your behaviour
- Speak in a friendly, encouraging tone. Use simple language.
- If their goal is 'undecided', your first job is to help them figure out whether further education, a skill-development course, or direct job search fits them best — ask about their situation, never force a choice.
- Ground every recommendation in real data for their district using the tools available. NEVER invent a course name, job count, or salary figure.
- If a tool returns no data or marks data_source as unavailable, explain what other related options or entry-level paths exist.
- Keep answers concise for voice — avoid bullet lists in speech; use natural sentences.
"""


# ---------------------------------------------------------------------------
# Agent Tools
# ---------------------------------------------------------------------------
import httpx

_BACKEND_BASE = os.environ.get("BACKEND_URL", "http://127.0.0.1:8000/api/v1")

DISTRICT_MAP = {
    "पुणे": "Pune",
    "मुंबई": "Mumbai",
    "नागपूर": "Nagpur",
    "नाशिक": "Nashik",
    "छत्रपती संभाजीनगर": "Aurangabad",
    "औरंगाबाद": "Aurangabad",
    "ठाणे": "Thane",
    "कोल्हापूर": "Kolhapur",
    "सोलापूर": "Solapur",
    "अमरावती": "Amravati",
    "नांदेड": "Nanded",
    "जळगाव": "Jalgaon",
    "सातारा": "Satara",
    "सांगली": "Sangli",
    "अहमदनगर": "Ahmednagar",
    "रत्नागिरी": "Ratnagiri",
    "सिंधुदुर्ग": "Sindhudurg",
    "धुळे": "Dhule",
    "नंदुरबार": "Nandurbar",
    "बीड": "Beed",
    "जालना": "Jalna",
    "लातूर": "Latur",
    "उस्मानाबाद": "Osmanabad",
    "धाराशिव": "Dharashiv",
    "परभणी": "Parbhani",
    "हिंगोली": "Hingoli",
    "बुलढाणा": "Buldhana",
    "अकोला": "Akola",
    "वाशीम": "Washim",
    "यवतमाळ": "Yavatmal",
    "वर्धा": "Wardha",
    "चंद्रपूर": "Chandrapur",
    "गडचिरोली": "Gadchiroli",
    "भंडारा": "Bhandara",
    "गोंदिया": "Gondia",
    "रायगड": "Raigad",
    "पालघर": "Palghar",
}

def _clean_district(d: str) -> str:
    return DISTRICT_MAP.get(d.strip(), d.strip())


async def _api_get(path: str, params: dict | None = None) -> dict:
    """Internal helper to call the FastAPI backend from the agent."""
    clean_params = {k: v for k, v in (params or {}).items() if v is not None}
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{_BACKEND_BASE}{path}", params=clean_params)
        r.raise_for_status()
        return r.json()


@function_tool()
async def get_district_job_market(district: str, sector: str | None = None) -> dict:
    """Get overall job demand for a Maharashtra district, optionally filtered by sector.
    Always relay the data_source field to the user."""
    return await _api_get("/jobs/districts/demand", {"district": _clean_district(district), "sector": sector})


@function_tool()
async def get_field_job_market(occupation: str, district: str) -> dict:
    """Get job demand, salary trend and top employers for a specific occupation in a district."""
    return await _api_get("/jobs/role-demand", {"role": occupation, "district": _clean_district(district)})



@function_tool()
async def search_courses(keywords: str) -> dict:
    """Find Skill India Digital courses matching given keywords (skills, occupation, or field of interest)."""
    return await _api_get("/courses", {"search": keywords})


@function_tool()
async def get_courses_for_occupation(occupation: str) -> dict:
    """Get course supply details (count, providers, enrollment, rating) for a specific occupation."""
    return await _api_get("/courses", {"search": occupation})


@function_tool()
async def get_skill_gap(occupation: str, district: str) -> dict:
    """Compare job demand in a district against national course supply for an occupation.
    Pass through gap_signal and note fields to the user as-is."""
    return await _api_get("/jobs/role-demand", {"role": occupation, "district": district})


@function_tool()
async def get_courses_by_sector(sector: str) -> dict:
    """List courses available in a sector — use when the candidate is unsure of a specific occupation."""
    return await _api_get("/courses", {"search": sector})



AGENT_TOOLS = [
    get_district_job_market,
    get_field_job_market,
    search_courses,
    get_courses_for_occupation,
    get_skill_gap,
    get_courses_by_sector,
]


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
async def entrypoint(ctx: JobContext) -> None:
    """Called once per room by the LiveKit agent worker."""
    await ctx.connect()

    # The room metadata contains the user_id set by the token identity
    participant = await ctx.wait_for_participant()
    user_id_str = participant.identity
    try:
        user_id = int(user_id_str)
    except ValueError:
        logger.error("Invalid participant identity (expected int user_id): %s", user_id_str)
        return

    profile = _get_profile(user_id)
    if profile is None:
        logger.warning("No profile found for user_id=%s — using generic instructions", user_id)
        profile = {
            "full_name": "Candidate",
            "age": None,
            "district": "Maharashtra",
            "primary_goal": "undecided",
            "current_education_level": "Not specified",
            "field_of_interest": "Not specified",
            "current_skills": None,
            "employment_status": "Not specified",
            "willing_to_relocate": False,
            "preferred_language": "en",
            "user_id": user_id,
        }

    lang = profile["preferred_language"]
    lang_code = _LANG_CODE.get(lang, "en-IN")

    session = AgentSession(
        stt=sarvam.STT(language=lang_code, model="saaras:v3"),
        llm=sarvam.LLM(model="sarvam-105b-conversations"),
        tts=sarvam.TTS(target_language_code=lang_code, model="bulbul:v3"),
        turn_detection="stt",
    )

    agent = Agent(
        instructions=build_instructions(profile),
        tools=AGENT_TOOLS,
    )

    await session.start(agent, room=ctx.room)

    # Greet the candidate by name
    name = profile.get("full_name", "Candidate").split()[0]
    
    greetings = {
        "en": f"Namaste {name}! I'm your career guidance assistant. I've already read your profile, so you don't need to repeat yourself. Tell me what's on your mind — or I can start by showing you what opportunities are available in your district.",
        "mr": f"नमस्कार {name}! मी तुमचा करिअर मार्गदर्शक आहे. मी तुमची प्रोफाइल आधीच वाचली आहे. तुम्हाला कोणत्या क्षेत्राबद्दल माहिती हवी आहे ते सांगा, किंवा तुमच्या जिल्ह्यात कोणत्या नोकरीच्या संधी आहेत हे मी सांगू का?",
        "hi": f"नमस्ते {name}! मैं आपका करियर मार्गदर्शन सहायक हूँ। मैंने आपकी प्रोफ़ाइल पहले ही पढ़ ली है। मुझे बताएं कि आप क्या सोच रहे हैं — या मैं आपको बता सकता हूँ कि आपके जिले में कौन से अवसर उपलब्ध हैं।"
    }
    
    greeting = greetings.get(lang, greetings["en"])
    
    await session.say(
        greeting,
        allow_interruptions=True,
    )


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, agent_name="counselor"))
