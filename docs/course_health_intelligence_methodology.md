# Course Health & Labor Market Intelligence Methodology

**SIH PS 26134** | *Challenges in Aligning Skill Development Programs with Industry Requirements and Emerging Job Market Demands*  
*Labour Market Intelligence & Skill Alignment Platform — Government of Maharashtra*

---

## 1. Overview & Objective

Traditional vocational and university courses are often updated on static 3–5 year cycles, causing curricula to lag behind emerging employer requirements and modern tooling. 

The **Course Health & Labor Market Intelligence Engine** provides a continuous, evidence-based evaluation of Skill India Digital (SID) courses against real-time 2026 Maharashtra hiring data. It predicts course relevance, flags obsolescence risks, detects missing skill gaps, and recommends actionable curriculum updates.

---

## 2. How to Access the Feature

### A. Through the Web Application (Government Dashboard)
1. **Navigate to the Gov Dashboard**: Open `http://localhost:5173/gov/dashboard` (Log in with Government credentials).
2. **Switch to the "Courses" Tab**: Click **Skill Development Courses** in the sidebar.
3. **Select District Scope**: Use the top navbar dropdown to choose **All Maharashtra** (statewide) or any specific district (e.g., *Pune, Mumbai, Nashik, Nagpur, Aurangabad, etc.*).
4. **Open the Intelligence Report**: On any course card, click the **"Health Report"** button (or click the course title).
5. **Switch Districts Interactively**: On the report page (`/gov/course/:id`), use the top-right district dropdown to instantly re-analyze market demand for other districts.
6. **Export / Print**: Click the **Print Report** button in the header for a print/PDF formatted policy summary.

---

### B. Through the REST API
**Endpoint:**  
`GET /api/v1/courses/{course_id}/health-report`

**Query Parameters:**
* `district` *(optional, string)*: Filter market intelligence to a specific Maharashtra district (e.g., `Pune`, `Mumbai`, `Nashik`, `Nagpur`) or leave empty for `All Maharashtra`.

**Example cURL Request:**
```bash
curl -X GET "http://127.0.0.1:8000/api/v1/courses/4124/health-report?district=Pune" \
     -H "Accept: application/json"
```

**Example JSON Response Structure:**
```json
{
  "course_id": 4124,
  "title": "Junior Software Developer",
  "provider_name": "NATIONAL ASSOCIATION OF SOFTWARE AND SERVICE COMPANIES",
  "course_type": "Online",
  "duration_minutes": 60,
  "nsqf_level": null,
  "enrollment_count": 2613,
  "overall_health_score": 87.0,
  "health_grade": "Grade A · Highly Aligned",
  "health_status_label": "Optimal Market Alignment",
  "industry_demand_score": 98.0,
  "curriculum_modernity_score": 68.7,
  "obsolescence_risk_score": 15.2,
  "placement_potential_score": 91.3,
  "skill_velocity": "High Demand Velocity (+28% YoY)",
  "total_state_openings": 435,
  "avg_salary_inr": 1610000.0,
  "entry_salary_inr": 400000.0,
  "senior_salary_inr": 3000000.0,
  "selected_district": "Pune",
  "district_scope_label": "Pune District",
  "salary_bands": [
    { "label": "₹11.5L - ₹12.5L", "min_salary": 150000, "max_salary": 250000, "count": 42 },
    { "label": "₹12.5L - ₹14.0L", "min_salary": 250000, "max_salary": 400000, "count": 118 }
  ],
  "top_employers": [
    { "name": "Tata Consultancy Services", "active_openings": 38, "location": "Pune", "average_salary": 1610000.0 }
  ],
  "skills_analysis": [
    { "skill_name": "Programming", "status": "taught", "importance_weight": 1.0, "demand_growth_pct": 16.5, "category": "Core Curriculum" },
    { "skill_name": "Cloud Infrastructure & AWS/Azure", "status": "emerging_gap", "importance_weight": 1.2, "demand_growth_pct": 34.0, "category": "Industry Standard" }
  ],
  "recommendations": [
    {
      "id": "rec-1",
      "category": "add_module",
      "title": "Introduce Applied Cloud Infrastructure & AWS/Azure Practical Lab",
      "description": "Employers in Pune District report a high demand for Cloud Infrastructure. Adding a 20-hour hands-on capstone project will bridge the primary qualification gap.",
      "priority": "High",
      "expected_impact": "Estimated +22% uplift in graduate starting salaries"
    }
  ],
  "district_demand": [
    { "district": "Pune", "openings_count": 165, "demand_intensity": "Selected District Focus", "avg_salary": 1803200.0 }
  ],
  "ai_executive_summary": "For Pune district, the course 'Junior Software Developer' exhibits a localized Health Score of 87.0/100 (Grade A · Highly Aligned)...",
  "evidence_basis": "Live Adzuna Pune District vacancies & Skill India Digital curriculum mapping",
  "generated_at": "01 Sep 2026, 06:48 PM UTC"
}
```

---

## 3. Mathematical Scoring Methodology & Formulas

The intelligence engine evaluates course health along multiple dimensions to produce explainable scores (0–100):

### 1. Industry Demand Score ($S_{\text{demand}}$)
Measures the volume and intensity of active job postings matching the course's occupational domain:
$$S_{\text{demand}} = \min\left(98.0, \max\left(25.0, 35.0 + \frac{V_{\text{openings}}}{K} \times 8.0\right)\right)$$
*where $V_{\text{openings}}$ is active vacancies, and $K = 10$ for district scope or $30$ for statewide scope.*

### 2. Curriculum Modernity Score ($S_{\text{modernity}}$)
Evaluates whether the curriculum is mapped to national standards, qualification packs, and contemporary tooling:
$$S_{\text{modernity}} = \min\left(96.0, \max\left(40.0, W_{\text{nsqf}} + W_{\text{qp}} + W_{\text{cert}} + \left(\frac{\text{Rating}}{5.0} \times 20.0\right)\right)\right)$$
* $W_{\text{nsqf}} = 50.0$ if NSQF level exists, else $35.0$
* $W_{\text{qp}} = 15.0$ if mapped to National QP/NOS codes, else $5.0$
* $W_{\text{cert}} = 10.0$ if Govt Certificate is enabled

### 3. Obsolescence Risk Score ($S_{\text{obsolescence}}$)
Quantifies the risk that the course curriculum has become outdated relative to current market demand and technology shifts (lower is better):
$$S_{\text{obsolescence}} = \max\left(5.0, \min\left(85.0, 100.0 - (0.55 \times S_{\text{demand}} + 0.45 \times S_{\text{modernity}})\right)\right)$$

### 4. Placement Potential Score ($S_{\text{placement}}$)
Estimates candidate employment absorption rate into active industrial vacancies:
$$S_{\text{placement}} = \min\left(98.0, \max\left(30.0, 0.6 \times S_{\text{demand}} + 0.4 \times S_{\text{modernity}} + C_{\text{bonus}}\right)\right)$$
*where $C_{\text{bonus}} = 5.0$ if certified.*

### 5. Composite Overall Health Index ($H_{\text{composite}}$)
A weighted composite health score summarizing course alignment:
$$H_{\text{composite}} = 0.35 \times S_{\text{demand}} + 0.25 \times S_{\text{modernity}} + 0.25 \times S_{\text{placement}} + 0.15 \times (100.0 - S_{\text{obsolescence}})$$

### Grading Matrix:
| Score Band | Grade | Health Status | Policy Action |
|---|---|---|---|
| **$\ge 85.0$** | **Grade A** | Optimal Market Alignment | Scale capacity; maintain contemporary labs |
| **$70.0 - 84.9$** | **Grade B** | Strong Alignment | Incorporate minor emerging skill modules |
| **$55.0 - 69.9$** | **Grade C** | Moderate Alignment | Curriculum refresh advised; add hands-on projects |
| **$< 55.0$** | **Grade D** | High Obsolescence Risk | Critical overhaul or phase-out required |

---

## 4. Grounded Data Sources

1. **Live Adzuna Labor Market Feed**:
   * Scrapes and indexes real-time vacancies across all 36 Maharashtra districts.
   * Extracts hiring companies, compensation minimum/maximum, and regional density.
2. **Skill India Digital (SID) Catalog**:
   * Ingests 4,000+ courses with provider information, NSQF levels, duration, and target occupations.
3. **National Occupational Standards (NOS & QP)**:
   * Maps Qualification Pack codes and NOS competencies to verify industry standardization.
4. **Sector Benchmark Competency Trees**:
   * Pre-mapped modern technical skills per sector (IT-ITeS, Automotive, Electronics, Healthcare, Green Jobs) with YoY demand velocity tracking.

---

## 5. Report Insights Breakdown

1. **Market Demand & Salary Distribution**:
   * Real-time compensation brackets (Entry, Mid, Senior, Lead).
   * Top 5 hiring employers with active vacancies and average packages.
2. **Skill Competency & Gap Matrix**:
   * **Taught Skills**: Covered in the existing syllabus.
   * **Missing Emerging Gaps**: Skills demanded by 40%+ of employers with fast YoY growth (e.g., `+34% YoY`).
   * **Legacy / Declining Skills**: Deprecated tools with negative market demand.
3. **Curriculum Upgrade Action Plan**:
   * Concrete modular additions (e.g. 20-hour practical capstone).
   * Software & laboratory modernization advice.
   * Localized district seat capacity adjustments.
4. **District-Wise Demand Allocation**:
   * Interactive breakdown across all 36 districts of Maharashtra.
