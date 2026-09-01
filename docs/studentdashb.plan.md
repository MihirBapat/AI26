# Student/Candidate Feature — Full Build Guide

For someone building this for the first time — read top to bottom, build in this order.

---

## 0. Where this fits in what's already decided

Your SRS's **Candidate** persona: gives qualification, current skills, location, career interest → gets a path from current skills → skill gap → recommended course → job opportunity. Everything below is that, made concrete.

---

## 1. New table: `candidate_profiles` (proposal — not yet created, needs your go-ahead)

This is new, not a change to your existing course tables. Suggested columns, reasoned out for the Maharashtra context specifically:

| Column | Why this field, in this context |
|---|---|
| `id` (uuid, PK) | standard |
| `full_name` | for personalization in the voice agent's greeting |
| `age` | some SIDH courses have an `age_requirement` — needed to filter eligible courses |
| `district` | **the single most important field** — everything downstream (job market data, course relevance) keys off this. Dropdown of Maharashtra's 36 districts, not free text — free text will fight your Adzuna `where=` matching later |
| `primary_goal` | enum: `further_education` / `skill_development_course` / `looking_for_job` / `undecided` — this is the branch you specifically asked about. **`undecided` is important to include** — many users genuinely won't know yet, and the agent's job in that case is to help them figure it out via conversation, not force a premature choice on a form |
| `current_education_level` | e.g. `Below 10th`, `10th Pass`, `12th Pass`, `ITI/Diploma`, `Graduate`, `Postgraduate` — mirrors your `courses.educational_qualification` values so it can be matched directly |
| `field_of_interest` | free text, matched at query time against `sectors`/`occupations`/`tags` tables — don't force a rigid dropdown here, many users won't know the "official" sector name for what they want |
| `current_skills` | free text or multi-select against `skill_sets` (614 rows) — optional, many first-time users will have none yet |
| `employment_status` | `student` / `unemployed` / `employed_seeking_change` |
| `preferred_course_mode` | `online` / `offline` / `no_preference` — maps directly to `courses.course_mode` |
| `willing_to_relocate` | boolean — if false, job-market tools should stay scoped to their home district only; if true, the agent can compare across districts |
| `preferred_language` | `mr` / `hi` / `en` — feeds directly into the Sarvam STT/TTS `language_code` for their session |
| `created_at`, `updated_at` | standard |

**Deliberately left out:** salary expectations, caste/category, income — nothing here that isn't needed for the actual matching logic. Keep the form short; every extra field is a reason someone abandons it halfway.

```sql
-- proposal only — confirm before running
CREATE TABLE candidate_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150),
    age SMALLINT,
    district VARCHAR(50) NOT NULL,
    primary_goal VARCHAR(30) NOT NULL DEFAULT 'undecided',
    current_education_level VARCHAR(50),
    field_of_interest TEXT,
    current_skills TEXT,
    employment_status VARCHAR(30),
    preferred_course_mode VARCHAR(20) DEFAULT 'no_preference',
    willing_to_relocate BOOLEAN DEFAULT false,
    preferred_language VARCHAR(5) DEFAULT 'mr',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 2. The `/profile` form (frontend)

Keep it to one screen, ~7 questions, not a wizard — this is a first-time form for people who may not be tech-savvy:

1. Name + age
2. District (dropdown, Maharashtra districts only)
3. "What are you here for?" → the `primary_goal` options, phrased in plain language, e.g. *"I want to study further" / "I want to learn a job skill" / "I'm looking for a job now" / "I'm not sure yet"*
4. Current education level (dropdown)
5. What field/work interests you? (free text, this is fine to be vague)
6. Any skills you already have? (optional, free text)
7. Preferred language for talking to the assistant (Marathi/Hindi/English)

On submit → write to `candidate_profiles`, redirect to the dashboard, which immediately opens the LiveKit voice session.

---

## 3. How the profile becomes agent context

Don't make the user repeat themselves to the voice agent. On session start, fetch their profile row and inject it into the system prompt:

```python
def build_instructions(profile: dict) -> str:
    return f"""
You are a career and education guidance assistant for {profile['full_name']}, 
based in {profile['district']}, Maharashtra.

Profile:
- Age: {profile['age']}
- Education level: {profile['current_education_level']}
- Stated goal: {profile['primary_goal']}
- Field of interest: {profile['field_of_interest']}
- Current skills: {profile['current_skills'] or 'none stated yet'}
- Employment status: {profile['employment_status']}
- Willing to relocate for work: {profile['willing_to_relocate']}

If their goal is 'undecided', your first job is to help them figure out 
whether further education, a skill-development course, or a direct job 
search fits them best -- ask about their situation, don't just push a course.
Use the tools available to you to ground every recommendation in real 
data for their district (or nearby districts if they're open to relocating) 
-- never invent a course, job count, or demand figure. If a tool returns 
no data or an 'unavailable' data_source, say so plainly rather than guessing.
"""
```

```python
session = AgentSession(
    stt=sarvam.STT(language=f"{profile['preferred_language']}-IN", model="saaras:v3"),
    llm=sarvam.LLM(model="sarvam-105b"),
    tts=sarvam.TTS(target_language_code=f"{profile['preferred_language']}-IN", model="bulbul:v3"),
    turn_detection="stt",
)
agent = Agent(instructions=build_instructions(profile), tools=[...])  # tools below
```

---

## 4. Tools for the agent — mapped to endpoints you already have documented

Each of these wraps an endpoint from `Backend_API_Plan_v2.md` — build the tool as a thin wrapper, don't reimplement the logic.

```python
@function_tool()
async def get_district_job_market(ctx: RunContext, district: str, sector: str = None) -> dict:
    """Get overall job demand for a district, optionally filtered by sector."""
    # wraps GET /api/v1/demand/district-vacancy-counts
    ...

@function_tool()
async def get_field_job_market(ctx: RunContext, occupation: str, district: str) -> dict:
    """Get job demand, salary trend and top employers for a specific occupation in a district."""
    # wraps GET /api/v1/demand/trend + /api/v1/demand/top-employers
    ...

@function_tool()
async def search_courses(ctx: RunContext, keywords: str) -> dict:
    """Find SkillIndiaDigital courses matching given keywords (skills, occupation, or field of interest)."""
    # wraps GET /api/v1/supply/search (uses the existing search_vector column)
    ...

@function_tool()
async def get_courses_for_occupation(ctx: RunContext, occupation: str) -> dict:
    """Get course supply details (count, providers, enrollment, rating) for a specific occupation."""
    # wraps GET /api/v1/supply/courses-by-occupation
    ...

@function_tool()
async def get_skill_gap(ctx: RunContext, occupation: str, district: str) -> dict:
    """Compare job demand in a district against national course supply for an occupation."""
    # wraps GET /api/v1/insights/skill-gap
    # IMPORTANT: pass the gap_signal and note field straight through to the user when it's
    # "insufficient_data_for_district_supply" -- don't let the model paper over that gap
    ...

@function_tool()
async def get_courses_by_sector(ctx: RunContext, sector: str) -> dict:
    """List sectors and their course coverage, for when the user isn't sure of a specific occupation yet."""
    # wraps GET /api/v1/supply/courses-by-sector and /api/v1/supply/sectors
    ...

@function_tool()
async def update_profile_field(ctx: RunContext, field: str, value: str) -> dict:
    """Update a field on the user's profile as new information comes up in conversation
    (e.g. they mention a skill they didn't put on the form)."""
    # writes back to candidate_profiles -- whitelist which fields this can touch,
    # don't let the model write to id/created_at/etc.
    ...
```

**Tool design rule carried over from the backend plan:** every tool that touches demand data must return (and the agent must relay, not silently drop) the `data_source` field — if it's a Trends fallback or unavailable, the agent should say so in conversation, not present it with the same confidence as a live Adzuna number.

---

## 5. Build order (do these in sequence, not in parallel)

1. **Confirm and create `candidate_profiles`** in Supabase (get your explicit sign-off first, per your earlier instruction — this doc is a proposal, not an action taken)
2. **Build `/profile` form + save endpoint** — plain CRUD, no AI involved yet, get this working and tested first
3. **Wire the 6 tools above** against your already-documented API plan endpoints — test each tool as a normal function call, no voice yet
4. **Get a LiveKit + Sarvam session working with zero tools first** — just STT→LLM→TTS round-tripping in Marathi, confirm audio quality and latency before adding complexity
5. **Attach the tools to the agent, one at a time** — verify each tool call actually fires and returns sensibly before adding the next
6. **Wire profile injection into the system prompt** — last step, once the rest is proven independently

Building it in this order means when something breaks, you know which layer broke it — building voice + tools + profile injection all at once makes debugging much harder for a first attempt at this stack.

---

## Open question for you before any of this gets built

Confirm you want `candidate_profiles` created — nothing above touches the DB until you say so.