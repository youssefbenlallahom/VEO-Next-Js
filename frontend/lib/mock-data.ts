// Mock data for multiple jobs and candidates
export interface Candidate {
  id: number
  name: string
  email: string
  phone: string
  position: string
  aiScore: number
  status: string
  appliedDate: string
  experience: string
  location: string
  skills: string[]
  avatar: string
  resumeUrl: string
  strengths: string[]
  gaps: string[]
  salary: string
  availability: string
}

export interface Job {
  id: string
  title: string
  department: string
  location: string
  type: string
  status: string
  postedDate: string
  salary: string
  description: string
  requirements: string[]
  applicants: Candidate[]
  priority: "High" | "Medium" | "Low"
  hiringManager: string
}

// Simple seeded random function for deterministic results
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate mock candidates
const generateCandidates = (count: number, jobTitle: string): Candidate[] => {
  const names = [
    "Sarah Johnson",
    "Michael Chen",
    "David Kim",
    "Emily Rodriguez",
    "Lisa Thompson",
    "Alex Martinez",
    "James Wilson",
    "Maria Garcia",
    "Robert Brown",
    "Jennifer Davis",
    "John Smith",
    "Linda Wang",
    "Carlos Ruiz",
    "Anna Mueller",
    "Hassan Ali",
    "Sophie Dubois",
    "Yuki Tanaka",
    "Marco Rossi",
    "Eva Johansson",
    "Priya Patel",
  ]

  const statuses = ["New Application", "Under Review", "Interview Scheduled", "Shortlisted", "Rejected"]

  const skills = {
    "Frontend Developer": ["React", "TypeScript", "CSS", "HTML", "JavaScript", "Vue.js", "Angular"],
    "Backend Developer": ["Node.js", "Python", "Java", "PostgreSQL", "MongoDB", "REST APIs", "GraphQL"],
    "UX/UI Designer": ["Figma", "Sketch", "Adobe XD", "Prototyping", "User Research", "Wireframing"],
    "Data Scientist": ["Python", "R", "SQL", "Machine Learning", "TensorFlow", "Pandas", "Jupyter"],
    "Product Manager": ["Agile", "Scrum", "Product Strategy", "Analytics", "User Stories", "Roadmapping"],
    "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Linux", "Terraform"],
    "Full Stack Developer": ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Docker"],
    "ML Engineer": ["Python", "TensorFlow", "PyTorch", "Kubernetes", "MLOps", "AWS SageMaker"],
    "Security Engineer": ["CISSP", "Penetration Testing", "Security Auditing", "Incident Response"],
    "Mobile Developer": ["React Native", "Flutter", "iOS", "Android", "Swift", "Kotlin"],
  }

  const locations = [
    "San Francisco, CA, USA",
    "New York, NY, USA",
    "Seattle, WA, USA",
    "Austin, TX, USA",
    "Boston, MA, USA",
    "Toronto, Canada",
    "Vancouver, Canada",
    "London, UK",
    "Berlin, Germany",
    "Paris, France",
    "Amsterdam, Netherlands",
    "Barcelona, Spain",
    "Milan, Italy",
    "Stockholm, Sweden",
    "Dublin, Ireland",
    "Sydney, Australia",
    "Melbourne, Australia",
    "Singapore",
    "Tokyo, Japan",
    "Remote",
  ]

  return Array.from({ length: count }, (_, i) => {
    const seed = i + jobTitle.charCodeAt(0);
    return {
      id: i + 1,
      name: names[i % names.length] + (i >= names.length ? ` ${Math.floor(i / names.length)}` : ""),
      email: `${names[i % names.length].toLowerCase().replace(" ", ".")}${i >= names.length ? i : ""}@email.com`,
      phone: `+1 (555) ${String(Math.floor(seededRandom(seed * 2) * 900) + 100)}-${String(Math.floor(seededRandom(seed * 3) * 9000) + 1000)}`,
      position: jobTitle,
      aiScore: Math.floor(seededRandom(seed * 4) * 4) + 6, // 6-10 instead of 60-100
      status: statuses[Math.floor(seededRandom(seed * 5) * statuses.length)],
      appliedDate: new Date(2024, 11, 1 + Math.floor(seededRandom(seed * 6) * 30)).toISOString().split("T")[0],
      experience: `${Math.floor(seededRandom(seed * 7) * 8) + 1}+ years`,
      location: locations[Math.floor(seededRandom(seed * 8) * locations.length)],
      skills: skills[jobTitle as keyof typeof skills]?.slice(0, Math.floor(seededRandom(seed * 9) * 4) + 3) || [],
      avatar: `/placeholder.svg?height=40&width=40`,
      resumeUrl: `/resumes/${names[i % names.length].toLowerCase().replace(" ", "-")}.pdf`,
      strengths: ["Strong technical skills", "Great communication", "Team player", "Problem solver"].slice(
        0,
        Math.floor(seededRandom(seed * 10) * 2) + 2,
      ),
      gaps: ["Limited experience in X", "Could improve Y", "Needs more Z"].slice(0, Math.floor(seededRandom(seed * 11) * 2) + 1),
      salary: `$${Math.floor(seededRandom(seed * 12) * 50000) + 80000}`,
      availability: seededRandom(seed * 13) > 0.5 ? "Immediate" : "2 weeks notice",
    }
  })
}

// Ajouter une fonction pour extraire le pays
export const getCountryFromLocation = (location: string): string => {
  if (location === "Remote") return "Remote"
  if (location.includes("USA")) return "USA"
  if (location.includes("Canada")) return "Canada"
  if (location.includes("UK")) return "UK"
  if (location.includes("France")) return "France"
  if (location.includes("Germany")) return "Germany"
  if (location.includes("Netherlands")) return "Netherlands"
  if (location.includes("Spain")) return "Spain"
  if (location.includes("Italy")) return "Italy"
  if (location.includes("Sweden")) return "Sweden"
  if (location.includes("Ireland")) return "Ireland"
  if (location.includes("Australia")) return "Australia"
  if (location.includes("Singapore")) return "Singapore"
  if (location.includes("Japan")) return "Japan"
  return "Other"
}

// Generate mock jobs with candidates
const jobStatuses = ["Active", "Closed"]
const priorities = ["Medium", "Low"]

export const mockJobs: Job[] = [
  {
    id: "1",
    title: "Senior Software Engineer",
    department: "Engineering",
    location: "New York, NY, USA",
    type: "Full-time",
    status: "Active",
    postedDate: "2024-01-10",
    salary: "$120,000 - $150,000",
    priority: "High",
    hiringManager: "John Smith",
    description:
      "We are looking for a Senior Software Engineer to join our growing team. You will be responsible for developing scalable web applications using React, Node.js, and cloud technologies.",
    requirements: [
      "5+ years of experience in full-stack development",
      "Strong knowledge of JavaScript/TypeScript",
      "Experience with React and Node.js",
      "Experience with AWS or similar cloud platforms",
      "Familiarity with agile development practices",
      "Bachelor's degree in Computer Science or related field",
    ],
    applicants: generateCandidates(45, "Senior Software Engineer"),
  },
  {
    id: "2",
    title: "Product Manager",
    department: "Product",
    location: "San Francisco, CA, USA",
    type: "Full-time",
    status: "Active",
    postedDate: "2024-01-12",
    salary: "$130,000 - $160,000",
    priority: "High",
    hiringManager: "Sarah Davis",
    description:
      "Join our product team to drive innovation and growth. We're looking for an experienced Product Manager with strong analytical skills.",
    requirements: [
      "3+ years of experience in product management",
      "Strong analytical skills",
      "Experience with user research and data analysis",
      "Knowledge of agile methodologies",
      "Excellent communication skills",
    ],
    applicants: generateCandidates(32, "Product Manager"),
  },
  {
    id: "3",
    title: "UX Designer",
    department: "Design",
    location: "Austin, TX, USA",
    type: "Full-time",
    status: "Active",
    postedDate: "2024-01-15",
    salary: "$90,000 - $120,000",
    priority: "Medium",
    hiringManager: "Mike Johnson",
    description:
      "Create amazing user experiences for our products. Looking for a UX Designer with strong portfolio and user research experience.",
    requirements: [
      "2+ years of experience in UX/UI design",
      "Proficiency in Figma and design systems",
      "Experience with user research and usability testing",
      "Strong portfolio demonstrating design thinking",
      "Knowledge of front-end development principles",
    ],
    applicants: generateCandidates(28, "UX Designer"),
  },
  {
    id: "4",
    title: "Data Scientist",
    department: "Analytics",
    location: "Seattle, WA, USA",
    type: "Full-time",
    status: "Draft",
    postedDate: "2024-01-08",
    salary: "$110,000 - $140,000",
    priority: "High",
    hiringManager: "Lisa Chen",
    description:
      "Join our data team to build machine learning models and drive data-driven decisions across the organization.",
    requirements: [
      "PhD or Master's in Data Science, Statistics, or related field",
      "3+ years of experience in machine learning",
      "Proficiency in Python, R, and SQL",
      "Experience with TensorFlow or PyTorch",
      "Strong statistical analysis skills",
    ],
    applicants: generateCandidates(38, "Data Scientist"),
  },
  {
    id: "5",
    title: "Frontend Developer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    status: "Active",
    postedDate: "2024-01-20",
    salary: "$95,000 - $125,000",
    priority: "Medium",
    hiringManager: "Alex Rodriguez",
    description: "Build beautiful and responsive user interfaces using modern frontend technologies.",
    requirements: [
      "3+ years of frontend development experience",
      "Expert knowledge of React and TypeScript",
      "Experience with modern CSS frameworks",
      "Understanding of web performance optimization",
      "Experience with testing frameworks",
    ],
    applicants: generateCandidates(52, "Software Engineer"),
  },
  {
    id: "6",
    title: "Marketing Manager",
    department: "Marketing",
    location: "Chicago, IL, USA",
    type: "Full-time",
    status: "Closed",
    postedDate: "2024-01-18",
    salary: "$85,000 - $110,000",
    priority: "Medium",
    hiringManager: "Jennifer White",
    description: "Lead our marketing initiatives and drive brand awareness through digital channels.",
    requirements: [
      "4+ years of marketing experience",
      "Experience with digital marketing platforms",
      "Strong analytical and creative skills",
      "Knowledge of SEO and content marketing",
      "Experience managing marketing budgets",
    ],
    applicants: generateCandidates(29, "Marketing Manager"),
  },
  {
    id: "7",
    title: "DevOps Engineer",
    department: "Engineering",
    location: "Boston, MA, USA",
    type: "Full-time",
    status: "Active",
    postedDate: "2024-01-22",
    salary: "$115,000 - $145,000",
    priority: "High",
    hiringManager: "David Kim",
    description: "Manage our cloud infrastructure and implement CI/CD pipelines for scalable deployment.",
    requirements: [
      "4+ years of DevOps experience",
      "Experience with AWS, Docker, and Kubernetes",
      "Knowledge of Infrastructure as Code",
      "Experience with monitoring and logging tools",
      "Strong scripting skills",
    ],
    applicants: generateCandidates(15, "Software Engineer"),
  },
  {
    id: "8",
    title: "Sales Representative",
    department: "Sales",
    location: "New York, NY, USA",
    type: "Full-time",
    status: "Draft",
    postedDate: "2024-01-14",
    salary: "$60,000 - $90,000 + Commission",
    priority: "Low",
    hiringManager: "Robert Brown",
    description: "Drive revenue growth by building relationships with potential clients and closing deals.",
    requirements: [
      "2+ years of B2B sales experience",
      "Strong communication and negotiation skills",
      "Experience with CRM systems",
      "Proven track record of meeting sales targets",
      "Bachelor's degree preferred",
    ],
    applicants: generateCandidates(41, "Sales Representative"),
  },
  {
    id: "9",
    title: "Backend Developer",
    department: "Engineering",
    location: "San Francisco, CA, USA",
    type: "Full-time",
    status: "Active",
    postedDate: "2024-01-16",
    salary: "$105,000 - $135,000",
    priority: "High",
    hiringManager: "Maria Garcia",
    description: "Build robust and scalable backend systems using modern technologies and best practices.",
    requirements: [
      "4+ years of backend development experience",
      "Proficiency in Node.js, Python, or Java",
      "Experience with databases and API design",
      "Knowledge of microservices architecture",
      "Experience with cloud platforms",
    ],
    applicants: generateCandidates(36, "Software Engineer"),
  },
  {
    id: "10",
    title: "HR Coordinator",
    department: "Human Resources",
    location: "Austin, TX, USA",
    type: "Full-time",
    status: "Active",
    postedDate: "2024-01-05",
    salary: "$50,000 - $65,000",
    priority: "Low",
    hiringManager: "Amanda Taylor",
    description: "Support HR operations including recruitment, onboarding, and employee relations.",
    requirements: [
      "2+ years of HR experience",
      "Knowledge of HR best practices",
      "Strong organizational skills",
      "Experience with HRIS systems",
      "Bachelor's degree in HR or related field",
    ],
    applicants: generateCandidates(23, "HR Coordinator"),
  },
]

// All candidates across all jobs
export const allCandidates: Candidate[] = mockJobs.flatMap((job) =>
  job.applicants.map((candidate) => ({
    ...candidate,
    position: job.title,
    jobId: job.id,
  })),
)
