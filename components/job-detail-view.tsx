"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Brain,
  Play,
  Settings,
  Download,
  MessageSquare,
  Eye,
  Wand2,
  ChevronLeft,
  ChevronRight,
  Search,
  MoreHorizontal,
  TrendingUp,
  Check,
  X,
  Info,
  FileText,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"

// TypeScript type for normalized job description
export interface JobDescriptionJSON {
  sections: Array<{
    title?: string;
    categories: Array<{
      title?: string;
      items: string[];
    }>;
  }>;
}

// Type guard for normalized job description
export function isNormalizedDescription(desc: unknown): desc is JobDescriptionJSON {
  return (
    typeof desc === 'object' &&
    desc !== null &&
    'sections' in desc &&
    Array.isArray((desc as any).sections)
  );
}
import { useJobWithCandidates } from "@/hooks/use-data"

interface JobDetailViewProps {
  jobId: string
}

const CANDIDATES_PER_PAGE = 10

interface Barem {
  id: string
  name: string
  description: string
  skills: Record<string, number>
  createdDate: string
  jobTitle?: string
}

// Mock saved barems
const savedBarems: Barem[] = [
  {
    id: "1",
    name: "Senior Software Engineer Standard",
    description: "Standard evaluation criteria for senior software engineering positions",
    skills: {
      "JavaScript/TypeScript": 25,
      React: 20,
      "Node.js": 20,
      "AWS/Cloud": 15,
      "Full-stack Experience": 20,
    },
    createdDate: "2024-01-10",
    jobTitle: "Senior Software Engineer",
  },
  {
    id: "2",
    name: "Frontend Developer Focus",
    description: "Emphasis on frontend technologies and user experience",
    skills: {
      "React/Vue/Angular": 30,
      "JavaScript/TypeScript": 25,
      "CSS/HTML": 20,
      "UI/UX Design": 15,
      Testing: 10,
    },
    createdDate: "2024-01-08",
  },
]

export function JobDetailView({ jobId }: JobDetailViewProps) {
  const { job, candidates, loading } = useJobWithCandidates(jobId)
  const [selectedApplicants, setSelectedApplicants] = useState<number[]>([])
  const [showBaremModal, setShowBaremModal] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [currentBarem, setCurrentBarem] = useState<Barem | null>(null)

  // Candidate filtering and pagination
  const [candidateSearch, setCandidateSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState("aiScore")
  const [aiReportCandidate, setAiReportCandidate] = useState<number | null>(null)

  // Barem creation states
  const [baremName, setBaremName] = useState("")
  const [baremDescription, setBaremDescription] = useState("")
  const [skillWeights, setSkillWeights] = useState<Record<string, number>>({})

  // Additional state hooks that were declared after early returns
  const [customSkills, setCustomSkills] = useState<string[]>([])
  const [newSkill, setNewSkill] = useState("")
  const [extractedSkills, setExtractedSkills] = useState<string[]>([])
  const [isExtracting, setIsExtracting] = useState(false)

  // Filter and sort candidates
  const filteredAndSortedCandidates = useMemo(() => {
    if (!candidates) return []

    const filtered = candidates.filter((candidate) => {
      const matchesSearch =
        candidate.name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        candidate.email.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        candidate.skills.some((skill) => skill.toLowerCase().includes(candidateSearch.toLowerCase()))

      return matchesSearch
    })

    // Sort candidates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "aiScore":
          return b.aiScore - a.aiScore
        case "name":
          return a.name.localeCompare(b.name)
        case "appliedDate":
          return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [candidates, candidateSearch, sortBy])

  // Pagination for candidates
  const totalPages = Math.ceil(filteredAndSortedCandidates.length / CANDIDATES_PER_PAGE)
  const paginatedCandidates = filteredAndSortedCandidates.slice(
    (currentPage - 1) * CANDIDATES_PER_PAGE,
    currentPage * CANDIDATES_PER_PAGE,
  )

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show error state if job not found
  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Job not found</p>
          <Link href="/">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleApplicantSelect = (applicantId: number, checked: boolean) => {
    if (checked) {
      setSelectedApplicants([...selectedApplicants, applicantId])
    } else {
      setSelectedApplicants(selectedApplicants.filter((id) => id !== applicantId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApplicants(paginatedCandidates.map((c) => c.id))
    } else {
      setSelectedApplicants([])
    }
  }

  const extractSkillsFromJob = async () => {
    setIsExtracting(true)
    setExtractedSkills([])

    // Simulation d'analyse IA avec progression
    const steps = [
      "Analyzing job title...",
      "Processing job description...",
      "Identifying key skills...",
      "Calculating skill importance...",
      "Generating skill weights...",
    ]

    for (let i = 0; i < steps.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 800))
    }

    // Génération basée sur le job réel
    const jobBasedSkills =
      job?.title.toLowerCase().includes("software") ||
      job?.title.toLowerCase().includes("developer") ||
      job?.title.toLowerCase().includes("engineer")
        ? [
            "JavaScript/TypeScript",
            "React",
            "Node.js",
            "AWS/Cloud",
            "Full-stack Development",
            "Git/Version Control",
            "API Development",
            "Database Design",
          ]
        : job?.title.toLowerCase().includes("product")
          ? [
              "Product Strategy",
              "User Research",
              "Analytics",
              "Agile/Scrum",
              "Roadmapping",
              "Stakeholder Management",
              "Market Analysis",
              "A/B Testing",
            ]
          : job?.title.toLowerCase().includes("designer") || job?.title.toLowerCase().includes("ux")
            ? [
                "Figma/Sketch",
                "User Research",
                "Prototyping",
                "Design Systems",
                "Usability Testing",
                "Visual Design",
                "Information Architecture",
                "Interaction Design",
              ]
            : job?.title.toLowerCase().includes("data")
              ? [
                  "Python/R",
                  "Machine Learning",
                  "SQL",
                  "Statistics",
                  "Data Visualization",
                  "TensorFlow/PyTorch",
                  "Big Data",
                  "Statistical Analysis",
                ]
              : job?.title.toLowerCase().includes("marketing")
                ? [
                    "Digital Marketing",
                    "SEO/SEM",
                    "Content Strategy",
                    "Analytics",
                    "Social Media",
                    "Campaign Management",
                    "Brand Management",
                    "Marketing Automation",
                  ]
                : [
                    "Communication",
                    "Problem Solving",
                    "Leadership",
                    "Project Management",
                    "Analytical Thinking",
                    "Teamwork",
                  ]

    setExtractedSkills(jobBasedSkills)

    // Auto-distribution intelligente des poids
    const totalSkills = jobBasedSkills.length
    const baseWeight = Math.floor(100 / totalSkills)
    const remainder = 100 - baseWeight * totalSkills

    const initialWeights: Record<string, number> = {}
    jobBasedSkills.forEach((skill, index) => {
      initialWeights[skill] = baseWeight + (index < remainder ? 1 : 0)
    })

    setSkillWeights(initialWeights)
    setIsExtracting(false)
  }

  const updateSkillWeight = (skill: string, weight: number) => {
    setSkillWeights({ ...skillWeights, [skill]: weight })
  }

  const autoDistributeWeights = () => {
    const allSkills = [...extractedSkills, ...customSkills]
    if (allSkills.length === 0) return

    const equalWeight = Math.floor(100 / allSkills.length)
    const newWeights: Record<string, number> = {}

    allSkills.forEach((skill) => {
      newWeights[skill] = equalWeight
    })

    const total = Object.values(newWeights).reduce((sum, weight) => sum + weight, 0)
    if (total !== 100 && allSkills.length > 0) {
      newWeights[allSkills[0]] += 100 - total
    }

    setSkillWeights(newWeights)
  }

  const startAnalysis = async () => {
    setIsAnalyzing(true)
    setAnalysisProgress(0)

    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setAnalysisProgress(i)
    }

    setIsAnalyzing(false)
    setShowBaremModal(false)
  }

  const getTotalWeight = () => {
    return Object.values(skillWeights).reduce((sum, weight) => sum + weight, 0)
  }

  const getScoreColor = (score: number) => {
    if (score >= 9) return "bg-emerald-100 text-emerald-800 border-emerald-200"
    if (score >= 8) return "bg-blue-100 text-blue-800 border-blue-200"
    if (score >= 7) return "bg-amber-100 text-amber-800 border-amber-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New Application":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "Under Review":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "Interview Scheduled":
        return "bg-purple-50 text-purple-700 border-purple-200"
      case "Final Round":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "Offer Extended":
        return "bg-green-50 text-green-700 border-green-200"
      case "Rejected":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  // Deterministic random number generator based on seed
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Generate AI Report Data
  const generateAIReport = (candidate: any) => {
    // Create a consistent seed based on candidate ID
    const seed = candidate.id;
    
    return {
      overallScore: candidate.aiScore,
      skillsAnalysis: [
        {
          skill: "Technical Skills",
          score: Math.min(10, candidate.aiScore + (seededRandom(seed * 1) * 2 - 1)),
          weight: 35,
        },
        {
          skill: "Communication",
          score: Math.min(10, candidate.aiScore + (seededRandom(seed * 2) * 2 - 1)),
          weight: 25,
        },
        {
          skill: "Problem Solving",
          score: Math.min(10, candidate.aiScore + (seededRandom(seed * 3) * 2 - 1)),
          weight: 20,
        },
        {
          skill: "Leadership",
          score: Math.min(10, candidate.aiScore + (seededRandom(seed * 4) * 2 - 1)),
          weight: 20,
        },
      ],
      strengths: [
        "Strong technical background with relevant experience",
        "Excellent communication skills demonstrated in portfolio",
        "Proven track record of successful project delivery",
      ],
      concerns: ["Limited experience with specific technology stack", "Gap in recent work history needs clarification"],
      recommendation:
        candidate.aiScore >= 8.5 ? "Highly Recommended" : candidate.aiScore >= 7 ? "Recommended" : "Consider with Caution",
    };
  }

  const toggleAiReport = (candidateId: number) => {
    setAiReportCandidate(aiReportCandidate === candidateId ? null : candidateId)
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4 animate-slideDown">
        <Link href="/">
          <Button variant="outline" className="btn-secondary shadow-sm bg-transparent">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Button>
        </Link>
        <div className="flex-1">
          {job ? (
            <div className="animate-slideRight">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{job.title}</h1>
              <p className="text-lg text-gray-600">
                {job.department} • {job.location} • {candidates.length} applicants
              </p>
            </div>
          ) : (
            <div>Job not found</div>
          )}
        </div>
        {job && (
          <Badge className={`${getStatusColor(job.status)} border font-medium animate-scaleIn`}>{job.status}</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Job Details */}
        <div className="lg:col-span-2 space-y-8">
          {job && (
            <Card className="shadow-soft animate-slideUp">
              <CardHeader>
                <CardTitle className="text-xl">Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center gap-3 animate-slideIn" style={{ animationDelay: "0.1s" }}>
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <MapPin className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-medium text-gray-900">{job.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 animate-slideIn" style={{ animationDelay: "0.2s" }}>
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Users className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Applicants</p>
                      <p className="font-medium text-gray-900">{candidates.length}</p>
                    </div>
                  </div>
                </div>

                <div className="animate-slideUp" style={{ animationDelay: '0.5s' }}>
                  <h4 className="font-semibold text-gray-900 mb-6 text-xl">Job Description</h4>
                  {isNormalizedDescription(job.description) ? (
                    <div className="space-y-8">
                      {(job.description as JobDescriptionJSON).sections
                        .filter(section => section.title?.trim().toLowerCase() !== 'requirements')
                        .map((section, secIdx) => (
                          <div key={secIdx} className="border-l-4 border-veo-green pl-6">
                            {section.title && (
                              <h5 className="text-lg font-semibold text-gray-900 mb-4">{section.title}</h5>
                            )}
                            <div className="space-y-4">
                              {section.categories?.map((category, catIdx) => (
                                <div key={catIdx}>
                                  {category.title && (
                                    <h6 className="font-medium text-gray-800 mb-2">{category.title}</h6>
                                  )}
                                  <ul className="space-y-2 text-gray-600">
                                    {category.items.map((item, itemIdx) => (
                                      <li key={itemIdx} className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 bg-veo-green rounded-full mt-2 flex-shrink-0"></div>
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {(() => {
                        interface Section {
                          title: string;
                          items: string[];
                        }
                        const lines = job.description.split('\n').filter(line => line.trim() !== '');
                        const sections: Section[] = [];
                        let currentSection: Section = { title: 'Overview', items: [] };
                        
                        lines.forEach((line) => {
                          const trimmedLine = line.trim();
                          
                          // Check if line looks like a section header
                          if (
                            (trimmedLine.length < 50 && 
                             (trimmedLine.toUpperCase() === trimmedLine || 
                              /^(responsibilities|qualifications|skills|benefits|about|overview|description|duties|experience|education|what you.ll do|what we offer|job summary|role overview|key requirements|preferred qualifications)/i.test(trimmedLine))) ||
                            (trimmedLine.endsWith(':') && trimmedLine.length < 50)
                          ) {
                            // Save previous section if it has items
                            if (currentSection.items.length > 0) {
                              sections.push(currentSection);
                            }
                            // Start new section
                            currentSection = { 
                              title: trimmedLine.replace(':', ''), 
                              items: [] 
                            };
                          } else if (trimmedLine.length > 0) {
                            // Add to current section
                            currentSection.items.push(trimmedLine.replace(/^[-•*]\s*/, ''));
                          }
                        });
                        
                        // Add the last section
                        if (currentSection.items.length > 0) {
                          sections.push(currentSection);
                        }
                        
                        // If no sections were detected, create a single section
                        if (sections.length === 0) {
                          sections.push({
                            title: 'Job Description',
                            items: lines.map(line => line.replace(/^[-•*]\s*/, ''))
                          });
                        }
                        
                        return sections.filter(section => 
                          !section.title.toLowerCase().includes('requirement')
                        );
                      })().map((section, secIdx) => (
                        <div key={secIdx} className="border-l-4 border-veo-green pl-6">
                          <h5 className="text-lg font-semibold text-gray-900 mb-4">{section.title}</h5>
                          <ul className="space-y-2 text-gray-600">
                            {section.items.map((item, itemIdx) => (
                              <li key={itemIdx} className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 bg-veo-green rounded-full mt-2 flex-shrink-0"></div>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="animate-slideUp" style={{ animationDelay: "0.6s" }}>
                  <div className="border-l-4 border-veo-green pl-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h4>
                    <ul className="space-y-2 text-gray-600">
                      {job.requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-veo-green rounded-full mt-2 flex-shrink-0"></div>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Applicants */}
          {job && (
            <Card className="shadow-soft animate-slideUp" style={{ animationDelay: "0.3s" }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-veo-green/10 rounded-lg">
                      <Users className="h-5 w-5 text-veo-green" />
                    </div>
                    Applicants ({filteredAndSortedCandidates.length})
                  </CardTitle>
                  <div className="flex items-center gap-3">
                    {selectedApplicants.length > 0 && (
                      <Badge variant="outline" className="animate-scaleIn">
                        {selectedApplicants.length} selected
                      </Badge>
                    )}
                    <Button
                      onClick={() => setShowBaremModal(true)}
                      disabled={selectedApplicants.length === 0}
                      className="btn-primary shadow-sm hover:shadow-md"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      AI Analysis
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Candidate Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative form-field">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search candidates..."
                        value={candidateSearch}
                        onChange={(e) => setCandidateSearch(e.target.value)}
                        className="pl-10 h-10 border-gray-200 focus:border-veo-green focus:ring-veo-green/20"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    {[
                      {
                        value: sortBy,
                        onChange: setSortBy,
                        options: ["aiScore", "name", "appliedDate"],
                        placeholder: "Sort",
                        width: "w-32",
                      },
                    ].map((filter, index) => (
                      <Select key={index} value={filter.value} onValueChange={filter.onChange}>
                        <SelectTrigger
                          className={`${filter.width} h-10 border-gray-200 focus:border-veo-green hover-lift`}
                        >
                          <SelectValue placeholder={filter.placeholder} />
                        </SelectTrigger>
                        <SelectContent className="animate-scaleIn">
                          <SelectItem value="all">All {filter.placeholder}</SelectItem>
                          {filter.options.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option === "high"
                                ? "90%+"
                                : option === "medium"
                                  ? "70-89%"
                                  : option === "low"
                                    ? "Below 70%"
                                    : option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ))}
                  </div>
                </div>

                {/* Select All */}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={
                        selectedApplicants.length === paginatedCandidates.length && paginatedCandidates.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-gray-600 font-medium">
                      Showing <span className="text-gray-900">{paginatedCandidates.length}</span> of{" "}
                      <span className="text-gray-900">{filteredAndSortedCandidates.length}</span> candidates
                      {selectedApplicants.length > 0 && (
                        <span className="ml-2 text-veo-green">({selectedApplicants.length} selected)</span>
                      )}
                    </span>
                  </div>

                  {selectedApplicants.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="btn-secondary bg-transparent">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="animate-scaleIn">
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Export Selected
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Bulk Message
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Update Status
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {/* Candidate List */}
                <div className="space-y-4">
                  {paginatedCandidates.map((applicant, index) => (
                    <div
                      key={applicant.id}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-veo-green/30 transition-all duration-200 animate-slideUp"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <Checkbox
                        checked={selectedApplicants.includes(applicant.id)}
                        onCheckedChange={(checked) => handleApplicantSelect(applicant.id, checked as boolean)}
                      />
                      <Avatar className="h-12 w-12 ring-2 ring-gray-100 hover:ring-veo-green/30 transition-all">
                        <AvatarImage src={applicant.avatar || "/placeholder.svg"} alt={applicant.name} />
                        <AvatarFallback className="bg-veo-green/10 text-veo-green font-semibold">
                          {applicant.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 text-lg">{applicant.name}</h4>
                          <div className="flex items-center gap-2">
                            <Badge className={`${getScoreColor(applicant.aiScore)} border font-bold`}>
                              {applicant.aiScore}/10
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 mb-3">
                          <span className="font-medium">{applicant.email}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {applicant.skills.slice(0, 4).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-gray-100 text-gray-700">
                              {skill}
                            </Badge>
                          ))}
                          {applicant.skills.length > 4 && (
                            <Badge variant="secondary" className="text-xs bg-veo-green/10 text-veo-green">
                              +{applicant.skills.length - 4}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="btn-secondary bg-transparent">
                            <Eye className="h-3 w-3 mr-1" />
                            Resume
                          </Button>
                          <Button variant="outline" size="sm" className="btn-secondary bg-transparent">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Contact
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => toggleAiReport(applicant.id)}
                            className="btn-secondary bg-transparent"
                            title="View AI Report"
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            AI Report
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* AI Report Section */}
                {aiReportCandidate && (
                  <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 animate-slideDown">
                    {(() => {
                      const candidate = paginatedApplicants.find(c => c.id === aiReportCandidate);
                      if (!candidate) return null;
                      const aiReport = generateAIReport(candidate);
                      
                      return (
                        <div>
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 bg-purple-600 rounded-full flex items-center justify-center">
                                <FileText className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-purple-900">AI Analysis Report</h3>
                                <p className="text-sm text-purple-700">{candidate.name}</p>
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-3xl font-bold text-purple-900">{aiReport.overallScore}/10</div>
                              <div className="text-xs font-medium text-purple-700">Overall Score</div>
                            </div>
                          </div>
                          
                          {/* Skills Analysis */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                              <h4 className="text-sm font-semibold text-purple-800 uppercase tracking-wide mb-4">Skills Breakdown</h4>
                              <div className="space-y-4">
                                {aiReport.skillsAnalysis.map((skill, idx) => (
                                  <div key={idx} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-purple-700 font-medium">{skill.skill}</span>
                                      <span className="text-sm font-semibold text-purple-900">{skill.score.toFixed(1)}</span>
                                    </div>
                                    <div className="w-full bg-purple-200 rounded-full h-2">
                                      <div 
                                        className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                                        style={{ width: `${(skill.score / 10) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-semibold text-purple-800 uppercase tracking-wide mb-4">Recommendation</h4>
                              <div className="p-4 bg-white/50 rounded-lg border border-purple-200">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className={`h-3 w-3 rounded-full ${
                                    aiReport.recommendation === "Highly Recommended" ? "bg-green-500" :
                                    aiReport.recommendation === "Recommended" ? "bg-yellow-500" : "bg-red-500"
                                  }`}></div>
                                  <span className="text-sm font-semibold text-purple-900">{aiReport.recommendation}</span>
                                </div>
                                
                                <div className="space-y-3">
                                  <div>
                                    <h5 className="text-xs font-semibold text-purple-800 mb-1">Strengths</h5>
                                    <ul className="text-xs text-purple-700 space-y-1">
                                      {aiReport.strengths.map((strength, idx) => (
                                        <li key={idx} className="flex items-start gap-1">
                                          <span className="text-green-600 mt-0.5">•</span>
                                          {strength}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  
                                  <div>
                                    <h5 className="text-xs font-semibold text-purple-800 mb-1">Areas of Concern</h5>
                                    <ul className="text-xs text-purple-700 space-y-1">
                                      {aiReport.concerns.map((concern, idx) => (
                                        <li key={idx} className="flex items-start gap-1">
                                          <span className="text-amber-600 mt-0.5">•</span>
                                          {concern}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-end pt-4 border-t border-purple-200">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setAiReportCandidate(null)}
                              className="text-purple-700 border-purple-300 hover:bg-purple-50"
                            >
                              Close Report
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                    <div className="text-sm text-gray-600 font-medium">
                      Page <span className="text-gray-900">{currentPage}</span> of{" "}
                      <span className="text-gray-900">{totalPages}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="btn-secondary"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="btn-secondary"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* No results */}
                {filteredAndSortedCandidates.length === 0 && (
                  <div className="text-center py-12 animate-scaleIn">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No candidates found</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setCandidateSearch("")
                        setCurrentPage(1)
                      }}
                      className="btn-secondary"
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        {job && (
          <div className="space-y-6">
            <Card className="shadow-soft animate-slideUp" style={{ animationDelay: "0.4s" }}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-veo-green" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Total Applicants", value: candidates.length },
                  {
                    label: "Avg. AI Score",
                    value: candidates.length > 0 
                      ? `${Math.round(candidates.reduce((sum, a) => sum + a.aiScore, 0) / candidates.length)}%`
                      : "0%",
                  },
                  {
                    label: "New Applications",
                    value: candidates.filter((a) => a.status === "New").length,
                  },
                  { label: "High Scores (90%+)", value: candidates.filter((a) => a.aiScore >= 90).length },
                ].map((stat, index) => (
                  <div
                    key={stat.label}
                    className="flex justify-between animate-slideIn"
                    style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                  >
                    <span className="text-sm text-gray-600">{stat.label}</span>
                    <span className="font-semibold text-gray-900">{stat.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-soft animate-slideUp" style={{ animationDelay: "0.6s" }}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5 text-veo-green" />
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { icon: Download, label: "Export All Applicants" },
                  { icon: Settings, label: "Edit Job Posting" },
                ].map((action, index) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="w-full btn-secondary animate-slideIn bg-transparent"
                    style={{ animationDelay: `${0.7 + index * 0.1}s` }}
                  >
                    <action.icon className="h-4 w-4 mr-2" />
                    {action.label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Barem Configuration Modal - PROPERLY CENTERED VERSION */}
      {showBaremModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="fixed inset-4 flex items-center justify-center">
            <div className="w-full max-w-5xl max-h-full flex flex-col animate-scaleIn">
              <Card className="bg-white shadow-2xl border-0 h-full flex flex-col">
                {/* Header - Fixed */}
                <CardHeader className="bg-gradient-to-r from-veo-green to-emerald-600 text-white p-4 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Brain className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold">AI-Powered Candidate Assessment</CardTitle>
                        <CardDescription className="text-white/90 text-sm">
                          Generate intelligent scoring criteria for {selectedApplicants.length} selected candidates
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBaremModal(false)}
                      className="text-white hover:bg-white/20 h-10 w-10 rounded-lg"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </CardHeader>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  <CardContent className="p-6">
                    {isAnalyzing ? (
                      <div className="flex items-center justify-center h-full min-h-[400px]">
                        <div className="text-center">
                          <div className="relative mx-auto w-20 h-20 mb-6">
                            <div className="absolute inset-0 border-4 border-veo-green/20 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-veo-green border-t-transparent rounded-full animate-spin"></div>
                            <Brain className="absolute inset-0 m-auto h-8 w-8 text-veo-green animate-pulse" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">AI Analysis in Progress</h3>
                          <p className="text-gray-600 mb-6">
                            Evaluating candidates using your custom assessment criteria
                          </p>

                          <div className="max-w-sm mx-auto">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                              <span>Progress</span>
                              <span>{analysisProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="h-full bg-gradient-to-r from-veo-green to-emerald-500 rounded-full transition-all duration-300"
                                style={{ width: `${analysisProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : extractedSkills.length === 0 ? (
                      <div className="flex items-center justify-center h-full min-h-[400px]">
                        <div className="text-center max-w-2xl">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-veo-green/10 to-emerald-500/10 rounded-full mb-4">
                            <Brain className="h-4 w-4 text-veo-green" />
                            <span className="text-sm font-medium text-veo-green">AI-Powered Assessment</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-3">Generate Smart Assessment Criteria</h3>
                          <p className="text-gray-600 mb-6">
                            Our AI will analyze "<strong>{job?.title}</strong>" requirements to automatically generate
                            relevant skills and optimal weights for candidate evaluation.
                          </p>

                          <Button
                            onClick={extractSkillsFromJob}
                            disabled={isExtracting}
                            size="lg"
                            className="bg-gradient-to-r from-veo-green to-emerald-600 hover:from-veo-green/90 hover:to-emerald-600/90 text-white px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
                          >
                            {isExtracting ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                                Generating Assessment Criteria...
                              </>
                            ) : (
                              <>
                                <Wand2 className="h-5 w-5 mr-2" />
                                Generate AI Assessment
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="text-center mb-4">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full mb-3">
                            <div className="p-0.5 bg-green-500 rounded-full">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-sm font-medium text-green-700">AI Generation Complete!</span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">Review & Adjust Skill Weights</h3>
                          <p className="text-gray-600 text-sm">
                            AI identified {extractedSkills.length} key skills for "{job?.title}". Adjust the weights to
                            match your priorities.
                          </p>
                        </div>

                        <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-white rounded shadow-sm">
                              <TrendingUp className="h-4 w-4 text-gray-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 text-sm">Total Weight</h4>
                              <p className="text-xs text-gray-600">Must equal 100%</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-xl font-bold ${getTotalWeight() === 100 ? "text-green-600" : "text-red-500"}`}
                            >
                              {getTotalWeight()}%
                            </div>
                            {getTotalWeight() !== 100 && (
                              <p className="text-xs text-red-500">
                                {getTotalWeight() > 100 ? "Reduce by" : "Add"} {Math.abs(100 - getTotalWeight())}%
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 mb-4">
                          <Button
                            onClick={autoDistributeWeights}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-xs bg-transparent"
                          >
                            <Wand2 className="h-3 w-3" />
                            Auto-Distribute
                          </Button>
                          <Button
                            onClick={() => {
                              setExtractedSkills([])
                              setSkillWeights({})
                            }}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-xs"
                          >
                            <ArrowLeft className="h-3 w-3" />
                            Regenerate
                          </Button>
                        </div>

                        <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                          {extractedSkills.map((skill, index) => (
                            <div
                              key={skill}
                              className="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-all"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="p-1 bg-gradient-to-br from-veo-green/10 to-emerald-500/10 rounded">
                                    <Brain className="h-3 w-3 text-veo-green" />
                                  </div>
                                  <span className="font-medium text-gray-900 text-sm">{skill}</span>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-veo-green">{skillWeights[skill] || 0}%</div>
                                </div>
                              </div>
                              <Slider
                                value={[skillWeights[skill] || 0]}
                                onValueChange={(value) => updateSkillWeight(skill, value[0])}
                                max={100}
                                step={1}
                                className="w-full"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </div>

                {/* Footer - Fixed */}
                {!isAnalyzing && extractedSkills.length > 0 && (
                  <div className="border-t bg-gray-50 p-4 flex-shrink-0">
                    <div className="flex gap-3">
                      <Button onClick={() => setShowBaremModal(false)} variant="outline" className="flex-1 h-10">
                        Cancel
                      </Button>
                      <Button
                        onClick={startAnalysis}
                        className="flex-1 h-10 bg-gradient-to-r from-veo-green to-emerald-600 hover:from-veo-green/90 hover:to-emerald-600/90 text-white"
                        disabled={getTotalWeight() !== 100}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start AI Analysis
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
