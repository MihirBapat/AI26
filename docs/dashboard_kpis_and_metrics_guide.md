# Dashboard KPIs & Intelligence Metrics Reference Guide

**SIH PS 26134** | *Challenges in Aligning Skill Development Programs with Industry Requirements and Emerging Job Market Demands*  
*Government of Maharashtra — Labour Market Intelligence & Skill Alignment Platform*

---

## 📌 Overview

This document provides a comprehensive technical and functional breakdown of **every Key Performance Indicator (KPI)**, chart, and metric displayed across the Government Dashboard and Intelligence modules, including:
1. **Labor Market Intelligence (Analysis Tab)**
2. **Skill Development Courses Catalog (Courses Tab)**
3. **Course Health & Industry Alignment Intelligence Report (Course Health Page)**

---

## 1. Labor Market Intelligence Tab (`AnalysisView`)

Located on the **Labor Market Intelligence** tab of the Government Dashboard (`/gov/dashboard`).

### A. Statewide View (`All Maharashtra`)

| KPI / Card | Description | Source API Endpoint | Backend Data Calculation & Model |
|---|---|---|---|
| **Total Open Positions** | Total active job openings aggregated across all 36 Maharashtra districts. | `GET /api/v1/jobs/districts/heatmap` | Aggregated sum of `total_vacancies` across all 36 district points or `total_state_vacancies` from the Adzuna Maharashtra ingest pipeline. |
| **Highest Demand District** | The leading industrial / employment hub with the highest active vacancy volume. | `GET /api/v1/jobs/districts/heatmap` | Extracted from `highest_demand_district` (dynamically determined by max vacancy count & weighted demand score). |
| **Statewide Demand Map** | Interactive geospatial map color-coding demand intensity per district (Blue/Cyan gradient). | `GET /api/v1/jobs/districts/heatmap` | Renders MapLibre GL markers using `latitude`, `longitude`, `demand_score`, and `total_vacancies` for each district. |
| **Top 15 Districts by Demand** | Horizontal bar chart ranking districts by overall employment demand score. | `GET /api/v1/jobs/districts/heatmap` | `districts` list sorted descending by `demand_score` (Top 15). |
| **Sector Demand Breakdown** | Distribution of open positions across primary industry sectors. | `GET /api/v1/jobs/districts/demand` | Aggregated vacancy distribution across sectors (IT, Automotive, Healthcare, BFSI, Manufacturing). |

---

### B. District-Specific View (e.g. *Pune, Mumbai, Nashik, Nagpur, etc.*)

| KPI / Card | Description | Source API Endpoint | Backend Data Calculation & Model |
|---|---|---|---|
| **Demand Score (/100)** | Normalized composite market demand intensity index for the selected district. | `GET /api/v1/jobs/districts/demand?district={name}&sector={id}` | Calculated in `job_service.py` based on active vacancy density relative to regional labor capacity: `min(100.0, max(15.0, (weight / 1.6) * 100.0))`. |
| **Demand Level Badge** | Categorical demand rating (`High`, `Moderate`, `Emerging`). | `GET /api/v1/jobs/districts/demand?district={name}` | Mapped from `demand_score`: $\ge 75 \to \text{High}$, $\ge 50 \to \text{Moderate}$, $< 50 \to \text{Emerging}$. |
| **Active Vacancies** | Total open jobs in the selected district (and optional sector filter). | `GET /api/v1/jobs/districts/demand?district={name}&sector={id}` | `total_vacancies` returned by Adzuna query `where="{district}, Maharashtra"`. |
| **Average Salary** | Benchmark annual market salary offered by hiring employers in this district. | `GET /api/v1/jobs/districts/demand?district={name}` | `average_salary` computed from the mean of minimum and maximum salary postings in that district. |
| **Job Density Heatmap** | High-precision visual density layer centered on the district's industrial clusters. | `MapLibre GL` native heatmap layer | Centered on `[longitude, latitude]` with density radius proportional to `total_vacancies`. |
| **Salary Progression Trend** | 6-month historical trajectory of compensation and vacancy growth. | `GET /api/v1/jobs/salary/history?district={name}&sector={id}` | Time-series points from `SalaryHistoryResponse` with trend indicator (`upward`, `stable`, `downward`). |
| **Top In-Demand Roles** | Top 5 job roles with the highest hiring volume in this district. | `GET /api/v1/jobs/districts/demand?district={name}` | `top_roles` extracted from live job titles and occupational mapping. |
| **Top Hiring Employers** | Major companies actively recruiting in this district. | `GET /api/v1/jobs/districts/demand?district={name}` | `top_employers` list (e.g. TCS, Mahindra, L&T, Infosys, Persistent) with active vacancy counts. |

---

## 2. Skill Development Courses Tab (`CourseView`)

Located on the **Skill Development Courses** tab of the Government Dashboard (`/gov/dashboard`).

| KPI / Card | Description | Source API Endpoint | Backend Data Calculation & Model |
|---|---|---|---|
| **Total Courses Catalogued** | Total active Skill India Digital (SID) courses available in the system. | `GET /api/v1/courses/stats` | SQL query: `SELECT count(*) FROM courses`. Sub-breakdown calculates `online_courses` (`WHERE course_type = 'Online'`) vs. `offline_courses` (`WHERE course_type = 'Offline'`). |
| **Total Student Enrollments** | Aggregate student registrations across all catalogued courses. | `GET /api/v1/courses/stats` | SQL query: `SELECT sum(enrollment_count) FROM courses`. |
| **Certified Training Providers** | Number of unique NSDC / SID accredited institutions offering courses. | `GET /api/v1/courses/stats` | SQL query: `SELECT count(DISTINCT provider_id) FROM courses`. |
| **Industry Sectors Covered** | Total distinct economic sectors mapped to courses. | `GET /api/v1/courses/stats` | SQL query: `SELECT count(DISTINCT sector_id) FROM course_sectors`. Also provides `free_courses` vs. `paid_courses` counts. |
| **Filtered Course Catalog** | Searchable, filterable, and paginated course card grid. | `GET /api/v1/courses` | Accepts `search`, `sector_id`, `course_type`, `free_only`, `has_certificate`, `sort_by`, `page`, `size`. |

---

## 3. Course Health & Industry Alignment Report (`CourseHealthReport`)

Located at the dedicated URL `/gov/course/:id` (accessed by clicking **"Health Report"** on any course card).

### A. Executive Health Gauges & Metrics

| KPI / Card | Description | Source API Endpoint | Formula & Calculation |
|---|---|---|---|
| **Course Health Index** | Composite overall score (0–100) and Letter Grade (*Grade A, B, C, D*). | `GET /api/v1/courses/{id}/health-report?district={name}` | $$H = 0.35 \cdot S_{\text{demand}} + 0.25 \cdot S_{\text{modernity}} + 0.25 \cdot S_{\text{placement}} + 0.15 \cdot (100 - S_{\text{obsolescence}})$$ |
| **Industry Demand Score** | Percentage rating of labor market demand for the course's domain. | `GET /api/v1/courses/{id}/health-report?district={name}` | $$S_{\text{demand}} = \min\left(98, \max\left(25, 35 + \frac{V_{\text{openings}}}{K} \cdot 8\right)\right)$$ |
| **Active Openings** | Live job postings matching the course's target occupations. | `GET /api/v1/courses/{id}/health-report?district={name}` | `total_state_openings` from live Adzuna search for target occupations/skills in the selected district or state. |
| **Market Salary (Avg / Entry / Senior)** | Benchmark salary spectrum for graduates. | `GET /api/v1/courses/{id}/health-report?district={name}` | `avg_salary_inr`, `entry_salary_inr`, `senior_salary_inr` calculated from live job postings. |
| **Curriculum Modernity Score** | Rating of contemporary standards and qualification pack rigor. | `GET /api/v1/courses/{id}/health-report?district={name}` | Evaluates NSQF level ($+50$), QP/NOS codes ($+15$), Govt Certificate ($+10$), and user ratings ($+20$). |
| **Obsolescence / Outdated Risk** | Risk of curriculum becoming obsolete vs modern tech (lower is better). | `GET /api/v1/courses/{id}/health-report?district={name}` | $$S_{\text{obsolescence}} = \max(5, \min(85, 100 - (0.55 \cdot S_{\text{demand}} + 0.45 \cdot S_{\text{modernity}})))$$ |
| **Placement Potential** | Estimated candidate absorption rate into regional jobs. | `GET /api/v1/courses/{id}/health-report?district={name}` | $$S_{\text{placement}} = \min(98, \max(30, 0.6 \cdot S_{\text{demand}} + 0.4 \cdot S_{\text{modernity}} + 5))$$ |

---

### B. Detailed Analysis Tabs

| Tab / Component | Description | Source API Endpoint | Output Structure |
|---|---|---|---|
| **AI Executive Summary** | Contextual narrative summary of the course's health and market alignment. | `GET /api/v1/courses/{id}/health-report` | `ai_executive_summary` string dynamically customized to the selected district and course title. |
| **Salary Distribution Histogram** | Bar chart showing vacancy counts across compensation brackets. | `GET /api/v1/courses/{id}/health-report` | `salary_bands`: Array of brackets (e.g. *< ₹3.5L, ₹3.5L-₹7.0L, ₹7.0L-₹12.0L, > ₹12.0L*). |
| **Top Hiring Employers** | Companies actively recruiting for this skill profile. | `GET /api/v1/courses/{id}/health-report` | `top_employers`: Array with employer name, open openings, and average salary. |
| **Skill Gap Matrix** | Side-by-side comparison of Taught Skills vs. Missing Gaps vs. Legacy Skills. | `GET /api/v1/courses/{id}/health-report` | `skills_analysis`: Array with `skill_name`, `status` (`taught`, `emerging_gap`, `declining`), and `demand_growth_pct`. |
| **Curriculum Upgrade Recommendations** | Actionable recommendations for university boards and training institutes. | `GET /api/v1/courses/{id}/health-report` | `recommendations`: Array with category (`add_module`, `update_tooling`, `capacity_adjustment`), priority, and expected placement uplift. |
| **District Demand Map** | Geographic vacancy breakdown across Maharashtra districts. | `GET /api/v1/courses/{id}/health-report` | `district_demand`: Array of top hiring districts with vacancy counts and intensity badges. |

---

## 4. API Endpoints Quick Reference Table

| Feature / Module | Method & Endpoint | Key Parameters | Primary Response Fields |
|---|---|---|---|
| **District Heatmap & Vacancies** | `GET /api/v1/jobs/districts/heatmap` | `sector` *(optional)* | `total_state_vacancies`, `districts[]`, `highest_demand_district` |
| **District Demand Summary** | `GET /api/v1/jobs/districts/demand` | `district`, `sector` | `total_vacancies`, `demand_score`, `average_salary`, `top_employers[]`, `top_roles[]` |
| **Salary Historical Trends** | `GET /api/v1/jobs/salary/history` | `district`, `sector`, `what` | `history[]`, `trend_direction` (`upward`, `stable`, `downward`) |
| **Role-Specific Market Demand** | `GET /api/v1/jobs/role-demand` | `role_name`, `district` | `demand_index`, `average_salary`, `top_hiring_companies[]`, `matched_courses[]` |
| **Course Catalog Aggregate Stats** | `GET /api/v1/courses/stats` | *None* | `total_courses`, `online_courses`, `offline_courses`, `total_enrollments`, `unique_providers`, `unique_sectors` |
| **Course Search & Filter** | `GET /api/v1/courses` | `search`, `sector_id`, `course_type`, `free_only`, `page`, `size` | `items[]`, `total`, `page`, `pages` |
| **Course Detail** | `GET /api/v1/courses/{id}` | `id` | Full course details, descriptions, learning outcomes, QP/NOS codes |
| **Course Health & Alignment Report** | `GET /api/v1/courses/{id}/health-report` | `district` *(optional)* | `overall_health_score`, `health_grade`, `industry_demand_score`, `salary_bands[]`, `skills_analysis[]`, `recommendations[]`, `district_demand[]` |
