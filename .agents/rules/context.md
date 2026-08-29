---
trigger: always_on
---

# PS 26134 — SRS

**SIH PS 26134** | *Challenges in Aligning Skill Development Programs with Industry Requirements and Emerging Job Market Demands*
Govt of Maharashtra — Maharashtra State Innovation Society, Dept. of Skills, Employment, Entrepreneurship and Innovation

## 1. Problem Statement

Skill-development programmes are often built on broad/historical occupation categories that don't reflect current technologies, local industry demand, job roles, or employer expectations. Curricula, equipment, trainer capacity and assessment methods lag emerging requirements — employers can't find job-ready candidates; trainees complete courses with weak placement potential.

**Goal:** a continuous, evidence-based mechanism translating industry demand into course design, capacity planning, trainer development and candidate guidance.

**Expected outcome:** a platform combining job-posting signals, employer surveys, industry consultations, sector growth data, placement outcomes and tech trends to identify demand by role/skill/location/proficiency; map gaps to courses; recommend curriculum updates; flag obsolete/oversupplied courses; support employer validation; generate district-level training plans.

## 2. Proposed Solution

**Labour Market Intelligence and Skill Alignment Platform** — continuously analyses demand, market signals, employer input, training data and placement outcomes to drive: curriculum improvement (kept simple — primary objective), training capacity/trainer planning (unique), district-level workforce planning.

**Core loop:** Industry Demand → Skills → Courses → Training Capacity → Candidates → Placement → Feedback

**Positioning:** other systems answer "what jobs are available?" — this platform answers *"what should Maharashtra train for, where, at what scale, with which skills/curriculum/trainers/infrastructure — and how do candidates get there?"*

## 3. Users

| Stakeholder | Gives | Gets |
|---|---|---|
| Government/Policy Maker | District, sector, time-period | High-demand roles, emerging skills, shortages, capacity, course performance, interventions |
| Training Provider | Their course | Industry relevance, skill gaps, placement performance, curriculum/infra recommendations |
| Employer | Role requirements, hiring signals | Skill validation, missing-skill flags, demand-signal contribution |
| Candidate | Qualification, skills, location, interest | Skills → gap → course → job path |

## 4. Raw Requirements

- **RR-01 Labour Market Intelligence:** analyse job postings, employer surveys, industry consultations, sector growth, tech trends, placement outcomes
- **RR-02 Demand Identification:** by Role + Skill + Location (heatmap emphasis) + Sector + Proficiency
- **RR-03 Skill Gap Detection:** industry-required vs. course-provided skills (optional → folded into MVP flow)
- **RR-04 Course/Qualification Mapping:** Job Role → Skills → Qualification → Course → Provider
- **RR-05 Curriculum Alignment:** flag courses needing updates/new skills/tech/replacement — *standout feature*. Possible formula: Outdated Score = Demand ÷ (Registrations × Relevancy + Tutor Experience)
- **RR-06 Employer Validation:** employers validate skills/roles/tech (optional, unique)
- **RR-08 District Planning:** district-level capacity & priority recommendations (unique)
- **RR-09 Candidate Guidance:** skill/course/career recommendations (optional)
- **RR-10 Continuous Feedback:** placement outcomes feed back to improve recommendations — keeps the AI explainable, not a black box

## 5. Use Cases

- **Government:** in → district+sector+period; out → demand roles, emerging skills, shortages, capacity, course performance, interventions
- **Training Provider:** in → course; out → relevance, gaps, placement performance, curriculum/infra recs
- **Employer:** in → role+requirements; out → validation, gap flags, demand signal
- **Candidate:** in → qualification+skills+location+interest; out → career → gap → course → job

## 6. Functional Requirements

FR-01 Collect data (postings, employers, training systems, industry) · FR-02 Extract/normalise roles, skills, qualifications, tech · FR-03 Demand trend calculation · FR-04 Map skills→occupations→qualifications→courses · FR-05 Detect skill gaps · FR-06 Course/skill alignment scores · FR-07 Flag emerging/declining/obsolete skills · FR-08 Curriculum-update recommendations · FR-09 District-level capacity recommendations · FR-10 Employer validation of requirements · FR-11 Candidate career/course recommendations · FR-12 Dashboards/reports/alerts · FR-13 Track placement outcomes as feedback · FR-14 Evidence/confidence on recommendations · FR-15 Role-based access (govt/provider/employer/candidate)

## 7. Non-Functional Requirements

Performance (responsive dashboards under load) · Scalability (pilot → statewide) · Security (auth, encryption, secure APIs, audit logs) · Privacy (minimise/anonymise candidate PII) · Explainability (Recommendation + Evidence + Confidence + Reason) · Reliability (detect missing/duplicate/stale data) · Maintainability (independently maintainable modules) · Localisation (Maharashtra geography, Marathi) · Interoperability (secure integration with existing gov/training systems)

## 8. Data Requirements

- **Job:** role, skills, location, industry, qualification, experience, salary, posting date
- **Skill:** name, category, related skills, technology, proficiency, demand trend
- **Course:** name, qualification, skills taught, duration, provider, capacity, enrolment, completion, placement rate
- **Training Centre:** location, courses, capacity, trainers, trainer skills, equipment, utilisation
- **Employer:** industry, required roles/skills, hiring demand, validation responses
- **Placement:** course, status, role, employer, location, salary band, time-to-placement

## 9. Data Constraints

Data quality (incomplete/duplicate/inconsistent) · Urban/digital bias in online postings · Geographic bias across districts · Temporal bias (short spikes ≠ trends) · Provenance (source + update time retained) · Privacy (no unnecessary PII exposure) · AI uncertainty (predictions ≠ guarantees)

## 10. Innovative Features (full vision, beyond current MVP)

Skill Velocity (rate of change in demand) · Skill Gap Index (demand vs. supply mismatch) · Course Alignment Score (demand+relevance+placement+validation+trend) · Skill Early-Warning System (pre-empt shortages) · Curriculum Copilot (gaps → modules → outcomes) · District Skill Heatmap (demand+shortage+capacity+placement by district) · Career GPS (skills→gap→path→role→job) · What-If Policy Simulator (capacity-change impact modelling) · Employer Confidence Layer (multi-employer validation weighting) · Closed-Loop Intelligence (placement outcomes improve future recommendations)

## 11. MVP Scope for SIH

**Workflow:** Job/Industry Data → Skill Extraction & Normalisation → Demand Analysis → Skill-to-Course Mapping → Skill Gap Detection → Curriculum/Training Recommendation → District Dashboard → Candidate Career Path.

**Two standout features:**
1. **District-Level Skill Heatmap** — demand, shortage, capacity and placement by district, at a glance.
2. **Evaluator Recommendation Portal** — engine ranks top-priority skills per sector with supporting evidence (economic/employer-survey data); a human evaluator reviews and re-ranks; that adjustment feeds back into the system. Human-in-the-loop, not a black box. *Example: for Electronics, engine ranks top 3 skills with justification → evaluator reviews/re-ranks → system updates.*

**Folded into MVP rather than built standalone:** Skill Gap Detection (RR-03, part of core flow) · Employer Validation (RR-06, lightweight demand input only) · Candidate Guidance (RR-09, basic path view, not full Career GPS).