"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Download,
  MessageSquare,
  FileText,
  TrendingUp,
  Clock,
  MapPin,
  Calendar,
  Phone,
  Globe,
  Brain,
  Star,
  Target,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  RotateCcw,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AIReportModal } from "@/components/ai-report-modal"
import { useAllCandidates } from "@/hooks/use-backend-api"
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Simple function to extract country from location
const getCountryFromLocation = (location: string): string => {
  // Simple mapping - in a real app, you might use a more sophisticated approach
  if (location.toLowerCase().includes('tunisia') || location.toLowerCase().includes('tunis')) return 'Tunisia'
  if (location.toLowerCase().includes('france')) return 'France'
  if (location.toLowerCase().includes('usa') || location.toLowerCase().includes('america')) return 'USA'
  if (location.toLowerCase().includes('canada')) return 'Canada'
  return 'Other'
}

const CANDIDATES_PER_PAGE = 12

// Deterministic random number generator based on seed
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Real AI Report Data from Database
const generateAIReport = (candidate: any) => {
  // If the candidate has real AI report data, use it
  if (candidate.hasAIReport && candidate.scoreDetails) {
    return {
      overallScore: candidate.aiScore,
      skillsAnalysis: candidate.scoreDetails.skills_breakdown || [],
      strengths: candidate.strengths || [],
      concerns: candidate.gaps || [],
      recommendation: candidate.aiScore >= 8.5 ? "Highly Recommended" : 
                    candidate.aiScore >= 7 ? "Recommended" : "Consider with Caution",
    }
  }
  
  // Fallback to generated data if no real report exists
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
    strengths: candidate.strengths || [
      "Strong technical background with relevant experience",
      "Excellent communication skills demonstrated in portfolio",
      "Proven track record of successful project delivery",
    ],
    concerns: candidate.gaps || ["Limited experience with specific technology stack", "Gap in recent work history needs clarification"],
    recommendation:
      candidate.aiScore >= 8.5 ? "Highly Recommended" : candidate.aiScore >= 7 ? "Recommended" : "Consider with Caution",
  };
}

export function CandidatesOverview() {
  const { candidates, loading: candidatesLoading, error: candidatesError, refetch, refreshCounter } = useAllCandidates()
  
  const [searchTerm, setSearchTerm] = useState("")

  const [jobFilter, setJobFilter] = useState("all")
  const [scoreFilter, setScoreFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [countryFilter, setCountryFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([])
  const [sortBy, setSortBy] = useState("aiScore")
  const [expandedCandidate, setExpandedCandidate] = useState<number | null>(null)
  const [aiReportCandidate, setAiReportCandidate] = useState<any | null>(null)
  const [viewingCV, setViewingCV] = useState<{candidateId: number, cvUrl: string} | null>(null)
  const [refreshingCandidates, setRefreshingCandidates] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [expandedSkills, setExpandedSkills] = useState<Record<number, boolean>>({})
  // For skill details modal
  const [selectedSkill, setSelectedSkill] = useState<{candidateName: string, skillKey: string} | null>(null);

  // Fetch extracted skills from backend
  const { data: extractedSkillsData, error: extractedSkillsError } = useSWR('/api/display-skills', fetcher);
  // Map: candidate name (or cv_filename) -> skill keys
  const candidateSkillsMap = useMemo(() => {
    if (!extractedSkillsData || !extractedSkillsData.candidates) return {};
    const map: Record<string, string[]> = {};
    extractedSkillsData.candidates.forEach((c: any) => {
      if (c.skills && typeof c.skills === 'object' && !Array.isArray(c.skills)) {
        map[c.candidate_name] = Object.keys(c.skills);
      }
    });
    return map;
  }, [extractedSkillsData]);

  // Helper to fetch PDF from URL as File
  async function fetchPdfAsFile(url: string, filename: string): Promise<File> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: 'application/pdf' });
  }

  // Filter and sort candidates - moved before early returns
  const filteredAndSortedCandidates = useMemo(() => {
    if (!candidates) return []
    
    const filtered = candidates.filter((candidate) => {
      const matchesSearch =
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.skills.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase()))


      const matchesJob = jobFilter === "all" || candidate.position === jobFilter
      const matchesCountry = countryFilter === "all" || getCountryFromLocation(candidate.location) === countryFilter

      let matchesScore = true
      if (scoreFilter === "high") matchesScore = candidate.aiScore >= 9
      else if (scoreFilter === "medium") matchesScore = candidate.aiScore >= 7 && candidate.aiScore < 9
      else if (scoreFilter === "low") matchesScore = candidate.aiScore < 7

      return matchesSearch && matchesJob && matchesScore && matchesCountry
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
        case "position":
          return a.position.localeCompare(b.position)
        default:
          return 0
      }
    })

    return filtered
  }, [candidates, searchTerm, jobFilter, scoreFilter, countryFilter, sortBy])

  // Pagination - moved before early returns
  const totalPages = Math.ceil(filteredAndSortedCandidates.length / CANDIDATES_PER_PAGE)
  const paginatedCandidates = filteredAndSortedCandidates.slice(
    (currentPage - 1) * CANDIDATES_PER_PAGE,
    currentPage * CANDIDATES_PER_PAGE,
  )

  // Stats dynamiques basées sur les filtres appliqués - moved before early returns
  const filteredStats = useMemo(() => {
    const analyzedCandidates = filteredAndSortedCandidates.filter(c => c.hasAIReport && c.aiScore > 0)
    return {
      totalCandidates: filteredAndSortedCandidates.length,
      analyzedCandidates: analyzedCandidates.length,
      notAnalyzedCandidates: filteredAndSortedCandidates.length - analyzedCandidates.length,
      avgScore:
        analyzedCandidates.length > 0
          ? Math.round(
              analyzedCandidates.reduce((sum, c) => sum + c.aiScore, 0) / analyzedCandidates.length * 10
            ) / 10
          : 0,
      uniqueCountries: [...new Set(filteredAndSortedCandidates.map((c) => getCountryFromLocation(c.location)))].length,
    }
  }, [filteredAndSortedCandidates])

  // Get unique values for filters - moved before early returns

  const positions = candidates ? [...new Set(candidates.map((c) => c.position))] : []
  const countries = candidates ? [...new Set(candidates.map((c) => getCountryFromLocation(c.location)))].sort() : []

  // Show loading state
  if (candidatesLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show error state
  if (candidatesError) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading candidates: {candidatesError}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  const handleCandidateSelect = (candidateId: number, checked: boolean) => {
    if (checked) {
      setSelectedCandidates([...selectedCandidates, candidateId])
    } else {
      setSelectedCandidates(selectedCandidates.filter((id) => id !== candidateId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCandidates(paginatedCandidates.map((c) => c.id))
    } else {
      setSelectedCandidates([])
    }
  }

  const toggleCandidateExpansion = (candidateId: number) => {
    setExpandedCandidate(expandedCandidate === candidateId ? null : candidateId)
  }

  const toggleAiReport = (candidate: any) => {
    setAiReportCandidate(aiReportCandidate && aiReportCandidate.id === candidate.id ? null : candidate)
  }

  const getCVUrl = (candidate: any) => {
    // Use the same CV URL generation logic as in job detail view
    // Mapping of candidate names to actual PDF filenames
    const nameToFileMap: Record<string, string> = {
      // HR Data Analyst candidates
      "Hadil Msadak": "hadil-msadak-cv.pdf",
      "Ghassen Abbes": "ghassen-abbes-cv.pdf",
      "Ahmed Kassab": "ahmed-kassab-cv.pdf",
      "Arwa Lassoued": "arwa-lassoued-cv.pdf",
      "Baha Kahri": "baha-kahri-cv.pdf", 
      "Baha Khemiri": "baha-khemiri-cv.pdf",
      "Ferchichi Mehdi": "ferchichi-mehdi-cv.pdf",
      "Ghassen Bouzayen": "ghassen-bouzayen-cv.pdf",
      "Imen Zarai": "imen-zarai-cv.pdf",
      "Kais Garci": "kais-garci-cv.pdf",
      "Lamia Cherni": "lamia-cherni-cv.pdf",
      "Mahdi Abdelhedi": "mahdi-abdelhedi-cv.pdf",
      "Mohamed Gharghari El Ayech": "mohamed-gharghari-el-ayech-cv.pdf",
      "Rim Jamli": "rim-jamli-cv.pdf",
      "Safa Ochi": "safa-ochi-cv.pdf",
      "Alaeddine Selmi": "alaeddine-selmi-cv.pdf"
    };
    
    // Use mapping if available, otherwise try to convert name
    const fileName = nameToFileMap[candidate.name] || 
      (candidate.name.toLowerCase().replace(/\s+/g, '-') + '-cv.pdf');
    
    // Use the API route to serve the CV
    const jobTitle = candidate.position || '';
    const url = `/api/cv/${encodeURIComponent(jobTitle)}/${fileName}`;
    console.log('Generated CV URL:', url);
    console.log('For candidate:', candidate.name);
    console.log('Using filename:', fileName);
    console.log('Job title:', jobTitle);
    return url;
  }

  const viewCV = (candidate: any) => {
    const cvUrl = getCVUrl(candidate);
    setViewingCV({ candidateId: candidate.id, cvUrl });
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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div className="flex flex-col items-center justify-center text-center space-y-2 animate-slideDown">
  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">All Candidates</h1>
  
</div>
        <div className="flex gap-3">
          {selectedCandidates.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shadow-sm hover:shadow-md transition-shadow bg-transparent">
                  <Users className="h-4 w-4 mr-2" />
                  Actions ({selectedCandidates.length})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export Selected
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Users className="h-4 w-4 mr-2" />
                  Update Status
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button className="bg-veo-green hover:bg-veo-green/90 shadow-md hover:shadow-lg transition-all">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
  { title: "Total Candidates", value: filteredStats.totalCandidates, icon: Users, color: "blue" },
  { title: "Analyzed", value: filteredStats.analyzedCandidates, icon: Brain, color: "green" },
  { title: "Not Analyzed", value: filteredStats.notAnalyzedCandidates, icon: AlertCircle, color: "amber" },
  { title: "Avg. AI Score", value: filteredStats.avgScore > 0 ? `${filteredStats.avgScore}/10` : "N/A", icon: TrendingUp, color: "purple" },
].map((stat, index) => (
          <Card
            key={stat.title}
            className="hover:shadow-lg transition-all duration-300 animate-slideUp"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search by name, email, position, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 h-12 text-base border-gray-200 focus:border-veo-green focus:ring-veo-green/20"
                />
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              {[
                
                {
                  value: jobFilter,
                  onChange: setJobFilter,
                  options: positions,
                  placeholder: "Position",
                  width: "w-48",
                },
                {
                  value: countryFilter,
                  onChange: setCountryFilter,
                  options: countries,
                  placeholder: "Country",
                  width: "w-40",
                },
                
                {
                  value: sortBy,
                  onChange: setSortBy,
                  options: ["aiScore", "name", "appliedDate", "position"],
                  placeholder: "Sort",
                  width: "w-36",
                },
              ].map((filter, index) => (
                <Select key={index} value={filter.value} onValueChange={filter.onChange}>
                  <SelectTrigger className={`${filter.width} h-12 border-gray-200 focus:border-veo-green`}>
                    <SelectValue placeholder={filter.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All {filter.placeholder}</SelectItem>
                    {filter.options.map((option: string) => (
                      <SelectItem key={option} value={option}>
                        {option === "high"
                          ? "9+"
                          : option === "medium"
                            ? "7-8.9"
                            : option === "low"
                              ? "Below 7"
                              : option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>
          </div>

          {/* Results summary */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
            <div className="text-sm text-gray-600">
              Showing {paginatedCandidates.length} of {filteredStats.totalCandidates} candidates
            </div>

            <div className="flex gap-2">
              {/* Refresh Data Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  console.log('🔄 Manual refresh clicked...')
                  console.log('📊 Current candidates count:', candidates?.length || 0)
                  console.log('📋 Before refresh - Arwa status:', candidates?.find(c => c.name.includes('Arwa'))?.hasAIReport)
                  console.log('📋 Before refresh - Baha status:', candidates?.find(c => c.name.includes('Baha'))?.hasAIReport)
                  
                  // Force refresh
                  await refetch()
                  
                  console.log('✅ Refresh completed')
                }}
                className="hover:bg-gray-50"
                disabled={candidatesLoading}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                {candidatesLoading ? 'Loading...' : 'Refresh'}
              </Button>

              {(searchTerm ||
                jobFilter !== "all" ||
                scoreFilter !== "all" ||
                countryFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    setJobFilter("all")
                    setScoreFilter("all")
                    setCountryFilter("all")
                    setCurrentPage(1)
                  }}
                  className="hover:bg-gray-50"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {paginatedCandidates.map((candidate, index) => {
          const aiReport = generateAIReport(candidate)
          const isExpanded = expandedCandidate === candidate.id

          // Get extracted skill keys for this candidate
          const extractedSkillKeys = candidateSkillsMap[candidate.name] || [];

          return (
            <Card
              key={candidate.id}
              className={`group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 animate-slideUp h-full flex flex-col` + (isExpanded ? " ring-2 ring-veo-green/30" : "")}
              style={{ animationDelay: `${index * 0.05}s`, minHeight: 350, maxHeight: 400 }} // reduced minHeight and set maxHeight
            >
              <CardContent className="p-6 flex flex-col flex-1">
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar className="h-12 w-12 ring-2 ring-gray-100 flex-shrink-0">
                        <AvatarImage src={candidate.avatar || "/placeholder.svg"} alt={candidate.name} />
                        <AvatarFallback className="bg-veo-green/10 text-veo-green font-semibold">
                          {candidate.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg truncate">{candidate.name}</h3>
                        <p className="text-sm text-gray-600 truncate">{candidate.email}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Globe className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <span className="text-xs text-gray-500 truncate">
                            {getCountryFromLocation(candidate.location)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => viewCV(candidate)}>
                            <Eye className="h-4 w-4 mr-2 text-blue-600" />
                            <span className="text-blue-600">View Resume</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="p-1 bg-veo-green/10 rounded flex-shrink-0">
                          <Users className="h-3 w-3 text-veo-green" />
                        </div>
                        <span className="font-medium text-gray-900 text-sm truncate">{candidate.position}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-xs text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{candidate.location.split(",")[0]}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{candidate.phone}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-2">Key Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {(expandedSkills[candidate.id]
                          ? extractedSkillKeys
                          : extractedSkillKeys.slice(0, 3)
                        ).map((skill, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer"
                            onClick={() => setSelectedSkill({ candidateName: candidate.name, skillKey: skill })}
                          >
                            {skill}
                          </Badge>
                        ))}
                        {extractedSkillKeys.length > 3 && !expandedSkills[candidate.id] && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-veo-green/10 text-veo-green cursor-pointer"
                            onClick={() => setExpandedSkills({ ...expandedSkills, [candidate.id]: true })}
                          >
                            +{extractedSkillKeys.length - 3}
                          </Badge>
                        )}
                        {extractedSkillKeys.length > 3 && expandedSkills[candidate.id] && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-gray-200 text-gray-700 cursor-pointer"
                            onClick={() => setExpandedSkills({ ...expandedSkills, [candidate.id]: false })}
                          >
                            Show less
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 items-end">
                  <Button
                    size="sm"
                    onClick={() => toggleCandidateExpansion(candidate.id)}
                    className="flex-1 bg-veo-green hover:bg-veo-green/90 text-white shadow-sm hover:shadow-md transition-all"
                    disabled={!candidate.hasAIReport}
                  >
                    <Brain className="h-3 w-3 mr-2" />
                    {candidate.hasAIReport ? 'View Score' : 'Not Analyzed'}
                    {candidate.hasAIReport && (isExpanded ? <ChevronUp className="h-3 w-3 ml-2" /> : <ChevronDown className="h-3 w-3 ml-2" />)}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => viewCV(candidate)}
                    className="px-3 hover:bg-blue-50 border-blue-200 text-blue-600"
                    title="View Resume"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    CV
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleAiReport(candidate)}
                    className="px-3 hover:bg-gray-50 border-gray-200"
                    title={candidate.hasAIReport ? "View AI Report" : "No AI analysis available"}
                    disabled={!candidate.hasAIReport}
                  >
                    <FileText className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            console.log('Extract skills button clicked');
            setRefreshingCandidates(true);
            setRefreshError && setRefreshError(null);
            console.log('Starting skill extraction for', paginatedCandidates.length, 'candidates');
            try {
              // For each candidate on the current page, analyze their CV
              await Promise.all(candidates.map(async (candidate) => {
                try {
                  // Get CV URL
                  const cvUrl = getCVUrl(candidate);
                  console.log(`Processing CV for ${candidate.name}: ${cvUrl}`);
                  // Fetch PDF as File
                  const file = await fetchPdfAsFile(cvUrl, `${candidate.name}.pdf`);
                  const formData = new FormData();
                  formData.append('file', file);
                  // Call the API
                  console.log(`Sending CV to API: ${candidate.name}`);
                  console.log('FormData contents:', Array.from(formData.entries()));
                  
                  let response;
                  try {
                    response = await fetch('/api/skills-from-cv', {
                      method: 'POST',
                      body: formData,
                    });
                    console.log(`API response status for ${candidate.name}:`, response.status);
                    if (!response.ok) {
                      const errorText = await response.text();
                      console.error(`API error for ${candidate.name}:`, errorText);
                      throw new Error(`API error: ${response.status} ${response.statusText}`);
                    }
                  } catch (error) {
                    console.error(`Failed to process ${candidate.name}:`, error);
                    throw error;
                  }
                  
                  const data = await response.json();
                  console.log(`API response for ${candidate.name}:`, data);
                  console.log(`API Response for ${candidate.name}:`, data);
                  // Extract skill categories
                  const skillCategories = data.hard_skills ? Object.keys(data.hard_skills) : [];
                  console.log(`Extracted skills for ${candidate.name}:`, skillCategories);
                  
                  // Update candidate's skills directly (this will be reflected after refetch)
                  candidate.skills = skillCategories;
                  console.log(`Updated candidate ${candidate.name} with skills:`, skillCategories);
                } catch (err) {
                  // On error, clear skills for this candidate
                  candidate.skills = [];
                }
              }));
              
              // Refresh the candidates data to reflect the changes
              await refetch();
            } catch (err: any) {
              setRefreshError && setRefreshError('Failed to extract skills for some candidates.');
            } finally {
              setRefreshingCandidates(false);
            }
          }}
          disabled={refreshingCandidates}
          className="flex items-center gap-2"
        >
          {refreshingCandidates ? 'Extracting skills...' : 'Extract skills'}
        </Button>
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 font-medium">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={currentPage === pageNum ? "bg-veo-green hover:bg-veo-green/90" : "hover:bg-gray-50"}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="hover:bg-gray-50"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* No results */}
      {filteredAndSortedCandidates.length === 0 && (
        <Card className="text-center py-16">
          <CardContent>
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setJobFilter("all")
                setScoreFilter("all")
                setCountryFilter("all")
                setCurrentPage(1)
              }}
              className="hover:bg-gray-50"
            >
              Clear all filters
            </Button>
          </CardContent>
        </Card>
      )}

      {/* CV Viewer Modal */}
        <Dialog open={!!viewingCV} onOpenChange={() => setViewingCV(null)}>
    <DialogContent className="max-w-6xl h-[90vh] p-0 bg-white shadow-2xl">
      {/* Header */}
      <DialogHeader className="px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
        <DialogTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-blue-100 rounded-md">
              <Eye className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-900 leading-tight">
                {viewingCV && 
                  paginatedCandidates.find(c => c.id === viewingCV.candidateId)?.name
                }
              </h3>
              <p className="text-xs text-gray-600">
                {viewingCV && 
                  paginatedCandidates.find(c => c.id === viewingCV.candidateId)?.position
                }
              </p>
            </div>
          </div>
          <div className="mr-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (viewingCV) {
                  window.open(viewingCV.cvUrl, '_blank');
                }
              }}
              className="bg-white hover:bg-blue-50 border-blue-200 text-blue-600 shadow-sm px-3 py-1 h-auto text-xs"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </DialogTitle>
      </DialogHeader>

      {/* CV Content */}
      <div className="flex-1 bg-gray-50 p-2">
        <div className="h-full bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          {viewingCV && (
            <iframe
              src={viewingCV.cvUrl}
              className="w-full h-[calc(90vh-70px)] border-0"
              title="Resume PDF"
              onError={(e) => {
                console.error('Error loading PDF:', e);
                alert('Failed to load the resume. Try downloading instead.');
              }}
            />
          )}
        </div>
      </div>
    </DialogContent>
  </Dialog>

  {/* AI Report Modal */}
  <AIReportModal
    isOpen={!!aiReportCandidate}
    onClose={() => setAiReportCandidate(null)}
    candidate={aiReportCandidate}
  />

  {/* Skill Details Modal */}
  {selectedSkill && (
    <Dialog open={!!selectedSkill} onOpenChange={() => setSelectedSkill(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {selectedSkill.skillKey} for {selectedSkill.candidateName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {(extractedSkillsData?.candidates?.find((c: any) => c.candidate_name === selectedSkill.candidateName)?.skills?.[selectedSkill.skillKey] || []).map((val: string, idx: number) => (
            <div key={idx} className="px-3 py-2 bg-gray-100 rounded text-gray-800 text-sm">
              {val}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )}
    </div>
  )
}
