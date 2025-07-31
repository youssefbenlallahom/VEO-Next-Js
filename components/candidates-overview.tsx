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
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useCandidates, useJobs } from "@/hooks/use-data"

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

// Mock AI Report Data
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

export function CandidatesOverview() {
  const { candidates, loading: candidatesLoading, error: candidatesError } = useCandidates()
  const { jobs, loading: jobsLoading } = useJobs()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [jobFilter, setJobFilter] = useState("all")
  const [scoreFilter, setScoreFilter] = useState("all")
  const [locationFilter, setLocationFilter] = useState("all")
  const [countryFilter, setCountryFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([])
  const [sortBy, setSortBy] = useState("aiScore")
  const [expandedCandidate, setExpandedCandidate] = useState<number | null>(null)

  // Filter and sort candidates - moved before early returns
  const filteredAndSortedCandidates = useMemo(() => {
    if (!candidates) return []
    
    const filtered = candidates.filter((candidate) => {
      const matchesSearch =
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.skills.some((skill) => skill.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesStatus = statusFilter === "all" || candidate.status === statusFilter
      const matchesJob = jobFilter === "all" || candidate.position === jobFilter
      const matchesCountry = countryFilter === "all" || getCountryFromLocation(candidate.location) === countryFilter

      let matchesScore = true
      if (scoreFilter === "high") matchesScore = candidate.aiScore >= 9
      else if (scoreFilter === "medium") matchesScore = candidate.aiScore >= 7 && candidate.aiScore < 9
      else if (scoreFilter === "low") matchesScore = candidate.aiScore < 7

      return matchesSearch && matchesStatus && matchesJob && matchesScore && matchesCountry
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
  }, [candidates, searchTerm, statusFilter, jobFilter, scoreFilter, countryFilter, sortBy])

  // Pagination - moved before early returns
  const totalPages = Math.ceil(filteredAndSortedCandidates.length / CANDIDATES_PER_PAGE)
  const paginatedCandidates = filteredAndSortedCandidates.slice(
    (currentPage - 1) * CANDIDATES_PER_PAGE,
    currentPage * CANDIDATES_PER_PAGE,
  )

  // Stats dynamiques basées sur les filtres appliqués - moved before early returns
  const filteredStats = useMemo(() => {
    return {
      totalCandidates: filteredAndSortedCandidates.length,
      avgScore:
        filteredAndSortedCandidates.length > 0
          ? Math.round(
              filteredAndSortedCandidates.reduce((sum, c) => sum + c.aiScore, 0) / filteredAndSortedCandidates.length,
            )
          : 0,
      newApplications: filteredAndSortedCandidates.filter((c) => c.status === "New Application").length,
      interviewsScheduled: filteredAndSortedCandidates.filter((c) => c.status === "Interview Scheduled").length,
      uniqueCountries: [...new Set(filteredAndSortedCandidates.map((c) => getCountryFromLocation(c.location)))].length,
    }
  }, [filteredAndSortedCandidates])

  // Get unique values for filters - moved before early returns
  const statuses = candidates ? [...new Set(candidates.map((c) => c.status))] : []
  const positions = candidates ? [...new Set(candidates.map((c) => c.position))] : []
  const countries = candidates ? [...new Set(candidates.map((c) => getCountryFromLocation(c.location)))].sort() : []

  // Show loading state
  if (candidatesLoading || jobsLoading) {
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[
          { title: "Total Candidates", value: filteredStats.totalCandidates, icon: Users, color: "blue" },
          { title: "Avg. AI Score", value: `${filteredStats.avgScore}%`, icon: TrendingUp, color: "green" },
          { title: "New Applications", value: filteredStats.newApplications, icon: Clock, color: "amber" },
          { title: "Interviews", value: filteredStats.interviewsScheduled, icon: Calendar, color: "purple" },
          { title: "Countries", value: filteredStats.uniqueCountries, icon: Globe, color: "indigo" },
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
                  value: statusFilter,
                  onChange: setStatusFilter,
                  options: statuses,
                  placeholder: "Status",
                  width: "w-40",
                },
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
                  value: scoreFilter,
                  onChange: setScoreFilter,
                  options: ["high", "medium", "low"],
                  placeholder: "Score",
                  width: "w-32",
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

            {(searchTerm ||
              statusFilter !== "all" ||
              jobFilter !== "all" ||
              scoreFilter !== "all" ||
              countryFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
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
        </CardContent>
      </Card>

      {/* Candidate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {paginatedCandidates.map((candidate, index) => {
          const aiReport = generateAIReport(candidate)
          const isExpanded = expandedCandidate === candidate.id

          return (
            <Card
              key={candidate.id}
              className={`group hover:shadow-xl transition-all duration-300 border-0 shadow-md hover:-translate-y-1 animate-slideUp ${
                isExpanded ? "ring-2 ring-veo-green/30" : ""
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <CardContent className="p-6">
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
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download Resume
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
                      {candidate.skills.slice(0, 3).map((skill, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {candidate.skills.length > 3 && (
                        <Badge variant="secondary" className="text-xs bg-veo-green/10 text-veo-green">
                          +{candidate.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => toggleCandidateExpansion(candidate.id)}
                      className="flex-1 bg-veo-green hover:bg-veo-green/90 text-white shadow-sm hover:shadow-md transition-all"
                    >
                      <Brain className="h-3 w-3 mr-2" />
                      View Score
                      {isExpanded ? <ChevronUp className="h-3 w-3 ml-2" /> : <ChevronDown className="h-3 w-3 ml-2" />}
                    </Button>
                    <Button variant="outline" size="sm" className="hover:bg-gray-50 bg-transparent">
                      <MessageSquare className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Expanded Score Section */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 animate-slideDown">
                      {/* Job Applied and Score */}
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-bold text-blue-900 mb-1">Job Applied</h4>
                            <p className="text-sm text-blue-800">{candidate.position}</p>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-900">{candidate.aiScore}/10</div>
                            <div className="text-xs font-medium text-blue-700">Score</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
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
                setStatusFilter("all")
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
    </div>
  )
}
