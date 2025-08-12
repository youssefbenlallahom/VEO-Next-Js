"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Briefcase,
  Users,
  MapPin,
  Calendar,
  Search,
  Plus,
  TrendingUp,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Download,
  Archive,
  Edit,
  Globe,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useJobs, useCandidates } from "@/hooks/use-data"

const ITEMS_PER_PAGE = 6

export function JobsDashboard() {
  const { jobs, loading: jobsLoading, error: jobsError } = useJobs()
  const { candidates, loading: candidatesLoading } = useCandidates()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [countryFilter, setCountryFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState("postedDate")
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)
  const [extractResult, setExtractResult] = useState<any>(null)

  // Filter and sort jobs
  const filteredAndSortedJobs = useMemo(() => {
    if (!jobs || jobs.length === 0) return []
    
    const filtered = jobs.filter((job) => {
      const matchesSearch =
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || job.status === statusFilter
      const matchesDepartment = departmentFilter === "all" || job.department === departmentFilter
      const matchesPriority = priorityFilter === "all" || job.priority === priorityFilter

      // For country filtering, we'll use location for now
      const matchesCountry = countryFilter === "all" || job.location.includes(countryFilter)

      return matchesSearch && matchesStatus && matchesDepartment && matchesPriority && matchesCountry
    })

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "postedDate":
          return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
        case "applicants":
          return b.applicants - a.applicants
        case "title":
          return a.title.localeCompare(b.title)
        case "priority":
          const priorityOrder = { High: 3, Medium: 2, Low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        default:
          return 0
      }
    })

    return filtered
  }, [jobs, searchTerm, statusFilter, departmentFilter, priorityFilter, countryFilter, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedJobs.length / ITEMS_PER_PAGE)
  const paginatedJobs = filteredAndSortedJobs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // Stats dynamiques
  const filteredStats = useMemo(() => {
    const totalApplicants = filteredAndSortedJobs.reduce((sum, job) => sum + job.applicants, 0)
    const avgScore = candidates.length > 0
      ? Math.round(candidates.reduce((sum, candidate) => sum + candidate.aiScore, 0) / candidates.length)
      : 0

    return {
      totalJobs: filteredAndSortedJobs.length,
      activeJobs: filteredAndSortedJobs.filter((job) => job.status === "Open").length,
      totalApplicants,
      avgScore,
      pendingReviews: candidates.filter((candidate) => candidate.status === "New").length,
    }
  }, [filteredAndSortedJobs, candidates])

  // Get unique values for filters
  const departments = [...new Set(jobs.map((job) => job.department))]
  const statuses = [...new Set(jobs.map((job) => job.status))]
  const priorities = ["High", "Medium", "Low"]
  const countries = ["Tunisia", "France", "USA", "Canada"] // Add more as needed

  // Show loading state
  if (jobsLoading || candidatesLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show error state
  if (jobsError) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading jobs: {jobsError}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-emerald-50 text-emerald-700 border-emerald-200"
      case "Draft":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "Closed":
        return "bg-gray-50 text-gray-700 border-gray-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-red-50 text-red-700 border-red-200"
      case "Medium":
        return "bg-amber-50 text-amber-700 border-amber-200"
      case "Low":
        return "bg-blue-50 text-blue-700 border-blue-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col items-center justify-center text-center space-y-2 animate-slideDown">
  <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Job Openings</h1>
  
</div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger-children">
        {[
          {
            title: "Total Jobs",
            value: filteredStats.totalJobs,
            subtitle: `${filteredStats.activeJobs} active`,
            icon: Briefcase,
            color: "blue",
          },
          {
            title: "Applicants",
            value: filteredStats.totalApplicants,
            subtitle: "Total candidates",
            icon: Users,
            color: "green",
          },
          {
            title: "Avg. Score",
            value: `${filteredStats.avgScore}%`,
            subtitle: "AI quality",
            icon: TrendingUp,
            color: "purple",
          },
          { title: "Countries", value: countries.length, subtitle: "Global reach", icon: Globe, color: "indigo" },
        ].map((stat, index) => (
          <Card key={stat.title} className="hover-lift shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
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
      <Card className="shadow-soft animate-slideUp">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative form-field">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search jobs, departments, locations..."
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
                  width: "w-32",
                },
                {
                  value: departmentFilter,
                  onChange: setDepartmentFilter,
                  options: departments,
                  placeholder: "Department",
                  width: "w-40",
                },
                {
                  value: countryFilter,
                  onChange: setCountryFilter,
                  options: countries,
                  placeholder: "Country",
                  width: "w-36",
                },
              ].map((filter, index) => (
                <Select key={index} value={filter.value} onValueChange={filter.onChange}>
                  <SelectTrigger className={`${filter.width} h-12 border-gray-200 focus:border-veo-green hover-lift`}>
                    <SelectValue placeholder={filter.placeholder} />
                  </SelectTrigger>
                  <SelectContent className="animate-scaleIn">
                    <SelectItem value="all">All {filter.placeholder}</SelectItem>
                    {filter.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
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
              Showing {paginatedJobs.length} of {filteredAndSortedJobs.length} jobs
            </div>

            {(searchTerm || statusFilter !== "all" || departmentFilter !== "all" || countryFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setStatusFilter("all")
                  setDepartmentFilter("all")
                  setCountryFilter("all")
                  setCurrentPage(1)
                }}
                className="btn-secondary"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Extract Skills Button */}
      <div className="flex justify-end mb-4">
        <Button
          className="bg-veo-green hover:bg-veo-green/90 text-white"
          disabled={extracting}
          onClick={async () => {
            setExtracting(true)
            setExtractError(null)
            setExtractResult(null)
            try {
              const results: any[] = []
              for (const job of filteredAndSortedJobs) {
                const res = await fetch('/api/skills-from-cv', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ job_title: job.title, job_description: job.description }),
                })
                const data = await res.json()
                results.push({ job: job.title, skills: data })
              }
              setExtractResult(results)
            } catch (err: any) {
              setExtractError('Failed to extract skills for some jobs.')
            } finally {
              setExtracting(false)
            }
          }}
        >
          {extracting ? 'Extracting Skills...' : 'Extract Skills for All Jobs'}
        </Button>
      </div>

      {/* Optionally show results or error */}
      {extractError && <div className="text-red-600 mb-2">{extractError}</div>}
      {extractResult && (
        <div className="mb-4 p-4 bg-gray-50 border rounded">
          <h4 className="font-bold mb-2">Extracted Skills Results:</h4>
          <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(extractResult, null, 2)}</pre>
        </div>
      )}

      {/* Job Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {paginatedJobs.map((job, index) => (
          <Card
            key={job.id}
            className="card-hover shadow-soft border-0 animate-slideUp"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="space-y-2 flex-1">
                    <CardTitle className="text-xl text-gray-900 leading-tight hover:text-veo-green transition-colors mb-2">
                      {job.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(job.postedDate).toLocaleDateString('en-CA')}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="hover-scale">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="animate-scaleIn">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Archive className="mr-2 h-4 w-4" />
                        <span>Archive</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        <span>Export Applicants</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge className={`${getStatusColor(job.status)} border`}>{job.status}</Badge>
                  <Badge className={`${getPriorityColor(job.priority)} border`}>{job.priority}</Badge>
                  <Badge variant="secondary" className="border bg-gray-100 text-gray-700">{job.department}</Badge>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                  {job.description}
                </p>

                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 text-veo-green font-medium">
                      <Users className="h-4 w-4" />
                      <span>Applicants ({job.applicants})</span>
                    </div>
                    <span className="text-gray-500">{job.applicants} total</span>
                  </div>

                  {job.applicants > 0 ? (
                    <div className="flex -space-x-2 overflow-hidden mt-3">
                      {candidates
                        .filter(c => c.jobId === job.id)
                        .slice(0, 5)
                        .map(a => (
                          <Avatar key={a.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white">
                            <AvatarImage src={a.avatar} alt={a.name} />
                            <AvatarFallback>{a.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ))}
                      {job.applicants > 5 && (
                        <Avatar className="inline-block h-8 w-8 rounded-full ring-2 ring-white">
                          <AvatarFallback>+{job.applicants - 5}</AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No applicants yet</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Link href={`/job/${job.id}`} className="block">
                  <Button className="w-full btn-primary shadow-sm hover:shadow-md">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details & AI Analysis
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between animate-slideUp">
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
                    className={currentPage === pageNum ? "btn-primary" : "btn-secondary"}
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
              className="btn-secondary"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* No results */}
      {filteredAndSortedJobs.length === 0 && (
        <Card className="text-center py-16 animate-scaleIn">
          <CardContent>
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("all")
                setDepartmentFilter("all")
                setCountryFilter("all")
                setCurrentPage(1)
              }}
              className="btn-secondary"
            >
              Clear all filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
