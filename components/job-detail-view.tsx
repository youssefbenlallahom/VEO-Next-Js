"use client"

import React, { useState, useMemo } from "react"
import dynamic from 'next/dynamic'
import Link from "next/link"
import { useJobWithCandidates } from "@/hooks/use-data"
import { useCandidateReports, mergeCandidateWithReport } from "@/hooks/use-candidate-reports"
import { AIReportModal } from "@/components/ai-report-modal"
import { JobSkillsModal } from "@/components/job-skills-modal"
import { AssessmentCriteriaSidebar } from "@/components/assessment-criteria-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  Zap,
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
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react"

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

// Types for PDF viewer props
interface PDFViewerProps {
  cvUrl: string
  candidateName?: string
}

// Dynamic import for PDF viewer to avoid SSR issues
const PDFViewer = dynamic(() => import('./pdf-viewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading PDF Viewer...</p>
      </div>
    </div>
  )
}) as React.ComponentType<PDFViewerProps>

interface JobDetailViewProps {
  jobId: string
}

const CANDIDATES_PER_PAGE = 10

export function JobDetailView({ jobId }: JobDetailViewProps) {
  const { job, candidates, loading } = useJobWithCandidates(jobId)
  const { candidateReports, loading: reportsLoading } = useCandidateReports(job?.title)
  const [selectedApplicants, setSelectedApplicants] = useState<number[]>([])
  const [showJobSkillsModal, setShowJobSkillsModal] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  // Candidate filtering and pagination
  const [candidateSearch, setCandidateSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState("aiScore")
  const [aiReportCandidate, setAiReportCandidate] = useState<any | null>(null)
  const [viewingCV, setViewingCV] = useState<{candidateId: number, cvUrl: string} | null>(null)

  // Filter and sort candidates with real backend data
  const filteredAndSortedCandidates = useMemo(() => {
    if (!candidates) return []

    // Merge candidates with their AI reports from backend
    const candidatesWithReports = candidates.map(candidate => 
      mergeCandidateWithReport(candidate, candidateReports)
    )

    const filtered = candidatesWithReports.filter((candidate) => {
      const matchesSearch =
        candidate.name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        candidate.email.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        candidate.skills.some((skill: string) => skill.toLowerCase().includes(candidateSearch.toLowerCase()))

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
  }, [candidates, candidateReports, candidateSearch, sortBy])

  // Pagination for candidates
  const totalPages = Math.ceil(filteredAndSortedCandidates.length / CANDIDATES_PER_PAGE)
  const paginatedCandidates = filteredAndSortedCandidates.slice(
    (currentPage - 1) * CANDIDATES_PER_PAGE,
    currentPage * CANDIDATES_PER_PAGE,
  )

  // Show loading state
  if (loading || reportsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {loading ? "Loading job details..." : "Loading candidate reports..."}
          </p>
        </div>
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

  // Get job-specific assessment criteria
  const getJobAssessmentCriteria = () => {
    if (!job) return null
    
    const saved = JSON.parse(localStorage.getItem('job-skills-barems') || '[]')
    // Find criteria specifically for this job title
    const jobCriteria = saved.find((barem: any) => barem.jobTitle === job.title)
    return jobCriteria
  }

  // Direct analysis without showing modal
  const startDirectAnalysis = async () => {
    const criteria = getJobAssessmentCriteria()
    
    if (!criteria) {
      alert('No assessment criteria found for this job. Please configure job skills first.')
      return
    }

    console.log('🚀 STARTING DIRECT AI ANALYSIS!')
    console.log('📋 Using criteria for job:', job.title)
    
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    
    try {
      // Prepare barem data
      const baremData = {
        skills: criteria.skills,
        categorized_skills: criteria.categorizedSkills || {}
      }

      // Gather all selected CVs as blobs and send in one FormData
      const formData = new FormData()
      formData.append('job_title', job.title)
      formData.append('job_description', job.description)
      formData.append('barem', JSON.stringify(baremData))
      
      // Fetch and append all files
      let fileCount = 0
      for (let i = 0; i < selectedApplicants.length; i++) {
        const candidateId = selectedApplicants[i]
        const candidate = candidates.find((c: any) => c.id === candidateId)
        if (!candidate) continue
        
        // Get the CV URL (should be a static asset path)
        const cvUrl = getCVUrl(candidate).replace('/api/cv/', '/assets/jobs/')
        
        try {
          const response = await fetch(cvUrl)
          if (!response.ok) {
            console.warn('CV file not found:', cvUrl)
            continue
          }
          const blob = await response.blob()
          const filename = candidate.name.replace(/\s+/g, '_').toLowerCase() + '.pdf'
          formData.append('files', blob, filename)
          fileCount++
        } catch (e) {
          console.error('Error fetching CV file:', cvUrl, e)
        }
        setAnalysisProgress(Math.round(((i + 1) / selectedApplicants.length) * 80))
      }
      
      if (fileCount === 0) {
        alert('No CV files found. Make sure your CVs are in public/assets/jobs/<Job Title>/<filename>.pdf')
        setIsAnalyzing(false)
        return
      }
      
      console.log('📤 Sending analysis request with', fileCount, 'files')
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })
      
      if (!analyzeResponse.ok) {
        console.error('Analysis API failed:', analyzeResponse.status, analyzeResponse.statusText)
        const errorText = await analyzeResponse.text()
        console.error('Error response body:', errorText)
      } else {
        const analyzeResult = await analyzeResponse.json()
        console.log('✅ Analysis completed successfully')
        console.log('Analysis result:', analyzeResult)
      }
      setAnalysisProgress(100)
      
    } catch (err) {
      console.error('Error during AI analysis:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Analysis with existing barem function (kept for compatibility)
  const startAnalysisWithBarem = async (barem: any) => {
    console.log('🚀 STARTING AI ANALYSIS WITH BAREM!');
    console.log('📋 Using barem:', barem);
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    try {
      // Gather all selected CVs as blobs and send in one FormData
      const formData = new FormData();
      // Add job info
      formData.append('job_title', job.title);
      formData.append('job_description', job.description);
      formData.append('barem', JSON.stringify(barem));
      
      // Fetch and append all files
      let fileCount = 0;
      for (let i = 0; i < selectedApplicants.length; i++) {
        const candidateId = selectedApplicants[i];
        const candidate = candidates.find((c: any) => c.id === candidateId);
        if (!candidate) continue;
        
        // Get the CV URL (should be a static asset path)
        const cvUrl = getCVUrl(candidate).replace('/api/cv/', '/assets/jobs/');
        
        // Try to fetch the file as blob
        try {
          const response = await fetch(cvUrl);
          if (!response.ok) {
            console.warn('CV file not found:', cvUrl);
            continue;
          }
          const blob = await response.blob();
          // Use candidate name or id for filename
          const filename = candidate.name.replace(/\s+/g, '_').toLowerCase() + '.pdf';
          formData.append('files', blob, filename);
          fileCount++;
        } catch (e) {
          console.error('Error fetching CV file:', cvUrl, e);
        }
        setAnalysisProgress(Math.round(((i + 1) / selectedApplicants.length) * 80));
      }
      
      if (fileCount === 0) {
        alert('No CV files found. Make sure your CVs are in public/assets/jobs/<Job Title>/<filename>.pdf');
        setIsAnalyzing(false);
        return;
      }
      
      console.log('📤 Sending analysis request with', fileCount, 'files');
      const analyzeResponse = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });
      
      console.log('📥 Analysis response status:', analyzeResponse.status);
      
      if (!analyzeResponse.ok) {
        console.error('Analysis API failed:', analyzeResponse.status, analyzeResponse.statusText);
        const errorText = await analyzeResponse.text();
        console.error('Error response body:', errorText);
      } else {
        const analyzeResult = await analyzeResponse.json();
        console.log('✅ Analysis completed successfully');
        console.log('Analysis result:', analyzeResult);
      }
      setAnalysisProgress(100);
      
    } catch (err) {
      console.error('Error during AI analysis:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 9) return "bg-veo-green/20 text-veo-green border-veo-green/30"
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
        return "bg-veo-green/10 text-veo-green border-veo-green/30"
      case "Offer Extended":
        return "bg-veo-green/20 text-veo-green border-veo-green/40"
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

  const toggleAiReport = (candidate: any) => {
    setAiReportCandidate(aiReportCandidate && aiReportCandidate.id === candidate.id ? null : candidate)
  }

  const getCVUrl = (candidate: any) => {
    // Mapping of mock candidate names to actual PDF filenames
    const nameToFileMap: Record<string, string> = {
      // HR Data Analyst candidates
      "Sarah Johnson": "arwa-lassoued-cv.pdf",
      "Michael Chen": "baha-kahri-cv.pdf", 
      "David Kim": "baha-khemiri-cv.pdf",
      "Emily Rodriguez": "ferchichi-mehdi-cv.pdf",
      "Lisa Thompson": "ghassen-bouzayen-cv.pdf",
      "Alex Martinez": "imen-zarai-cv.pdf",
      "James Wilson": "kais-garci-cv.pdf",
      "Maria Garcia": "lamia-cherni-cv.pdf",
      "Robert Brown": "mahdi-abdelhedi-cv.pdf",
      "Jennifer Davis": "mohamed-gharghari-el-ayech-cv.pdf",
      "John Smith": "rim-jamli-cv.pdf",
      "Linda Wang": "safa-ochi-cv.pdf",
    };
    
    // Use mapping if available, otherwise try to convert name
    const fileName = nameToFileMap[candidate.name] || 
      (candidate.name.toLowerCase().replace(/\s+/g, '-') + '-cv.pdf');
    
    // Use the API route to serve the CV
    const jobTitle = job?.title || '';
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
                      onClick={() => setShowJobSkillsModal(true)}
                      variant="outline"
                      className="btn-secondary shadow-sm hover:shadow-md"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      {(() => {
                        // Check if assessment criteria exist for this job
                        try {
                          const saved = JSON.parse(localStorage.getItem('job-skills-barems') || '[]')
                          const hasAssessment = saved.find((barem: any) => barem.jobTitle === job.title)
                          return hasAssessment ? 'Modify Assessment' : 'Configure Job Skills'
                        } catch {
                          return 'Configure Job Skills'
                        }
                      })()}
                    </Button>
                    <Button
                      onClick={startDirectAnalysis}
                      disabled={selectedApplicants.length === 0}
                      className="btn-primary shadow-sm hover:shadow-md"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Start AI Analysis
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
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 text-lg">{applicant.name}</h4>
                          <div className="flex items-center gap-2">
                            {applicant.hasAIReport ? (
                              <Badge className={`${getScoreColor(applicant.aiScore)} border font-bold`}>
                                {applicant.aiScore}/10
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-gray-300 text-gray-500">
                                Not Analyzed
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 mb-3">
                          <span className="font-medium">{applicant.email}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {applicant.skills.slice(0, 4).map((skill: string, index: number) => (
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
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="btn-secondary bg-transparent"
                            onClick={() => viewCV(applicant)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Resume
                          </Button>
                          {applicant.hasAIReport ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => toggleAiReport(applicant)}
                              className="btn-secondary bg-transparent"
                              title="View AI Report"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              AI Report
                            </Button>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              disabled
                              className="btn-secondary bg-transparent opacity-50"
                              title="No AI analysis available"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Not Analyzed
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

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

        {/* Quick Stats and Actions Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          {/* Quick Stats */}
          {job && (
            <Card className="shadow-soft animate-slideUp" style={{ animationDelay: "0.4s" }}>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Applicants</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {candidates.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Analyzed</span>
                  <Badge variant="secondary" className="bg-veo-green/20 text-veo-green">
                    {filteredAndSortedCandidates.filter(c => c.aiScore !== undefined).length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending</span>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    {filteredAndSortedCandidates.filter(c => c.aiScore === undefined).length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">High Scores (8+)</span>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                    {filteredAndSortedCandidates.filter(c => c.aiScore && c.aiScore >= 8).length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assessment Criteria */}
          {job && (
            <AssessmentCriteriaSidebar
              jobTitle={job.title}
              onConfigureClick={() => setShowJobSkillsModal(true)}
            />
          )}

          {/* Actions */}
          {job && (
            <Card className="shadow-soft animate-slideUp" style={{ animationDelay: "0.5s" }}>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start btn-secondary"
                  onClick={() => {
                    const csvContent = [
                      ['Name', 'Email', 'Score', 'Skills'].join(','),
                      ...filteredAndSortedCandidates.map(c => 
                        [c.name, c.email, c.aiScore || 'N/A', c.skills.join(';')].join(',')
                      )
                    ].join('\n')
                    
                    const blob = new Blob([csvContent], { type: 'text/csv' })
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `${job.title.replace(/\s+/g, '_')}_candidates.csv`
                    a.click()
                    window.URL.revokeObjectURL(url)
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start btn-secondary"
                  onClick={() => {
                    if (selectedApplicants.length === 0) {
                      alert('Please select candidates first')
                      return
                    }
                    alert(`Starting batch analysis for ${selectedApplicants.length} candidates`)
                  }}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Batch Analyze Selected
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Job Skills Configuration Modal */}
      <JobSkillsModal
        isOpen={showJobSkillsModal}
        onClose={() => setShowJobSkillsModal(false)}
        job={job}
      />

      {/* Analysis Progress Modal */}
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="fixed inset-4 flex items-center justify-center">
            <div className="w-full max-w-md animate-scaleIn">
              <Card className="bg-white shadow-2xl border-0">
                <CardContent className="p-6">
                  <div className="text-center">
                    <div className="relative mx-auto w-20 h-20 mb-6">
                      <div className="absolute inset-0 border-4 border-green-600/20 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                      <Brain className="absolute inset-0 m-auto h-8 w-8 text-green-600 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">AI Analysis in Progress</h3>
                    <p className="text-gray-600 mb-6">
                      Evaluating candidates using your assessment criteria
                    </p>

                    <div className="max-w-sm mx-auto">
                      <div className="flex justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>{analysisProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-full bg-green-600 rounded-full transition-all duration-300"
                          style={{ width: `${analysisProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
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
            </DialogTitle>
          </DialogHeader>

          {/* CV Content */}
          <div className="flex-1 bg-gray-50">
            <div className="h-[calc(90vh-60px)] bg-white">
              {viewingCV && (
                <PDFViewer 
                  cvUrl={viewingCV.cvUrl}
                  candidateName={paginatedCandidates.find(c => c.id === viewingCV.candidateId)?.name}
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
    </div>
  )
}
