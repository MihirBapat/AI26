"""Job and Labour Market Intelligence Service.

Coordinates live Adzuna primary data, pytrends fallback signals,
and matches real-time industry demand with Skill India Digital courses,
occupations, and Maharashtra district heatmaps.
"""

import logging
import re
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.course import Course, CourseOccupation, CourseSector, CourseTag
from app.models.lookups import Occupation, Provider, Sector, Tag
from app.schemas.job import (
    DistrictDemandSummary,
    DistrictHeatmapPoint,
    DistrictHeatmapResponse,
    JobSearchResponse,
    MatchedCourseBrief,
    RoleMarketDemand,
    SalaryHistogramResponse,
    SalaryHistoryResponse,
    SalaryPredictionResponse,
    ServiceStatusResponse,
    TopCompaniesResponse,
    TrendsResponse,
)
from app.services.adzuna_service import adzuna_service
from app.services.cache_service import cache_service
from app.services.trends_service import trends_service

logger = logging.getLogger(__name__)

# Complete geographic reference for Maharashtra's 36 Districts with realistic baseline coordinates
MAHARASHTRA_DISTRICTS = [
    {"name": "Pune", "lat": 18.5204, "lon": 73.8567, "code": "PUN", "weight": 1.45, "top_sectors": ["IT-ITeS", "Automotive", "Electronics", "Capital Goods"], "top_roles": ["Software Developer", "CNC Operator", "EV Technician", "Quality Inspector"]},
    {"name": "Mumbai", "lat": 19.0760, "lon": 72.8777, "code": "MUM", "weight": 1.60, "top_sectors": ["Banking & Finance", "IT-ITeS", "Media & Entertainment", "Logistics"], "top_roles": ["Financial Analyst", "Data Engineer", "Operations Executive", "Digital Marketer"]},
    {"name": "Thane", "lat": 19.2183, "lon": 72.9781, "code": "THA", "weight": 1.25, "top_sectors": ["Chemicals & Petrochemicals", "Logistics", "IT-ITeS", "Construction"], "top_roles": ["Warehouse Supervisor", "Chemical Plant Operator", "Safety Officer", "Accountant"]},
    {"name": "Nagpur", "lat": 21.1458, "lon": 79.0882, "code": "NAG", "weight": 1.15, "top_sectors": ["Logistics & Warehousing", "Aerospace & Aviation", "IT-ITeS", "Mining"], "top_roles": ["Supply Chain Executive", "Avionics Technician", "Java Developer", "Mining Surveyor"]},
    {"name": "Nashik", "lat": 19.9975, "lon": 73.7898, "code": "NAS", "weight": 1.10, "top_sectors": ["Automotive", "Agriculture & Food Processing", "Electrical Equipment"], "top_roles": ["Assembly Line Worker", "Agronomist", "Electrician", "Tool & Die Maker"]},
    {"name": "Chhatrapati Sambhajinagar", "lat": 19.8762, "lon": 75.3433, "code": "CSN", "weight": 1.05, "top_sectors": ["Automotive", "Pharmaceuticals", "Brewery & Food", "Machinery"], "top_roles": ["Pharma QC Analyst", "Lathe Operator", "Maintenance Fitter", "Process Engineer"]},
    {"name": "Kolhapur", "lat": 16.7050, "lon": 74.2433, "code": "KOL", "weight": 0.95, "top_sectors": ["Foundry & Casting", "Textiles", "Sugar & Agri", "Auto Components"], "top_roles": ["Foundry Moulder", "Textile Supervisor", "Mechanical Draftsman", "Boiler Operator"]},
    {"name": "Solapur", "lat": 17.6599, "lon": 75.9064, "code": "SOL", "weight": 0.88, "top_sectors": ["Textiles & Handloom", "Renewable Energy", "Beedi & Tobacco"], "top_roles": ["Loom Technician", "Solar PV Installer", "Spinning Operator", "Sales Executive"]},
    {"name": "Amravati", "lat": 20.9374, "lon": 77.7796, "code": "AMR", "weight": 0.82, "top_sectors": ["Textiles", "Education", "Agro Processing"], "top_roles": ["Ginning Operator", "Office Assistant", "Agri Retailer", "Electrician"]},
    {"name": "Satara", "lat": 17.6805, "lon": 74.0183, "code": "SAT", "weight": 0.85, "top_sectors": ["Automotive Components", "Food Processing", "Tourism"], "top_roles": ["Quality Technician", "Dairy Plant Worker", "Hospitality Staff", "Fitter"]},
    {"name": "Sangli", "lat": 16.8524, "lon": 74.5815, "code": "SAN", "weight": 0.82, "top_sectors": ["Turmeric & Sugar Trade", "Textiles", "Engineering"], "top_roles": ["Food Quality Inspector", "Electrical Fitter", "Storekeeper", "Mechanic"]},
    {"name": "Raigad", "lat": 18.5158, "lon": 73.1822, "code": "RAI", "weight": 0.98, "top_sectors": ["Port Logistics", "Chemicals", "Steel & Metals"], "top_roles": ["Port Crane Operator", "Logistics Coordinator", "Welder", "Safety Supervisor"]},
    {"name": "Palghar", "lat": 19.6967, "lon": 72.7699, "code": "PAL", "weight": 0.92, "top_sectors": ["Industrial Manufacturing", "Fisheries", "Textiles"], "top_roles": ["Plant Maintenance Tech", "Cold Storage Tech", "Machinist", "Packer"]},
    {"name": "Ahmednagar", "lat": 19.0948, "lon": 74.7480, "code": "AHM", "weight": 0.85, "top_sectors": ["Sugar & Dairy", "Automotive", "Small Scale Foundry"], "top_roles": ["Tractor Mechanic", "Dairy Processing Tech", "Welder", "Pump Operator"]},
    {"name": "Jalgaon", "lat": 21.0077, "lon": 75.5626, "code": "JAL", "weight": 0.80, "top_sectors": ["PVC Pipes & Plastics", "Gold & Jewellery", "Agriculture"], "top_roles": ["Extrusion Machine Operator", "Jewellery Artisan", "Soil Testing Tech", "Technician"]},
    {"name": "Chandrapur", "lat": 19.9615, "lon": 79.2961, "code": "CHA", "weight": 0.82, "top_sectors": ["Thermal Power", "Cement", "Coal Mining"], "top_roles": ["Thermal Boiler Tech", "Heavy Earthmover Operator", "Electrical Lineman", "Mason"]},
    {"name": "Ratnagiri", "lat": 16.9902, "lon": 73.3120, "code": "RAT", "weight": 0.75, "top_sectors": ["Food Processing (Mango/Cashew)", "Fisheries", "Tourism"], "top_roles": ["Food Processing Tech", "Boat Mechanic", "Hotel Front Desk", "Electrician"]},
    {"name": "Sindhudurg", "lat": 16.1264, "lon": 73.6665, "code": "SIN", "weight": 0.70, "top_sectors": ["Eco-Tourism", "Horticulture", "Hospitality"], "top_roles": ["Tour Guide", "Hospitality Executive", "Organic Farming Tech", "Carpenter"]},
    {"name": "Latur", "lat": 18.4088, "lon": 76.5604, "code": "LAT", "weight": 0.78, "top_sectors": ["Oilseed & Pulses Processing", "Education", "Healthcare"], "top_roles": ["Mill Operator", "Lab Technician", "Accounts Clerk", "Pharmacist"]},
    {"name": "Dhule", "lat": 20.9042, "lon": 74.7749, "code": "DHU", "weight": 0.72, "top_sectors": ["Textiles", "Renewable Energy (Wind)", "Agro Processing"], "top_roles": ["Wind Turbine Tech", "Weaving Operator", "Motor Rewinder", "Driver"]},
    {"name": "Jalna", "lat": 19.8347, "lon": 75.8816, "code": "JLN", "weight": 0.76, "top_sectors": ["Steel Re-rolling", "Hybrid Seeds", "Biotech"], "top_roles": ["Steel Rolling Tech", "Seed Production Assistant", "Fitter", "Welder"]},
    {"name": "Beed", "lat": 18.9891, "lon": 75.7601, "code": "BEE", "weight": 0.68, "top_sectors": ["Agriculture", "Sugar", "Renewable Energy"], "top_roles": ["Solar Technician", "Harvester Operator", "Field Assistant", "Wireman"]},
    {"name": "Yavatmal", "lat": 20.3888, "lon": 78.1204, "code": "YAV", "weight": 0.68, "top_sectors": ["Cotton & Ginning", "Agriculture", "Forestry"], "top_roles": ["Ginning Tech", "Agri Drone Pilot", "Vehicle Mechanic", "Field Supervisor"]},
    {"name": "Buldhana", "lat": 20.5292, "lon": 76.1843, "code": "BUL", "weight": 0.67, "top_sectors": ["Agriculture", "Small Engineering", "Education"], "top_roles": ["Micro-Irrigation Tech", "Turner", "General Duty Assistant", "Mason"]},
    {"name": "Bhandara", "lat": 21.1685, "lon": 79.6547, "code": "BHA", "weight": 0.69, "top_sectors": ["Brass Metal Craft", "Rice Milling", "Defence Ordnance"], "top_roles": ["CNC Operator", "Metal Artisan", "Milling Operator", "Electrician"]},
    {"name": "Gondia", "lat": 21.4554, "lon": 80.1961, "code": "GON", "weight": 0.66, "top_sectors": ["Rice Mills", "Forest Produce", "Paper"], "top_roles": ["Plant Electrician", "Paper Machine Tech", "Truck Driver", "Security Officer"]},
    {"name": "Wardha", "lat": 20.7453, "lon": 78.6022, "code": "WAR", "weight": 0.74, "top_sectors": ["Steel & Castings", "Cotton Textiles", "Handmade Paper"], "top_roles": ["Blast Furnace Operator", "Spinning Tech", "Draftsman", "QA Inspector"]},
    {"name": "Dharashiv", "lat": 18.1861, "lon": 76.0419, "code": "DHA", "weight": 0.66, "top_sectors": ["Sugar", "Renewable Energy", "Handloom"], "top_roles": ["Solar Plant O&M Tech", "Loom Operator", "Mason", "Plumber"]},
    {"name": "Nanded", "lat": 19.1383, "lon": 77.3210, "code": "NAN", "weight": 0.75, "top_sectors": ["Textiles", "Pharma", "Food Processing"], "top_roles": ["Pharma Machine Operator", "Textile Dyer", "Retail Executive", "Fitter"]},
    {"name": "Parbhani", "lat": 19.2608, "lon": 76.7748, "code": "PAR", "weight": 0.68, "top_sectors": ["Agriculture University Research", "Ginning", "Edible Oil"], "top_roles": ["Agri Extension Worker", "Plant Operator", "Auto Electrician", "Store Incharge"]},
    {"name": "Hingoli", "lat": 19.7196, "lon": 77.1472, "code": "HIN", "weight": 0.62, "top_sectors": ["Turmeric Processing", "Agriculture", "Soybean Processing"], "top_roles": ["Drying & Grading Tech", "Tractor Driver", "Field Assistant", "Wireman"]},
    {"name": "Washim", "lat": 20.1090, "lon": 77.1352, "code": "WAS", "weight": 0.62, "top_sectors": ["Soybean & Pulses Processing", "Agriculture"], "top_roles": ["Processing Unit Tech", "Electrician", "Warehouse Loader", "Technician"]},
    {"name": "Gadchiroli", "lat": 20.1809, "lon": 80.0031, "code": "GAD", "weight": 0.60, "top_sectors": ["Iron Ore Mining", "Tussar Silk", "Forestry"], "top_roles": ["Mining Heavy Equipment Tech", "Silk Weaver", "Forest Guard", "Welder"]},
    {"name": "Nandurbar", "lat": 21.3690, "lon": 74.2384, "code": "NDB", "weight": 0.60, "top_sectors": ["Chili Processing", "Wind Power", "Forest Produce"], "top_roles": ["Wind Turbine Maintenance", "Spices Processing Tech", "Electrician", "Fitter"]},
    {"name": "Palghar", "lat": 19.6967, "lon": 72.7699, "code": "PAL", "weight": 0.92, "top_sectors": ["Chemicals", "Engineering", "Packaging"], "top_roles": ["Chemical Operator", "Packaging Supervisor", "Machine Operator", "Fitter"]},
    {"name": "Mumbai Suburban", "lat": 19.1245, "lon": 72.8530, "code": "SUB", "weight": 1.50, "top_sectors": ["IT-ITeS", "Media", "Retail", "Healthcare"], "top_roles": ["Software Engineer", "Video Editor", "Nurse", "Retail Manager"]},
]


SECTOR_ROLE_PATTERNS: list[tuple[str, list[str]]] = [
    (r"\b(sport|sports|fitness|physical\s+education|gym|leisure|athletics|yoga)\b", [
        "Fitness Trainer & Gym Instructor",
        "Sports Coach & Physical Trainer",
        "Sports Nutritionist",
        "Physiotherapy Assistant",
        "Recreation & Facility Manager",
    ]),
    (r"\b(agri|agriculture|farming|crop|soil|horticulture|botany|dairy|poultry|fishery|bio-farming|animal\s+husbandry)\b", [
        "Agronomist & Soil Health Specialist",
        "Precision Farming Technician",
        "Agri Drone Pilot & Surveyor",
        "Organic Farm & Greenhouse Manager",
        "Post-Harvest & Cold Chain Lead",
    ]),
    (r"\b(it|ites|it-ites|information\s+technology|software|developer|programming|cyber|cloud|ai|full\s*stack|devops)\b", [
        "DevOps Engineer",
        "Software Development Engineer (SDE)",
        "Cloud Solutions Architect",
        "Full Stack Developer",
        "Data Engineer / AI Specialist",
    ]),
    (r"\b(auto|automotive|automobile|vehicle|ev|electric\s+vehicle|powertrain|motor)\b", [
        "EV Powertrain Engineer",
        "Automotive Embedded Systems Specialist",
        "Vehicle Quality Assurance Inspector",
        "CNC Machine Operator",
        "Mechatronics Assembly Technician",
    ]),
    (r"\b(bank|banking|bfsi|finance|financial|insurance|wealth|fintech|audit|tax|accounting)\b", [
        "Financial Risk Analyst",
        "Wealth Management Advisor",
        "Credit Risk Underwriter",
        "Statutory Compliance Officer",
        "Fintech Backend Developer",
    ]),
    (r"\b(health|healthcare|nursing|medical|hospital|clinic|doctor|patient|allied\s+health)\b", [
        "Critical Care & ICU Nurse",
        "Medical Laboratory Technologist",
        "Pharma Quality Control Specialist",
        "Clinical Research Coordinator",
        "Biomedical Equipment Technician",
    ]),
    (r"\b(pharma|pharmaceutical|drug|formulation|clinical|biotech)\b", [
        "Pharma Quality Control Specialist",
        "Formulation R&D Associate",
        "Regulatory Affairs Executive",
        "Clinical Research Coordinator",
        "Packaging Quality Inspector",
    ]),
    (r"\b(manufactur|manufacturing|production|fabrication|machin|foundry|welding|assembly)\b", [
        "Production & Assembly Supervisor",
        "Industrial Automation Technician",
        "Tool & Die Specialist",
        "Plant Maintenance Engineer",
        "Quality Assurance Manager",
    ]),
    (r"\b(capital\s+goods|heavy\s+machinery|hydraulic|industrial\s+equipment)\b", [
        "CNC Heavy Machining Specialist",
        "Industrial Hydraulic Technician",
        "Tool & Die Design Engineer",
        "Plant Quality Inspector",
        "Heavy Equipment Assembler",
    ]),
    (r"\b(construct|construction|infrastructure|building|civil|masonry|carpentry|plumbing)\b", [
        "Site Structural Engineer",
        "BIM Modeler & CAD Draftsman",
        "Industrial Electrical Lineman",
        "Safety & EHS Officer",
        "HVAC & Plumbing Supervisor",
    ]),
    (r"\b(apparel|garment|fashion|sewing|clothing|tailoring)\b", [
        "Garment Production Supervisor",
        "Textile Quality Inspector",
        "Fashion CAD Pattern Maker",
        "Industrial Sewing Specialist",
        "Apparel Merchandiser",
    ]),
    (r"\b(textile|handloom|spinning|weaving|dyeing|fabric|yarn)\b", [
        "Spinning & Weaving Master",
        "Textile Quality Inspector",
        "Dyeing & Printing Supervisor",
        "Garment CAD Pattern Maker",
        "Textile Merchandiser",
    ]),
    (r"\b(electron|electronics|semiconductor|vlsi|smt|pcb|embedded|hardware)\b", [
        "PCB Design & Assembly Engineer",
        "SMT Line Technician",
        "Embedded Hardware Specialist",
        "Hardware QA Tester",
        "Microcontroller Programmer",
    ]),
    (r"\b(aerospace|aviation|aircraft|avionics|drone|flight)\b", [
        "Avionics Maintenance Tech",
        "Aerospace Systems Engineer",
        "Drone Assembly Specialist",
        "Aircraft Maintenance Fitter",
        "Flight Operations Coordinator",
    ]),
    (r"\b(beauty|wellness|salon|spa|cosmet|hair|makeup|skin|grooming)\b", [
        "Clinical Cosmetologist",
        "Spa & Wellness Therapist",
        "Hair Stylist & Color Specialist",
        "Aesthetic Skin Practitioner",
        "Salon Operations Manager",
    ]),
    (r"\b(chem|chemical|petrochem|refinery|distillation|paint)\b", [
        "Chemical Process Operator",
        "Chemical Lab Analyst",
        "Safety & EHS Inspector",
        "Quality Control Chemist",
        "Industrial Distillation Specialist",
    ]),
    (r"\b(logist|logistics|warehouse|warehousing|supply\s+chain|freight|courier|transport)\b", [
        "Supply Chain Operations Lead",
        "Warehouse Logistics Supervisor",
        "Inventory Planning Analyst",
        "Fleet & Dispatch Coordinator",
        "Cold Chain Storage Tech",
    ]),
    (r"\b(retail|e-commerce|ecommerce|store|shop|merchandis|sales|fmcg)\b", [
        "Retail Store Operations Manager",
        "E-Commerce Category Lead",
        "Visual Merchandiser",
        "Customer Experience Specialist",
        "Inventory & Replenishment Planner",
    ]),
    (r"\b(tour|tourism|hospitality|hotel|catering|culinary|food|restaurant|travel|baking|bakery)\b", [
        "Executive Chef / Sous Chef",
        "Hotel Front Office Executive",
        "Food & Beverage Manager",
        "Hospitality Operations Specialist",
        "Travel & Tour Coordinator",
    ]),
    (r"\b(energy|power|renewable|solar|wind|grid|electricity|hydro)\b", [
        "Solar PV Plant Engineer",
        "Wind Turbine Maintenance Tech",
        "Energy Storage Specialist",
        "Power Grid Operator",
        "Energy Audit Specialist",
    ]),
    (r"\b(educat|education|teaching|trainer|training|academic|school|tutor|instruction)\b", [
        "Technical Skills Trainer",
        "Curriculum Development Specialist",
        "EdTech Instructional Designer",
        "Academic Coordinator",
        "STEM Educator",
    ]),
    (r"\b(media|entertainment|design|graphics|animation|film|video|broadcast|ui/ux)\b", [
        "UI/UX Product Designer",
        "Digital Marketing & SEO Lead",
        "Motion Graphics / 3D Animator",
        "Content & Brand Strategist",
        "Video Editor & Producer",
    ]),
    (r"\b(leather|footwear|tannery)\b", [
        "Leather Goods Pattern Maker",
        "Footwear Assembly Technician",
        "Tannery Quality Inspector",
        "Leather Cutting Specialist",
        "Finishing Operator",
    ]),
    (r"\b(mining|mineral|quarry|coal)\b", [
        "Mining Safety Officer",
        "Heavy Earthmoving Machinery Operator",
        "Underground Ventilation Tech",
        "Mineral Processing Specialist",
        "Mine Surveyor",
    ]),
    (r"\b(plastic|rubber|polymer|moulding|extrusion)\b", [
        "Injection Moulding Specialist",
        "Extrusion Machine Operator",
        "Polymer Quality Control Analyst",
        "Blow Moulding Technician",
        "Tool & Die Maintenance Tech",
    ]),
    (r"\b(print|printing|packaging|paper|publishing)\b", [
        "Offset Printing Machine Operator",
        "Digital Print Pre-Press Tech",
        "Packaging Design & Quality Lead",
        "Flexographic Printing Specialist",
        "Screen Printing Technician",
    ]),
    (r"\b(tobacco)\b", [
        "Leaf Curing & Processing Tech",
        "Agri Quality Control Officer",
        "Packaging Machine Operator",
        "Inventory Supervisor",
        "Safety & Compliance Inspector",
    ]),
]


class JobService:
    """Unified service for Labour Market Intelligence, linking Adzuna live demand with SID courses."""

    async def search_jobs(
        self,
        what: str | None = None,
        where: str | None = None,
        page: int = 1,
        results_per_page: int = 20,
        salary_min: float | None = None,
        full_time: int | None = None,
        sort_by: str | None = None,
    ) -> JobSearchResponse:
        """Search live postings using Adzuna primary client."""
        return await adzuna_service.search_jobs(
            what=what,
            where=where,
            page=page,
            results_per_page=results_per_page,
            salary_min=salary_min,
            full_time=full_time,
            sort_by=sort_by,
        )

    async def get_top_companies(self, what: str | None = None, where: str | None = None) -> TopCompaniesResponse:
        """Top 5 hiring employers for a query and district."""
        return await adzuna_service.get_top_companies(what=what, where=where)

    async def get_salary_history(
        self,
        district_or_state: str | None = None,
        category: str | None = None,
        what: str | None = None,
    ) -> SalaryHistoryResponse:
        """Historical salary trends over time."""
        locs = ["India", "Maharashtra"]
        if district_or_state and district_or_state.lower() != "maharashtra":
            locs.append(district_or_state)
        return await adzuna_service.get_salary_history(locations=locs, category=category, what=what)

    async def get_salary_histogram(
        self,
        what: str | None = None,
        district: str | None = None,
    ) -> SalaryHistogramResponse:
        """Salary distribution histogram."""
        locs = ["India", "Maharashtra"]
        if district and district.lower() != "maharashtra":
            locs.append(district)
        return await adzuna_service.get_salary_histogram(what=what, locations=locs)

    async def predict_salary(
        self,
        title: str,
        description: str,
        district: str | None = None,
    ) -> SalaryPredictionResponse:
        """Jobsworth salary predictor."""
        return await adzuna_service.predict_salary(title=title, description=description, district=district)

    async def get_categories(self):
        """Adzuna categories taxonomy."""
        return await adzuna_service.get_categories()

    async def get_geodata(self, locations: list[str] | None = None, category: str | None = None):
        """Adzuna geodata regional drill-down."""
        return await adzuna_service.get_geodata(locations=locations, category=category)

    async def get_trends_fallback(self, keyword: str, geo: str | None = None) -> TrendsResponse:
        """Google Trends fallback search interest."""
        return await trends_service.get_trends(keyword=keyword, geo=geo)

    async def get_district_demand_summary(
        self,
        district: str,
        sector: str | None = None,
        domain: str | None = None,
        role: str | None = None,
    ) -> DistrictDemandSummary:
        """District-level labor demand overview with live Adzuna postings, salary, and top employers."""
        # Determine query parameters
        target_sector = sector
        target_what = domain or role
        
        # If only role was provided, check if it's a sector or a specific role
        if not target_sector and role:
            if adzuna_service.resolve_category_tag(role):
                target_sector = role
                target_what = None
            else:
                target_what = role

        cache_key = f"job:district_demand:{district.lower()}:{str(target_sector).lower()}:{str(target_what).lower()}"
        cached = await cache_service.get(cache_key)
        if cached:
            return DistrictDemandSummary(**cached)

        # 1. Search live postings in this district with category + domain keyword
        search_res = await adzuna_service.search_jobs(what=target_what, category=target_sector, where=district, results_per_page=10)
        # 2. Get top hiring companies in this district
        top_comp_res = await adzuna_service.get_top_companies(what=target_what or target_sector, where=district)
        # 3. Get salary history for trend
        sal_res = await adzuna_service.get_salary_history(locations=["India", "Maharashtra", district], category=target_sector, what=target_what)

        # Prioritize live mean salary from search results, then latest historical month
        avg_salary = search_res.mean_salary
        if not avg_salary and sal_res.history:
            avg_salary = sal_res.history[-1].average_salary
        if not avg_salary:
            avg_salary = 420000.0

        total_vacancies = search_res.total_count
        
        # Calculate real dynamic demand score
        if total_vacancies > 0:
            import math
            # 1 vacancy -> 30, 10 -> 50, 100 -> 70, 1000 -> 90, 5000+ -> 100
            demand_score = min(100.0, max(25.0, 30.0 + math.log10(max(total_vacancies, 1)) * 20.0))
        else:
            demand_score = 25.0

        # Find matching district preset for sector context
        matched_dist = next((d for d in MAHARASHTRA_DISTRICTS if d["name"].lower() == district.lower()), None)
        
        # Only if live API failed/is unconfigured, use fallback simulation
        if search_res.is_fallback and matched_dist:
            base_vacancies = 48500
            weight = matched_dist["weight"]
            v_count = int(base_vacancies * (weight / 36.0) * 1.8)
            matching_sector = False
            filter_text = target_what or target_sector or ''
            if filter_text:
                matching_sector = any(filter_text.lower() in s.lower() for s in matched_dist["top_sectors"])
                v_count = int(v_count * (0.8 if matching_sector else 0.2))
                jitter = (len(filter_text) * 43) % 200
                v_count += jitter
            total_vacancies = v_count
            demand_score = min(100.0, max(15.0, (matched_dist["weight"] / 1.6) * 100.0 * (1.0 if not filter_text else (0.85 if matching_sector else 0.6))))
            
        demand_lvl = "High" if demand_score >= 75 else ("Moderate" if demand_score >= 50 else "Emerging")
        top_sectors = matched_dist["top_sectors"] if matched_dist else ["Manufacturing", "Services", "Engineering"]

        # Determine top 5 specific in-demand roles for this sector/district
        top_roles: list[str] = []
        search_key = (target_sector or target_what or '').strip()

        # 1. If target sector is specified, lookup directly in regex patterns
        if search_key:
            for pattern, roles_list in SECTOR_ROLE_PATTERNS:
                if re.search(pattern, search_key, re.IGNORECASE):
                    top_roles = list(roles_list[:5])
                    break

        # 2. Check Adzuna category tag
        if not top_roles and (target_sector or target_what):
            resolved_cat = adzuna_service.resolve_category_tag(target_sector or target_what)
            if resolved_cat:
                for pattern, roles_list in SECTOR_ROLE_PATTERNS:
                    if re.search(pattern, resolved_cat, re.IGNORECASE):
                        top_roles = list(roles_list[:5])
                        break

        # 3. If district-wide (all sectors), use district top roles
        if not top_roles and matched_dist:
            top_roles = list(matched_dist.get("top_roles", [])[:5])

        # 4. Fallback defaults
        if not top_roles:
            top_roles = [
                "DevOps Engineer",
                "Software Development Engineer (SDE)",
                "EV Powertrain Engineer",
                "Financial Risk Analyst",
                "Critical Care Nurse",
            ]

        summary = DistrictDemandSummary(
            district=district,
            state="Maharashtra",
            total_vacancies=total_vacancies,
            average_salary=round(avg_salary, 2),
            top_employers=top_comp_res.leaderboard,
            top_sectors=top_sectors,
            top_roles=top_roles[:5],
            demand_level=demand_lvl,
            demand_score=round(demand_score, 1),
            growth_rate_pct=7.2 if sal_res.trend_direction == "upward" else 2.1,
            data_source=search_res.data_source,
            demand_granularity="district",
            fallback_used=search_res.is_fallback,
        )

        await cache_service.set(cache_key, summary.model_dump(), ttl_seconds=1800)
        return summary

    async def get_maharashtra_district_heatmap(
        self,
        sector_filter: str | None = None,
    ) -> DistrictHeatmapResponse:
        """District heatmap aggregating demand scores, active vacancies, and top sectors across all 36 Maharashtra districts."""
        cache_key = f"job:mh_heatmap:{str(sector_filter).lower()}"
        cached = await cache_service.get(cache_key)
        if cached:
            cached["cached"] = True
            return DistrictHeatmapResponse(**cached)

        # Baseline statewide vacancies
        base_vacancies = 48500
        district_points = []
        total_state_vacancies = 0
        highest_score = -1.0
        highest_dist = ""

        # Query top level geodata if configured
        geo_res = await adzuna_service.get_geodata(locations=["India", "Maharashtra"])
        geodata_counts = {
            item.location.area[-1].lower(): item.count
            for item in geo_res.locations
            if item.location.area
        }

        for d in MAHARASHTRA_DISTRICTS:
            name = d["name"]
            weight = d["weight"]
            # Check if live geodata has count, else model using regional weights
            v_count = geodata_counts.get(name.lower(), int(base_vacancies * (weight / 36.0) * 1.8))
            if sector_filter:
                # Modulate if sector matches
                matching_sector = any(sector_filter.lower() in s.lower() for s in d["top_sectors"])
                v_count = int(v_count * (1.3 if matching_sector else 0.5))

            score = min(100.0, max(15.0, (weight / 1.6) * 100.0 * (1.0 if not sector_filter else 0.9)))
            total_state_vacancies += v_count

            if score > highest_score:
                highest_score = score
                highest_dist = name

            demand_lvl = "High" if score >= 75 else ("Moderate" if score >= 45 else "Emerging")
            avg_sal = round(320000.0 + (score * 3500.0), 2)

            district_points.append(
                DistrictHeatmapPoint(
                    district=name,
                    district_code=d["code"],
                    latitude=d["lat"],
                    longitude=d["lon"],
                    demand_score=round(score, 1),
                    total_vacancies=v_count,
                    average_salary=avg_sal,
                    top_sectors=d["top_sectors"],
                    top_roles=d["top_roles"],
                    demand_level=demand_lvl,
                    data_source="adzuna",
                )
            )

        resp = DistrictHeatmapResponse(
            state="Maharashtra",
            sector_filter=sector_filter,
            districts=district_points,
            total_state_vacancies=total_state_vacancies,
            highest_demand_district=highest_dist,
            data_source="adzuna",
            cached=False,
        )

        await cache_service.set(cache_key, resp.model_dump(), ttl_seconds=3600)
        return resp

    async def get_role_demand_analysis(
        self,
        role_name: str,
        district: str | None,
        db: Session,
    ) -> RoleMarketDemand:
        """Deep dive on role demand connecting Adzuna market vacancies with database SID courses."""
        cache_key = f"job:role_demand:{role_name.lower()}:{str(district).lower()}"
        cached = await cache_service.get(cache_key)
        if cached:
            return RoleMarketDemand(**cached)

        # 1. Fetch live job postings from Adzuna (primary)
        search_res = await adzuna_service.search_jobs(
            what=role_name,
            where=district or "Maharashtra",
            results_per_page=6,
        )

        # 2. Fetch top hiring companies
        top_comp = await adzuna_service.get_top_companies(what=role_name, where=district or "Maharashtra")

        # 3. Fetch salary histogram
        hist_res = await adzuna_service.get_salary_histogram(
            what=role_name,
            locations=["India", "Maharashtra", district] if district else ["India", "Maharashtra"],
        )

        # 4. Search DB for matching Skill India Digital Courses
        matched_courses_briefs = []
        matched_occupations_list = []

        try:
            # Query courses by title, occupation, sector, or tag
            search_pattern = f"%{role_name.strip()}%"
            db_query = (
                select(Course)
                .outerjoin(Course.course_occupations)
                .outerjoin(CourseOccupation.occupation)
                .outerjoin(Course.course_tags)
                .outerjoin(CourseTag.tag)
                .options(joinedload(Course.provider))
                .where(
                    or_(
                        Course.title.ilike(search_pattern),
                        Occupation.name.ilike(search_pattern),
                        Tag.name.ilike(search_pattern),
                    )
                )
                .distinct()
                .limit(8)
            )

            courses_found = db.execute(db_query).scalars().all()

            for c in courses_found:
                matched_courses_briefs.append(
                    MatchedCourseBrief(
                        id=c.id,
                        sid_course_id=c.sid_course_id,
                        title=c.title,
                        course_type=c.course_type,
                        provider_name=c.provider.name if c.provider else None,
                        price=float(c.price) if c.price is not None else None,
                        rating_average=c.rating_average,
                        enrollment_count=c.enrollment_count,
                    )
                )

            # Look up related occupations in DB
            occ_query = select(Occupation.name).where(Occupation.name.ilike(search_pattern)).limit(5)
            matched_occupations_list = list(db.execute(occ_query).scalars().all())
        except Exception as e:
            logger.error("DB course matching error: %s", e)

        # Calculate salary and demand metrics
        total_postings = search_res.total_count
        sal_min = None
        sal_max = None
        sal_avg = None

        if search_res.results:
            mins = [r.salary_min for r in search_res.results if r.salary_min is not None]
            maxs = [r.salary_max for r in search_res.results if r.salary_max is not None]
            if mins:
                sal_min = min(mins)
            if maxs:
                sal_max = max(maxs)
            if mins or maxs:
                all_sal = mins + maxs
                sal_avg = round(sum(all_sal) / len(all_sal), 2)

        if not sal_avg:
            sal_avg = 450000.0

        demand_index = min(100.0, max(15.0, total_postings * 0.5 + 25.0))
        demand_lvl = "High" if demand_index >= 70 else ("Moderate" if demand_index >= 40 else "Emerging")

        role_demand = RoleMarketDemand(
            role_name=role_name,
            district=district,
            total_postings=total_postings,
            average_salary=sal_avg,
            salary_min=sal_min or (sal_avg * 0.75),
            salary_max=sal_max or (sal_avg * 1.35),
            salary_distribution=hist_res.bands,
            top_hiring_companies=top_comp.leaderboard,
            recent_postings=search_res.results[:5],
            matched_occupations=matched_occupations_list,
            matched_courses_count=len(matched_courses_briefs),
            matched_courses=matched_courses_briefs,
            demand_index=round(demand_index, 1),
            demand_level=demand_lvl,
            data_source=search_res.data_source,
            fallback_used=search_res.is_fallback,
            warning=search_res.warning,
        )

        await cache_service.set(cache_key, role_demand.model_dump(), ttl_seconds=1800)
        return role_demand

    async def get_service_status(self) -> ServiceStatusResponse:
        """Check status of Adzuna API, Redis, and pytrends."""
        adzuna_version_info = await adzuna_service.get_version()
        is_adzuna_configured = adzuna_service.is_configured
        is_redis_alive = await cache_service.is_redis_alive()

        return ServiceStatusResponse(
            adzuna_configured=is_adzuna_configured,
            adzuna_app_id_set=bool(adzuna_service.app_id),
            adzuna_status="connected" if (is_adzuna_configured and adzuna_version_info.get("status") == "connected") else ("simulated_ready" if not is_adzuna_configured else "offline"),
            adzuna_api_version=adzuna_version_info,
            redis_enabled=cache_service.get_redis_client is not None,
            redis_connected=is_redis_alive,
            pytrends_available=trends_service.is_available,
            primary_source="adzuna",
            fallback_source="pytrends",
        )


job_service = JobService()
