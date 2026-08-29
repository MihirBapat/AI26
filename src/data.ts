export const SECTORS = [
  "IT & Communication",
  "Manufacturing",
  "Finance & Insurance",
  "Healthcare",
  "Retail & Wholesale",
  "Transportation & Logistics",
  "Construction",
  "Education",
  "Hospitality & Tourism",
  "Agriculture & Allied Activities",
] as const;

export type Sector = (typeof SECTORS)[number];

export const MAHARASHTRA_DISTRICTS = [
  "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed",
  "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli",
  "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur",
  "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded",
  "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani",
  "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara",
  "Sindhudurg", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal",
] as const;

export type District = (typeof MAHARASHTRA_DISTRICTS)[number];

// Skills per sector with demand score (0–100) and trend
export const SECTOR_SKILLS: Record<Sector, { name: string; demand: number; trend: "rising" | "stable" | "declining" }[]> = {
  "IT & Communication": [
    { name: "Python", demand: 94, trend: "rising" },
    { name: "Generative AI / LLMs", demand: 91, trend: "rising" },
    { name: "Cloud Computing (AWS/Azure)", demand: 89, trend: "rising" },
    { name: "React / Next.js", demand: 86, trend: "rising" },
    { name: "Data Analytics", demand: 85, trend: "rising" },
    { name: "Cybersecurity", demand: 83, trend: "rising" },
    { name: "DevOps / CI-CD", demand: 80, trend: "rising" },
    { name: "Machine Learning", demand: 79, trend: "rising" },
    { name: "UI/UX Design", demand: 74, trend: "stable" },
    { name: "Node.js / Backend", demand: 72, trend: "stable" },
    { name: "Mobile Development", demand: 68, trend: "stable" },
    { name: "Core Java (Legacy)", demand: 42, trend: "declining" },
    { name: "Flash / ActionScript", demand: 5, trend: "declining" },
    { name: "Manual Testing (non-AI)", demand: 28, trend: "declining" },
  ],
  "Manufacturing": [
    { name: "CNC Operation", demand: 88, trend: "rising" },
    { name: "Industrial Automation / PLC", demand: 86, trend: "rising" },
    { name: "6-Sigma / Lean", demand: 80, trend: "rising" },
    { name: "AutoCAD / CAD-CAM", demand: 78, trend: "stable" },
    { name: "Quality Control", demand: 76, trend: "stable" },
    { name: "Industrial Safety (NEBOSH)", demand: 74, trend: "rising" },
    { name: "Welding & Fabrication", demand: 70, trend: "stable" },
    { name: "Robotics Integration", demand: 68, trend: "rising" },
    { name: "ERP Systems (SAP)", demand: 65, trend: "stable" },
    { name: "Basic Assembly Line", demand: 38, trend: "declining" },
    { name: "Manual Lathe Operation", demand: 30, trend: "declining" },
  ],
  "Finance & Insurance": [
    { name: "Financial Analysis", demand: 90, trend: "rising" },
    { name: "GST Compliance", demand: 88, trend: "stable" },
    { name: "Risk Management", demand: 85, trend: "rising" },
    { name: "Investment Planning / Wealth Mgmt", demand: 82, trend: "rising" },
    { name: "Data-Driven Banking", demand: 80, trend: "rising" },
    { name: "InsurTech Knowledge", demand: 75, trend: "rising" },
    { name: "Tally ERP", demand: 70, trend: "stable" },
    { name: "Tax Filing (ITR)", demand: 68, trend: "stable" },
    { name: "Insurance Sales", demand: 60, trend: "stable" },
    { name: "Manual Bookkeeping", demand: 25, trend: "declining" },
    { name: "Typewriting / Steno", demand: 10, trend: "declining" },
  ],
  "Healthcare": [
    { name: "Patient Care Management", demand: 92, trend: "rising" },
    { name: "Medical Coding (ICD-10)", demand: 88, trend: "rising" },
    { name: "Nursing & Allied Health", demand: 86, trend: "rising" },
    { name: "Hospital Information Systems", demand: 82, trend: "rising" },
    { name: "Telemedicine Skills", demand: 80, trend: "rising" },
    { name: "Phlebotomy / Lab Tech", demand: 76, trend: "stable" },
    { name: "Emergency & First Aid", demand: 73, trend: "stable" },
    { name: "Medical Transcription", demand: 55, trend: "declining" },
    { name: "Manual Record Keeping", demand: 20, trend: "declining" },
  ],
  "Retail & Wholesale": [
    { name: "Digital Marketing", demand: 86, trend: "rising" },
    { name: "E-commerce Management", demand: 84, trend: "rising" },
    { name: "Customer Experience Design", demand: 80, trend: "rising" },
    { name: "Supply Chain Analytics", demand: 78, trend: "rising" },
    { name: "Inventory Management (ERP)", demand: 74, trend: "stable" },
    { name: "Visual Merchandising", demand: 66, trend: "stable" },
    { name: "Point of Sale Systems", demand: 62, trend: "stable" },
    { name: "Traditional Door-to-Door Sales", demand: 22, trend: "declining" },
    { name: "Cash Register Operation", demand: 18, trend: "declining" },
  ],
  "Transportation & Logistics": [
    { name: "Logistics Management", demand: 88, trend: "rising" },
    { name: "Route Optimization / GIS", demand: 85, trend: "rising" },
    { name: "Fleet Management Software", demand: 82, trend: "rising" },
    { name: "Supply Chain Management", demand: 80, trend: "rising" },
    { name: "Warehouse Management Systems", demand: 76, trend: "stable" },
    { name: "Cargo Handling & Safety", demand: 70, trend: "stable" },
    { name: "Customs & EXIM", demand: 68, trend: "stable" },
    { name: "Manual Dispatch", demand: 28, trend: "declining" },
  ],
  "Construction": [
    { name: "BIM (Building Info Modelling)", demand: 90, trend: "rising" },
    { name: "Green Building / LEED", demand: 86, trend: "rising" },
    { name: "Project Management (PMP)", demand: 84, trend: "rising" },
    { name: "AutoCAD / Revit", demand: 80, trend: "stable" },
    { name: "Civil Engineering Design", demand: 76, trend: "stable" },
    { name: "Safety Compliance (OSHA)", demand: 74, trend: "rising" },
    { name: "Structural Analysis Software", demand: 70, trend: "stable" },
    { name: "Manual Blueprint Reading", demand: 35, trend: "declining" },
    { name: "Traditional Masonry", demand: 30, trend: "declining" },
  ],
  "Education": [
    { name: "Ed-Tech Platform Management", demand: 88, trend: "rising" },
    { name: "AI-assisted Teaching Tools", demand: 86, trend: "rising" },
    { name: "Curriculum Design (NEP 2020)", demand: 84, trend: "rising" },
    { name: "STEM/STEAM Teaching", demand: 82, trend: "rising" },
    { name: "Special Education", demand: 78, trend: "rising" },
    { name: "Assessment Design (Competency-based)", demand: 74, trend: "stable" },
    { name: "Blended Learning", demand: 72, trend: "stable" },
    { name: "Rote-based Teaching", demand: 20, trend: "declining" },
    { name: "Chalk-and-Talk Only", demand: 15, trend: "declining" },
  ],
  "Hospitality & Tourism": [
    { name: "Experience Design / Tourism Marketing", demand: 86, trend: "rising" },
    { name: "Hotel Revenue Management", demand: 82, trend: "rising" },
    { name: "Food Safety & Hygiene (FSSAI)", demand: 80, trend: "stable" },
    { name: "Event Management", demand: 76, trend: "rising" },
    { name: "Digital Booking Platforms", demand: 74, trend: "rising" },
    { name: "Language Skills (English + Regional)", demand: 72, trend: "stable" },
    { name: "Customer Relationship Management", demand: 68, trend: "stable" },
    { name: "Traditional Hospitality (Non-digital)", demand: 30, trend: "declining" },
  ],
  "Agriculture & Allied Activities": [
    { name: "Precision Farming / IoT", demand: 90, trend: "rising" },
    { name: "Agri-Tech & Drone Operation", demand: 88, trend: "rising" },
    { name: "Organic Certification (NPOP)", demand: 84, trend: "rising" },
    { name: "Food Processing & Value Addition", demand: 80, trend: "rising" },
    { name: "Cold Chain / Storage Management", demand: 78, trend: "rising" },
    { name: "Supply Chain (Farm-to-Market)", demand: 76, trend: "stable" },
    { name: "Soil Health Testing", demand: 72, trend: "stable" },
    { name: "Irrigation Management", demand: 68, trend: "stable" },
    { name: "Traditional Subsistence Farming", demand: 22, trend: "declining" },
  ],
};

// District demand scores for heat-map visualization
export const DISTRICT_DEMAND: Record<District, number> = {
  "Pune": 96, "Mumbai City": 98, "Mumbai Suburban": 95, "Thane": 90,
  "Nagpur": 85, "Nashik": 78, "Aurangabad": 75, "Palghar": 70,
  "Raigad": 65, "Kolhapur": 72, "Solapur": 60, "Amravati": 55,
  "Akola": 50, "Jalgaon": 52, "Ahmednagar": 58, "Satara": 62,
  "Sangli": 59, "Nanded": 48, "Latur": 45, "Chandrapur": 50,
  "Gondia": 42, "Bhandara": 40, "Wardha": 44, "Yavatmal": 41,
  "Buldhana": 43, "Washim": 38, "Hingoli": 36, "Parbhani": 42,
  "Jalna": 40, "Beed": 38, "Osmanabad": 37, "Nandurbar": 35,
  "Dhule": 48, "Gadchiroli": 30, "Sindhudurg": 46, "Ratnagiri": 50,
};

// Placement outcomes by sector (for institute dashboard)
export const PLACEMENT_OUTCOMES: Record<Sector, { placed: number; avgPackage: number; topRecruiters: string[] }> = {
  "IT & Communication": { placed: 87, avgPackage: 5.4, topRecruiters: ["TCS", "Infosys", "Wipro", "Persistent", "Zensar"] },
  "Manufacturing": { placed: 78, avgPackage: 3.8, topRecruiters: ["Bajaj Auto", "L&T", "Mahindra", "Forbes Marshall"] },
  "Finance & Insurance": { placed: 82, avgPackage: 4.2, topRecruiters: ["HDFC", "ICICI", "SBI", "Bajaj Finserv"] },
  "Healthcare": { placed: 90, avgPackage: 3.6, topRecruiters: ["Apollo", "Ruby Hall Clinic", "Sahyadri", "KEM Hospital"] },
  "Retail & Wholesale": { placed: 74, avgPackage: 3.0, topRecruiters: ["Reliance Retail", "D-Mart", "Big Bazaar", "Flipkart"] },
  "Transportation & Logistics": { placed: 76, avgPackage: 3.4, topRecruiters: ["Maersk", "DHL", "Mahindra Logistics", "Blue Dart"] },
  "Construction": { placed: 72, avgPackage: 4.0, topRecruiters: ["L&T Construction", "Godrej Properties", "Tata Projects"] },
  "Education": { placed: 80, avgPackage: 3.2, topRecruiters: ["BYJU's", "Vedantu", "Allen", "State Government Schools"] },
  "Hospitality & Tourism": { placed: 79, avgPackage: 2.8, topRecruiters: ["Taj Hotels", "Marriott", "OYO", "MTDC"] },
  "Agriculture & Allied Activities": { placed: 68, avgPackage: 2.6, topRecruiters: ["Mahagrapes", "Sahyadri Farms", "FPOs", "Agri Startups"] },
};

// Mock students
export interface Student {
  username: string;
  password: string;
  age: number;
  education: string;
  college: string;
  skills: string[];
  location: District;
  sector: Sector;
}

export const MOCK_STUDENTS: Student[] = [
  {
    username: "priya_nashik",
    password: "pass123",
    age: 21,
    education: "B.E. Computer Engineering",
    college: "SPPU, Pune",
    skills: ["Python", "React / Next.js", "UI/UX Design", "Manual Testing (non-AI)"],
    location: "Nashik",
    sector: "IT & Communication",
  },
];

// Mock institutes
export interface Institute {
  instituteName: string;
  instituteId: string;
  email: string;
  phone: string;
  address: string;
  courses: string[];
  website: string;
  password: string;
}

export interface InstituteWithVerification extends Institute {
  verified: boolean;
  certFileName: string;
  district: District;
  registeredOn: string;
}

export const MOCK_INSTITUTES: InstituteWithVerification[] = [
  {
    instituteName: "Maharashtra Institute of Technology & Training",
    instituteId: "MITT-2024-001",
    email: "info@mitt.edu.in",
    phone: "9876543210",
    address: "Andheri East, Mumbai Suburban",
    courses: ["Python Programming", "Core Java (Legacy)", "Manual Testing (non-IT)", "Flash / ActionScript", "Web Design Basics"],
    website: "www.mitt.edu.in",
    password: "inst123",
    verified: true,
    certFileName: "MITT_Registration_2024.pdf",
    district: "Mumbai Suburban",
    registeredOn: "2024-03-10",
  },
  {
    instituteName: "Pune Skill & Vocational Centre",
    instituteId: "PSVC-2024-002",
    email: "admin@psvc.edu.in",
    phone: "9823456781",
    address: "Kothrud, Pune",
    courses: ["AutoCAD / CAD-CAM", "CNC Operation", "Welding & Fabrication", "Industrial Safety (NEBOSH)"],
    website: "www.psvc.edu.in",
    password: "psvc123",
    verified: false,
    certFileName: "PSVC_Cert_2024.jpg",
    district: "Pune",
    registeredOn: "2024-07-22",
  },
  {
    instituteName: "Nagpur Allied Health Academy",
    instituteId: "NAHA-2024-003",
    email: "contact@naha.edu.in",
    phone: "9711234560",
    address: "Civil Lines, Nagpur",
    courses: ["Nursing Assistant", "Medical Coding (ICD-10)", "Phlebotomy / Lab Tech", "Hospital Information Systems"],
    website: "www.naha.edu.in",
    password: "naha123",
    verified: true,
    certFileName: "NAHA_VerificationDoc.pdf",
    district: "Nagpur",
    registeredOn: "2024-05-15",
  },
  {
    instituteName: "Nashik Agri-Tech Training Centre",
    instituteId: "NATC-2024-004",
    email: "info@natc.in",
    phone: "9654321870",
    address: "Satpur, Nashik",
    courses: ["Precision Farming / IoT", "Organic Certification (NPOP)", "Soil Health Testing", "Traditional Subsistence Farming"],
    website: "www.natc.in",
    password: "natc123",
    verified: false,
    certFileName: "NATC_RegistrationCert.pdf",
    district: "Nashik",
    registeredOn: "2024-09-01",
  },
];

export const EDUCATION_LEVELS = [
  "10th Pass", "12th Pass", "ITI / Diploma", "B.E. / B.Tech", "B.Sc / B.Com / B.A.",
  "MBA / PGDM", "M.Tech / M.E.", "M.Sc / M.Com / M.A.", "PhD", "Other",
];

// ── Employer & Vacancy types ──────────────────────────────────────────────────

export interface Employer {
  companyName: string;
  email: string;
  hrName: string;
  sector: Sector;
  locations: District[];
  phone: string;
  password: string;
  certFileName: string;
  verified: boolean;
  registeredOn: string;
}

export type EmploymentType = "Full-time" | "Part-time" | "Internship";

export interface Vacancy {
  id: string;
  employerEmail: string;
  companyName: string;
  sector: Sector;
  jobRole: string;
  vacancies: number;
  description: string;
  requiredSkills: string[];
  preferredSkills: string[];
  education: string;
  experience: string;
  salaryMin: number;
  salaryMax: number;
  location: District;
  employmentType: EmploymentType;
  deadline: string;
  postedDate: string;
  applicants: number;
  filled: number;
}

export const MOCK_EMPLOYERS: Employer[] = [
  {
    companyName: "Infosys BPO Ltd",
    email: "hr@infosysbpo.com",
    hrName: "Kavita Deshmukh",
    sector: "IT & Communication",
    locations: ["Pune", "Nagpur", "Mumbai City"],
    phone: "9823001234",
    password: "info123",
    certFileName: "Infosys_GST_Certificate.pdf",
    verified: true,
    registeredOn: "2024-01-15",
  },
  {
    companyName: "Bajaj Auto Ltd",
    email: "hr@bajaj.com",
    hrName: "Ramesh Kulkarni",
    sector: "Manufacturing",
    locations: ["Aurangabad", "Pune", "Nashik"],
    phone: "9700112233",
    password: "bajaj123",
    certFileName: "BajajAuto_Reg.pdf",
    verified: true,
    registeredOn: "2024-02-08",
  },
  {
    companyName: "Axis Bank",
    email: "hr@axisbank.com",
    hrName: "Sunita Patil",
    sector: "Finance & Insurance",
    locations: ["Mumbai City", "Pune", "Nashik", "Nagpur"],
    phone: "9922334455",
    password: "axis123",
    certFileName: "AxisBank_SEBI_Cert.pdf",
    verified: true,
    registeredOn: "2024-03-20",
  },
  {
    companyName: "Sahyadri Hospitals",
    email: "hr@sahyadri.com",
    hrName: "Dr. Anjali Marathe",
    sector: "Healthcare",
    locations: ["Pune", "Nashik", "Kolhapur"],
    phone: "9898765432",
    password: "sahy123",
    certFileName: "Sahyadri_MCI_Cert.pdf",
    verified: false,
    registeredOn: "2024-08-10",
  },
];

let _vacancyCounter = 100;
function vid() { return `VAC-${++_vacancyCounter}`; }

export const MOCK_VACANCIES: Vacancy[] = [
  {
    id: vid(), employerEmail: "hr@infosysbpo.com", companyName: "Infosys BPO Ltd", sector: "IT & Communication",
    jobRole: "Python Developer", vacancies: 15, applicants: 42, filled: 3,
    description: "Develop and maintain Python-based automation and analytics pipelines.",
    requiredSkills: ["Python", "Data Analytics", "DevOps / CI-CD"],
    preferredSkills: ["Cloud Computing (AWS/Azure)", "Machine Learning"],
    education: "B.E. / B.Tech", experience: "0–2 years", salaryMin: 4, salaryMax: 7,
    location: "Pune", employmentType: "Full-time", deadline: "2026-10-15", postedDate: "2026-08-01",
  },
  {
    id: vid(), employerEmail: "hr@infosysbpo.com", companyName: "Infosys BPO Ltd", sector: "IT & Communication",
    jobRole: "Data Analyst", vacancies: 8, applicants: 29, filled: 2,
    description: "Analyse large datasets and build dashboards for business intelligence.",
    requiredSkills: ["Data Analytics", "Python", "UI/UX Design"],
    preferredSkills: ["Generative AI / LLMs", "Cloud Computing (AWS/Azure)"],
    education: "B.Sc / B.Com / B.A.", experience: "0–1 years", salaryMin: 3.5, salaryMax: 5.5,
    location: "Nagpur", employmentType: "Full-time", deadline: "2026-09-30", postedDate: "2026-08-05",
  },
  {
    id: vid(), employerEmail: "hr@bajaj.com", companyName: "Bajaj Auto Ltd", sector: "Manufacturing",
    jobRole: "CNC Operator", vacancies: 25, applicants: 18, filled: 8,
    description: "Operate and maintain CNC machines for auto-component manufacturing.",
    requiredSkills: ["CNC Operation", "AutoCAD / CAD-CAM", "Quality Control"],
    preferredSkills: ["6-Sigma / Lean", "Industrial Automation / PLC"],
    education: "ITI / Diploma", experience: "1–3 years", salaryMin: 2.5, salaryMax: 4.2,
    location: "Aurangabad", employmentType: "Full-time", deadline: "2026-11-01", postedDate: "2026-08-10",
  },
  {
    id: vid(), employerEmail: "hr@bajaj.com", companyName: "Bajaj Auto Ltd", sector: "Manufacturing",
    jobRole: "Quality Inspector", vacancies: 10, applicants: 14, filled: 4,
    description: "Inspect manufactured parts for compliance with quality standards.",
    requiredSkills: ["Quality Control", "6-Sigma / Lean", "Industrial Safety (NEBOSH)"],
    preferredSkills: ["ERP Systems (SAP)", "AutoCAD / CAD-CAM"],
    education: "ITI / Diploma", experience: "1–2 years", salaryMin: 2.8, salaryMax: 3.8,
    location: "Pune", employmentType: "Full-time", deadline: "2026-10-01", postedDate: "2026-08-12",
  },
  {
    id: vid(), employerEmail: "hr@axisbank.com", companyName: "Axis Bank", sector: "Finance & Insurance",
    jobRole: "Financial Analyst", vacancies: 10, applicants: 35, filled: 5,
    description: "Conduct financial analysis, forecasting, and investment research.",
    requiredSkills: ["Financial Analysis", "Risk Management", "Data-Driven Banking"],
    preferredSkills: ["GST Compliance", "Investment Planning / Wealth Mgmt"],
    education: "MBA / PGDM", experience: "0–2 years", salaryMin: 5, salaryMax: 8,
    location: "Mumbai City", employmentType: "Full-time", deadline: "2026-09-20", postedDate: "2026-07-28",
  },
  {
    id: vid(), employerEmail: "hr@axisbank.com", companyName: "Axis Bank", sector: "Finance & Insurance",
    jobRole: "Insurance Sales Executive", vacancies: 20, applicants: 22, filled: 12,
    description: "Sell and service insurance products to retail and HNI customers.",
    requiredSkills: ["Insurance Sales", "Customer Experience Design", "GST Compliance"],
    preferredSkills: ["InsurTech Knowledge", "Tally ERP"],
    education: "12th Pass", experience: "0–1 years", salaryMin: 2.2, salaryMax: 3.5,
    location: "Nashik", employmentType: "Full-time", deadline: "2026-10-10", postedDate: "2026-08-02",
  },
  {
    id: vid(), employerEmail: "hr@sahyadri.com", companyName: "Sahyadri Hospitals", sector: "Healthcare",
    jobRole: "Nursing Staff (GNM)", vacancies: 20, applicants: 11, filled: 0,
    description: "Provide patient care, administer medications, and coordinate with doctors.",
    requiredSkills: ["Nursing & Allied Health", "Patient Care Management", "Emergency & First Aid"],
    preferredSkills: ["Telemedicine Skills", "Hospital Information Systems"],
    education: "ITI / Diploma", experience: "0–2 years", salaryMin: 2.4, salaryMax: 4,
    location: "Pune", employmentType: "Full-time", deadline: "2026-09-15", postedDate: "2026-07-20",
  },
  {
    id: vid(), employerEmail: "hr@sahyadri.com", companyName: "Sahyadri Hospitals", sector: "Healthcare",
    jobRole: "Medical Coder", vacancies: 8, applicants: 5, filled: 0,
    description: "Code patient diagnoses and procedures using ICD-10 and CPT standards.",
    requiredSkills: ["Medical Coding (ICD-10)", "Hospital Information Systems"],
    preferredSkills: ["Medical Transcription"],
    education: "B.Sc / B.Com / B.A.", experience: "0–1 years", salaryMin: 2, salaryMax: 3.5,
    location: "Nashik", employmentType: "Part-time", deadline: "2026-09-25", postedDate: "2026-08-15",
  },
];

// ── Candidate matching ────────────────────────────────────────────────────────

export const MOCK_CANDIDATES = [
  { name: "Priya Kadam", location: "Pune" as District, sector: "IT & Communication" as Sector, skills: ["Python", "Data Analytics", "React / Next.js"], education: "B.E. / B.Tech", experience: "1 year", matchScore: 92 },
  { name: "Rahul Deshmukh", location: "Nagpur" as District, sector: "IT & Communication" as Sector, skills: ["Data Analytics", "Python", "Machine Learning"], education: "B.Sc / B.Com / B.A.", experience: "Fresher", matchScore: 85 },
  { name: "Sneha Patil", location: "Pune" as District, sector: "IT & Communication" as Sector, skills: ["Cloud Computing (AWS/Azure)", "DevOps / CI-CD", "Python"], education: "B.E. / B.Tech", experience: "2 years", matchScore: 88 },
  { name: "Amit Shinde", location: "Aurangabad" as District, sector: "Manufacturing" as Sector, skills: ["CNC Operation", "AutoCAD / CAD-CAM", "6-Sigma / Lean"], education: "ITI / Diploma", experience: "2 years", matchScore: 90 },
  { name: "Pooja Bhosale", location: "Nashik" as District, sector: "Finance & Insurance" as Sector, skills: ["Financial Analysis", "Risk Management", "GST Compliance"], education: "MBA / PGDM", experience: "1 year", matchScore: 87 },
  { name: "Vikram Jadhav", location: "Pune" as District, sector: "Healthcare" as Sector, skills: ["Nursing & Allied Health", "Patient Care Management", "Emergency & First Aid"], education: "ITI / Diploma", experience: "Fresher", matchScore: 82 },
  { name: "Kavita More", location: "Mumbai City" as District, sector: "Finance & Insurance" as Sector, skills: ["Data-Driven Banking", "Financial Analysis", "Investment Planning / Wealth Mgmt"], education: "MBA / PGDM", experience: "2 years", matchScore: 94 },
  { name: "Rohan Kulkarni", location: "Aurangabad" as District, sector: "Manufacturing" as Sector, skills: ["Quality Control", "Industrial Safety (NEBOSH)", "ERP Systems (SAP)"], education: "ITI / Diploma", experience: "3 years", matchScore: 91 },
];

export const MOCK_TRAINING_PROGRAMS = [
  { name: "Python & Data Science Bootcamp", institute: "MITT, Mumbai", duration: "3 months", fee: "₹18,000", sector: "IT & Communication" as Sector, skills: ["Python", "Data Analytics", "Machine Learning"] },
  { name: "Cloud & DevOps Certification", institute: "Pune Tech Institute", duration: "2 months", fee: "₹22,000", sector: "IT & Communication" as Sector, skills: ["Cloud Computing (AWS/Azure)", "DevOps / CI-CD"] },
  { name: "CNC & AutoCAD Professional", institute: "PSVC, Pune", duration: "6 months", fee: "₹12,000", sector: "Manufacturing" as Sector, skills: ["CNC Operation", "AutoCAD / CAD-CAM", "Quality Control"] },
  { name: "Financial Analysis & Risk Mgmt", institute: "Nashik Finance Academy", duration: "4 months", fee: "₹15,000", sector: "Finance & Insurance" as Sector, skills: ["Financial Analysis", "Risk Management", "GST Compliance"] },
  { name: "GNM Nursing Refresher", institute: "NAHA, Nagpur", duration: "3 months", fee: "₹8,000", sector: "Healthcare" as Sector, skills: ["Nursing & Allied Health", "Patient Care Management"] },
  { name: "Generative AI for Professionals", institute: "Online — Infosys Springboard", duration: "6 weeks", fee: "Free", sector: "IT & Communication" as Sector, skills: ["Generative AI / LLMs", "Machine Learning"] },
  { name: "Lean Six Sigma Green Belt", institute: "AIQI, Aurangabad", duration: "2 months", fee: "₹20,000", sector: "Manufacturing" as Sector, skills: ["6-Sigma / Lean", "Quality Control"] },
  { name: "InsurTech & Digital Banking", institute: "BFSI Academy, Mumbai", duration: "3 months", fee: "₹14,000", sector: "Finance & Insurance" as Sector, skills: ["InsurTech Knowledge", "Data-Driven Banking"] },
];

// ── Admin credentials ─────────────────────────────────────────────────────────

export const ADMIN_CREDENTIALS = {
  adminId: "ADMIN-001",
  email: "admin@skillbridge.gov.in",
  password: "admin@123",
};

// ── Employer helpers ──────────────────────────────────────────────────────────

export function matchCandidatesToVacancy(vacancy: Vacancy) {
  return MOCK_CANDIDATES.filter((c) =>
    c.sector === vacancy.sector &&
    vacancy.requiredSkills.some((rs) =>
      c.skills.some((cs) => cs.toLowerCase().includes(rs.toLowerCase()) || rs.toLowerCase().includes(cs.toLowerCase()))
    )
  ).sort((a, b) => b.matchScore - a.matchScore);
}

export function getSkillGapForSector(sector: Sector, district: District) {
  const skills = SECTOR_SKILLS[sector];
  const districtScore = DISTRICT_DEMAND[district];
  return skills.map((s) => ({
    ...s,
    gap: Math.max(0, s.demand - Math.round(districtScore * s.demand / 100)),
    supply: Math.round(districtScore * s.demand / 100),
  })).sort((a, b) => b.gap - a.gap);
}

export function getRecommendedTrainingForSector(sector: Sector) {
  return MOCK_TRAINING_PROGRAMS.filter((p) => p.sector === sector);
}

export function getDemandColor(demand: number): string {
  if (demand >= 80) return "#16a34a";
  if (demand >= 60) return "#d97706";
  if (demand >= 40) return "#ea580c";
  return "#dc2626";
}

export function getTrendIcon(trend: "rising" | "stable" | "declining"): string {
  if (trend === "rising") return "↑";
  if (trend === "stable") return "→";
  return "↓";
}

export function getTrendClass(trend: "rising" | "stable" | "declining"): string {
  if (trend === "rising") return "text-green-600";
  if (trend === "stable") return "text-amber-600";
  return "text-red-600";
}

// AI Gap Analyzer logic
export function analyzeSkillGap(student: Student) {
  const sectorSkills = SECTOR_SKILLS[student.sector];
  const studentSkillNames = student.skills.map((s) => s.toLowerCase());

  const matched = sectorSkills.filter((s) =>
    studentSkillNames.some((us) => us.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(us))
  );
  const missing = sectorSkills.filter(
    (s) => !studentSkillNames.some((us) => us.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(us)) && s.trend !== "declining" && s.demand > 60
  );
  const declining = sectorSkills.filter(
    (s) => studentSkillNames.some((us) => us.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(us)) && s.trend === "declining"
  );
  const strong = matched.filter((s) => s.trend === "rising" && s.demand >= 75);

  return { matched, missing: missing.slice(0, 5), declining, strong };
}

// AI Curriculum Recommendation logic
export function analyzeCurriculum(institute: Institute, sector: Sector) {
  const sectorSkills = SECTOR_SKILLS[sector];
  const courseLower = institute.courses.map((c) => c.toLowerCase());

  const outdated = institute.courses.filter((c) => {
    const match = sectorSkills.find((s) => c.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(c.toLowerCase()));
    return match && match.trend === "declining";
  });
  const current = institute.courses.filter((c) => {
    const match = sectorSkills.find((s) => c.toLowerCase().includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(c.toLowerCase()));
    return match && match.trend !== "declining";
  });
  const recommended = sectorSkills
    .filter((s) => s.trend === "rising" && s.demand >= 75 && !courseLower.some((c) => c.includes(s.name.toLowerCase()) || s.name.toLowerCase().includes(c)))
    .slice(0, 6);

  return { outdated, current, recommended };
}
