"use client"

import React, { useState, useMemo, useEffect } from "react"
import dynamic from 'next/dynamic'
import Link from "next/link"
import { useJobWithCandidates } from "@/hooks/use-data"
import { useAllCandidates } from "@/hooks/use-backend-api"
import { useCandidateReports, mergeCandidateWithReport } from "@/hooks/use-candidate-reports"
import { AIReportModal } from "@/components/ai-report-modal"
import { JobSkillsModal } from "@/components/job-skills-modal"
import { AssessmentCriteriaSidebar } from "@/components/assessment-criteria-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
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
  Heart,
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
const SUGGESTED_ID_OFFSET = 100000

export function JobDetailView({ jobId }: JobDetailViewProps) {
  const { job, candidates, loading } = useJobWithCandidates(jobId)
  const { candidateReports, loading: reportsLoading } = useCandidateReports(job?.title)
  const [selectedApplicants, setSelectedApplicants] = useState<number[]>([])
  const [showJobSkillsModal, setShowJobSkillsModal] = useState(false)
  const [assessmentCriteriaKey, setAssessmentCriteriaKey] = useState(0) // For forcing re-render
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  // Candidate filtering and pagination
  const [candidateSearch, setCandidateSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState("aiScore")
  const [aiReportCandidate, setAiReportCandidate] = useState<any | null>(null)
  const [viewingCV, setViewingCV] = useState<{candidateId: number, cvUrl: string} | null>(null)
  // Favorites
  const [favoriteIds, setFavoriteIds] = useState<number[]>([])
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  // Extracted skills from backend
  const [extractedSkillsMap, setExtractedSkillsMap] = useState<Record<string, string[]>>({})
  const [extractedSkillsFullMap, setExtractedSkillsFullMap] = useState<Record<string, Record<string, string[]>>>({})
  // Skill details dialog state
  const [selectedSkill, setSelectedSkill] = useState<{candidateName: string, skillKey: string} | null>(null)
  // Recommendation state: only for cross-job suggestions (non-applicants)
  const { candidates: allCandidates, loading: allCandidatesLoading } = useAllCandidates()
  const [autoMatchedJobId, setAutoMatchedJobId] = useState<string | null>(null)
  // Cross-job suggestions (non-applicants)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [suggestedCandidates, setSuggestedCandidates] = useState<any[]>([])
  const [suggestProgress, setSuggestProgress] = useState<{ processed: number; total: number }>({ processed: 0, total: 0 })
  // User-managed additions from recommendations
  const [addedCandidates, setAddedCandidates] = useState<any[]>([])
  const [selectedSuggested, setSelectedSuggested] = useState<number[]>([])

  // Load Favorites from localStorage per job
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`job-favorites:${jobId}`)
      if (saved) setFavoriteIds(JSON.parse(saved))
    } catch {}
  }, [jobId])

  // Persist Favorites
  useEffect(() => {
    try {
      localStorage.setItem(`job-favorites:${jobId}`, JSON.stringify(favoriteIds))
    } catch {}
  }, [favoriteIds, jobId])

  const toggleFavorite = (id: number) => {
    setFavoriteIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  // Fetch extracted skills from backend (like All Candidates page)
  useEffect(() => {
    let active = true
    const fetchSkills = async () => {
      try {
        const res = await fetch('/api/display-skills')
        if (!res.ok) return
        const data = await res.json()
        const map: Record<string, string[]> = {}
        const full: Record<string, Record<string, string[]>> = {}
        if (data?.candidates) {
          data.candidates.forEach((c: any) => {
            if (c?.candidate_name && c?.skills && typeof c.skills === 'object' && !Array.isArray(c.skills)) {
              map[c.candidate_name] = Object.keys(c.skills)
              full[c.candidate_name] = c.skills as Record<string, string[]>
            }
          })
        }
        if (active) {
          setExtractedSkillsMap(map)
          setExtractedSkillsFullMap(full)
        }
      } catch {
        // silent fail
      }
    }
    fetchSkills()
    return () => { active = false }
  }, [])

  // Pool now comes from useAllCandidates hook (merged assets + DB)

  // Build categorized job skills using job-skills API
  const getJobSkillsCategorized = async (): Promise<Record<string, string[]> | null> => {
    // First, try saved criteria
    const criteria = getJobAssessmentCriteria()
    if (criteria) {
      if (criteria.categorizedSkills && typeof criteria.categorizedSkills === 'object') {
        return criteria.categorizedSkills as Record<string, string[]>
      }
      if (Array.isArray(criteria.skills)) {
        return { General: criteria.skills as string[] }
      }
    }
    
    // Try to get skills from job-skills API if we have a job title
    if (job?.title) {
      try {
        const res = await fetch(`/api/job-skills/${encodeURIComponent(job.title)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        
        if (res.ok) {
          const data = await res.json()
          // The API returns the required_skills directly as categorized skills
          if (data && typeof data === 'object') {
            console.log('📋 Job skills fetched from API:', data)
            return data as Record<string, string[]>
          }
        } else if (res.status === 404) {
          console.warn('No skills data found for job title:', job.title)
        } else {
          console.warn('Job skills API request failed:', res.status)
        }
      } catch (error) {
        console.warn('Error fetching job skills from API:', error)
      }
    }
    
    // As a fallback, derive skills from job requirements text by tokenizing keywords
    if (job?.requirements?.length) {
      // Filter out common stopwords/noise to keep only meaningful skill tokens
      const stopwords = new Set([
        'and','or','the','to','of','in','on','for','with','a','an','is','are','be','as','by','at','from','that','this','their','our','your','you','we','it','into','across','per','within','using','use','used','can','will','should','must','have','has','had','including','include','includes','etc','i.e','e.g','such','ability','able','years','year','minimum','plus','level','experience','experiences','field','related','degree','bachelor','master','preferred','strong','excellent','good','great','solid','skills','skill','knowledge','understanding','familiarity','proficiency','proficient','background','capability','capabilities','responsibilities','responsibility','tasks','duties','requirements','requirement','candidate','candidates','communication','problem','solving','critical','thinking','detail','attention','management','processes','process','techniques','technique','statistical','statistics','professional'
      ])
      const tokens = new Set<string>()
      job.requirements.forEach(req => {
        String(req)
          .toLowerCase()
          .split(/[^a-zA-Z0-9+#.]+/)
          .filter(Boolean)
          .forEach(tok => {
            // Keep alphanumerics and tech tokens like c#, c++ as 'c#' or 'c++' are excluded by our split; allow sql, python, power, bi, etc.
            const cleaned = tok.replace(/^\d+$/, '') // drop pure numbers
            if (!cleaned || cleaned.length < 3) return
            if (stopwords.has(cleaned)) return
            tokens.add(cleaned)
          })
      })
      const guess = Array.from(tokens)
      if (guess.length) return { General: guess }
    }
    return null
  }

  // Old fuzzy/synonym-based matching removed

  // Build categorized skills for a candidate from extracted skills or fallback UI skills
  const getCategorizedSkillsForCandidate = (cand: any): Record<string, string[]> => {
    const skillKey = Object.keys(extractedSkillsFullMap).find(k => k.toLowerCase() === String(cand.name).toLowerCase())
    const fallbackSkills = (Array.isArray((cand as any).uiSkills) ? (cand as any).uiSkills : cand.skills) || []
    const candidateSkillsCategorizedRaw: Record<string, string[]> = skillKey
      ? extractedSkillsFullMap[skillKey]
      : { General: fallbackSkills as string[] }
    const cleaned: Record<string, string[]> = Object.fromEntries(
      Object.entries(candidateSkillsCategorizedRaw).map(([k, arr]) => [
        k,
        (arr || []).filter(s => !!s && s.trim() && s.trim().toLowerCase() !== 'to be determined')
      ])
    )
    return cleaned
  }

  // Find recommended non-applicants using the multi endpoint
  const runCrossJobRecommendations = async () => {
    console.log('🔍 Starting cross-job recommendations...')
    
    // Get job skills from API first
    const jobSkills = await getJobSkillsCategorized()
    if (!jobSkills) {
      console.warn('❌ No job skills found, cannot run recommendations')
      return
    }
    
    console.log('✅ Job skills loaded:', jobSkills)
    if (!job?.title) {
      console.warn('❌ Job title is missing, cannot run recommendations')
      return
    }
    
    if (!allCandidates || !candidates) {
      console.warn('❌ Candidates data not ready')
      return
    }

    // Pool = all candidates not already applied to this job (compare by name, case-insensitive)
    const appliedNames = new Set((candidates || []).map(c => String(c.name).toLowerCase()))
    const pool = (allCandidates || []).filter(c => !appliedNames.has(String(c.name).toLowerCase()))
    if (pool.length === 0) {
      console.warn('❌ No candidate pool available for recommendations')
      return
    }

    console.log(`🎯 Found ${pool.length} candidates in pool for matching`)
    
    setIsSuggesting(true)
    setSuggestProgress({ processed: 0, total: 1 }) // Single multi-call

    // Prepare payload for multi endpoint
    const multiPayload = {
      job_title: job.title,
      candidates: pool.map(c => ({ name: c.name, skills: getCategorizedSkillsForCandidate(c) })),
      job_skills: jobSkills,
      threshold: 40,
      debug: false,
    }

    console.log('📤 Sending to skill-match-multi API with payload:', {
      candidateCount: multiPayload.candidates.length,
      jobSkills: Object.keys(jobSkills),
      threshold: multiPayload.threshold
    })

    try {
      const res = await fetch('/api/skill-match-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(multiPayload),
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        console.error('❌ Multi HTTP error:', res.status, txt)
        return
      }
      const data = await res.json()
      const matchedNames: string[] = Array.isArray(data?.matched_candidates) ? data.matched_candidates : []
      const matchedSet = new Set(matchedNames.map((n: string) => String(n).toLowerCase()))
      const matchedCandidates = pool.filter(c => matchedSet.has(String(c.name).toLowerCase()))

      console.log(`✅ Skill matching complete: ${matchedCandidates.length} candidates matched`)
      
      setSuggestProgress({ processed: 1, total: 1 }) // Complete

      // Save suggestions (no need for individual detailed matching)
      setSuggestedCandidates(matchedCandidates)
    } catch (e) {
      console.error('❌ Multi error:', String(e))
    } finally {
      setIsSuggesting(false)
    }
  }

  // Load any previously added candidates for this job from localStorage once candidates and allCandidates are ready
  useEffect(() => {
    if (!job?.id) return
    if (!allCandidates || allCandidates.length === 0) return
    try {
      const raw = localStorage.getItem(`job-added-candidates:${job.id}`)
      if (!raw) return
      const names: string[] = JSON.parse(raw)
      const appliedNames = new Set((candidates || []).map(c => String(c.name).toLowerCase()))
      const picked = names
        .map(n => allCandidates.find(ac => ac.name.toLowerCase() === n.toLowerCase()))
        .filter(Boolean)
        .filter((c: any) => !appliedNames.has(String(c!.name).toLowerCase()))
        .map((c: any) => ({ ...c, id: (c.id ?? 0) + SUGGESTED_ID_OFFSET, isAddedFromSuggestions: true }))
      setAddedCandidates(picked as any[])
    } catch {}
  }, [job?.id, allCandidates, candidates])

  // Persist additions by name only
  useEffect(() => {
    if (!job?.id) return
    try {
      const names = addedCandidates.map(c => c.name)
      localStorage.setItem(`job-added-candidates:${job.id}`, JSON.stringify(names))
    } catch {}
  }, [addedCandidates, job?.id])

  const addSuggestedCandidate = (cand: any) => {
    // Avoid duplicates
    if (addedCandidates.some(c => c.name.toLowerCase() === cand.name.toLowerCase())) return
    const enhanced = { ...cand, id: (cand.id ?? 0) + SUGGESTED_ID_OFFSET, isAddedFromSuggestions: true }
    setAddedCandidates(prev => [...prev, enhanced])
  }

  const removeAddedCandidate = (cand: any) => {
    setAddedCandidates(prev => prev.filter(c => c.name.toLowerCase() !== String(cand.name).toLowerCase()))
    setSelectedApplicants(prev => prev.filter(id => id !== ((cand.id ?? 0) + SUGGESTED_ID_OFFSET)))
  }

  // Auto-run only cross-job recommendations once per job when data is ready
  useEffect(() => {
    if (!job?.id) return
    if (autoMatchedJobId === job.id) return
    if (!candidates || candidates.length === 0) return
    
    // Check if we have job skills configured (async)
    ;(async () => {
      try {
        const jobSkills = await getJobSkillsCategorized()
        if (!jobSkills) {
          console.log('⏳ No job skills available yet, skipping auto-recommendations')
          return
        }
        
        console.log('🚀 Auto-running cross-job recommendations for job:', job.title)
        // Only run cross-job recommendations, not matching for current applicants
        await runCrossJobRecommendations()
      } finally {
        setAutoMatchedJobId(job.id)
      }
    })()
  }, [job?.id, allCandidatesLoading, allCandidates])
  // Build skills from score details
  const extractSkillsFromScoreDetails = (scoreDetails: any): string[] => {
    if (!scoreDetails) return []
    const src = scoreDetails.skills_breakdown || scoreDetails.hard_skills || scoreDetails.top_skills || scoreDetails.skills
    if (!src) return []
    let skills: string[] = []

    if (Array.isArray(src)) {
      skills = src
        .map((item: any) => {
          if (typeof item === 'string') return item
          if (typeof item === 'object' && item) return item.skill || item.name || item.title || ''
          return ''
        })
        .filter(Boolean)
    } else if (typeof src === 'object') {
      skills = Object.keys(src)
    }
    return Array.from(new Set(skills.map(s => String(s).trim()).filter(Boolean)))
  }

  // Filter and sort candidates with real backend data (including suggestions)
  const filteredAndSortedCandidates = useMemo(() => {
    if (!candidates) return []

    // Base candidates (applied to this job)
    const baseCandidates = candidates.map(candidate => {
      const merged: any = mergeCandidateWithReport(candidate, candidateReports)
      const extracted = extractedSkillsMap[merged.name] || []
      const reportSkills = extractSkillsFromScoreDetails(merged.scoreDetails)
      const uiSkills = extracted.length ? extracted : (reportSkills.length ? reportSkills : merged.skills)
      // Don't add matchInfo for actual applicants - they should show "Applied", not "Recommended"
      return { ...merged, uiSkills, matchInfo: null, isApplied: true }
    })
    // Added candidates from recommendations (treated as part of this list)
    const added = (addedCandidates || []).map(sc => {
      const merged: any = mergeCandidateWithReport(sc, candidateReports)
      const extracted = extractedSkillsMap[merged.name] || []
      const reportSkills = extractSkillsFromScoreDetails(merged.scoreDetails)
      const uiSkills = extracted.length ? extracted : (reportSkills.length ? reportSkills : merged.skills)
      return { ...merged, uiSkills, isAddedFromSuggestions: true }
    })
    
    // Recommended candidates from other jobs (not yet added)
    const appliedNames = new Set((candidates || []).map(c => c.name.toLowerCase()))
    const addedNames = new Set(addedCandidates.map(c => c.name.toLowerCase()))
    const recommended = (suggestedCandidates || [])
      .filter(c => !appliedNames.has(c.name.toLowerCase()))
      .filter(c => !addedNames.has(c.name.toLowerCase()))
      .map(sc => {
        const merged: any = mergeCandidateWithReport(sc, candidateReports)
        const extracted = extractedSkillsMap[merged.name] || []
        const reportSkills = extractSkillsFromScoreDetails(merged.scoreDetails)
        const uiSkills = extracted.length ? extracted : (reportSkills.length ? reportSkills : merged.skills)
        return { 
          ...merged, 
          uiSkills, 
          isRecommended: true, // Multi-endpoint already filtered, so all are recommended
          id: (merged.id ?? 0) + SUGGESTED_ID_OFFSET // Ensure unique IDs
        }
      })
    
    const mergedList = [...baseCandidates, ...added, ...recommended]

    const filtered = mergedList.filter((candidate: any) => {
      const skillsArr: string[] = (candidate as any).uiSkills || candidate.skills || []
      const matchesSearch =
        candidate.name.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        candidate.email.toLowerCase().includes(candidateSearch.toLowerCase()) ||
        (candidate.position || '').toLowerCase().includes(candidateSearch.toLowerCase()) ||
        skillsArr.some((skill: string) => skill.toLowerCase().includes(candidateSearch.toLowerCase()))

      const matchesFavorite = !favoritesOnly || favoriteIds.includes(candidate.id)
      return matchesSearch && matchesFavorite
    })

    // Sort candidates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "aiScore":
          return (b.aiScore ?? -Infinity) - (a.aiScore ?? -Infinity)
        case "favorites": {
          const favA = favoriteIds.includes(a.id) ? 1 : 0
          const favB = favoriteIds.includes(b.id) ? 1 : 0
          return favB - favA || ((b.aiScore ?? -Infinity) - (a.aiScore ?? -Infinity))
        }
        case "name":
          return a.name.localeCompare(b.name)
        case "appliedDate":
          return new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
        default:
          return 0
      }
    })

  return filtered
  }, [candidates, candidateReports, extractedSkillsMap, candidateSearch, sortBy, favoritesOnly, favoriteIds, addedCandidates, suggestedCandidates])

  // Sorted suggestions list (exclude already added and already applied)
  // Suggestions removed in this flow

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

  // Get job-specific assessment criteria (function declaration for hoisting)
  function getJobAssessmentCriteria() {
    if (!job) return null
    const saved = JSON.parse(localStorage.getItem('job-skills-barems') || '[]')
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
      // Compose complete list including added candidates
      const fullList = [...(candidates as any[]), ...addedCandidates]
      for (let i = 0; i < selectedApplicants.length; i++) {
        const candidateId = selectedApplicants[i]
        const candidate = fullList.find((c: any) => c.id === candidateId)
        if (!candidate) continue
        
        // Get the CV URL using the API route
        const cvUrl = getCVUrl(candidate)
        
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
      const fullList = [...(candidates as any[]), ...addedCandidates]
      for (let i = 0; i < selectedApplicants.length; i++) {
        const candidateId = selectedApplicants[i];
        const candidate = fullList.find((c: any) => c.id === candidateId);
        if (!candidate) continue;
        
        // Get the CV URL using the API route
        const cvUrl = getCVUrl(candidate);
        
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
    // Prefer resumeUrl if provided (from merged data)
    if (candidate.resumeUrl) {
      const safe = candidate.resumeUrl.startsWith('/api/cv/') ? candidate.resumeUrl : `/api/cv/${encodeURIComponent(candidate.position || job?.title || '')}/${candidate.resumeUrl.split('/').pop()}`
      return safe
    }
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
      // Senior BI Developer candidates
      "Arwa Lassoued": "omri-amal-cv.pdf",
      "Ourighmi Saif": "ourighmi-saif-cv.pdf",
    };
    
    // Use mapping if available, otherwise try to convert name
    const fileName = nameToFileMap[candidate.name] || 
      (candidate.name.toLowerCase().replace(/\s+/g, '-') + '-cv.pdf');
    
    // Use the API route to serve the CV
  // If candidate is from another job, use their position as folder
  const jobTitle = (candidate.position && candidate.position !== job?.title) ? candidate.position : (job?.title || '')
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

                {/* Suggested candidates panel will appear in Applicants section below */}

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

                  <div className="flex gap-3 items-center">
                    {[
                      {
                        value: sortBy,
                        onChange: setSortBy,
                        options: ["aiScore", "name", "appliedDate", "favorites"],
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
                                    : option === "aiScore"
                                      ? "Score"
                                      : option === "appliedDate"
                                        ? "Applied Date"
                                        : option === "favorites"
                                          ? "Favorites First"
                                        : option === "name"
                                          ? "Name"
                                          : option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ))}

                    {/* Favorites only toggle */}
                    <button
                      type="button"
                      onClick={() => setFavoritesOnly(v => !v)}
                      className={`flex items-center gap-2 px-3 h-10 rounded-md border transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-veo-green/30 ${favoritesOnly ? 'bg-pink-50 text-pink-600 border-pink-200' : 'bg-white text-gray-700 border-gray-200 hover:border-veo-green/40'}`}
                      title={favoritesOnly ? 'Showing favorites only' : 'Show favorites only'}
                      aria-pressed={favoritesOnly}
                    >
                      <Heart className={`h-4 w-4 ${favoritesOnly ? 'text-pink-600' : 'text-gray-500'}`} fill={favoritesOnly ? 'currentColor' : 'none'} />
                      <span className="text-sm font-medium">Favorites only</span>
                    </button>

                    
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
                      className={`relative flex items-center gap-4 p-4 rounded-lg transition-all duration-200 animate-slideUp border border-gray-200 bg-white hover:shadow-md hover:border-veo-green/30`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <Checkbox
                        checked={selectedApplicants.includes(applicant.id)}
                        onCheckedChange={(checked) => handleApplicantSelect(applicant.id, checked as boolean)}
                      />
                      {/* Avatar */}
                      <Avatar className={`h-12 w-12 ring-2 transition-all ring-gray-100 hover:ring-veo-green/30`}>
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
                            {/* Applied badge for actual applicants */}
                            {applicant.isApplied && (
                              <Badge className="bg-blue-100 text-blue-700 border-blue-200" title="Applied to this job">
                                Applied
                              </Badge>
                            )}
                            {/* Recommended badge for cross-job recommendations */}
                            {applicant.isRecommended && (
                              <Badge className="bg-purple-100 text-purple-700 border-purple-200" title="Recommended from other jobs">
                                Recommended
                              </Badge>
                            )}
                            {/* Added from suggestions tag */}
                            {applicant.isAddedFromSuggestions && (
                              <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200" title="Added from recommendations">
                                Added
                              </Badge>
                            )}
                            {/* Favorite toggle */}
                            <button
                              type="button"
                              onClick={() => toggleFavorite(applicant.id)}
                              className={`p-2 rounded-full border transition-all duration-200 hover:shadow-sm ${favoriteIds.includes(applicant.id) ? 'bg-pink-50 border-pink-200' : 'bg-white border-gray-200 hover:border-veo-green/40'}`}
                              aria-label={favoriteIds.includes(applicant.id) ? 'Unfavorite candidate' : 'Favorite candidate'}
                              title={favoriteIds.includes(applicant.id) ? 'Remove from favorites' : 'Add to favorites'}
                            >
                              <Heart
                                className={`h-4 w-4 ${favoriteIds.includes(applicant.id) ? 'text-pink-600' : 'text-gray-500'}`}
                                fill={favoriteIds.includes(applicant.id) ? 'currentColor' : 'none'}
                              />
                            </button>
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
                        {/* Simplified: no progress or extra badges */}
                        <div className="grid grid-cols-1 gap-2 text-sm text-gray-600 mb-3">
                          <span className="font-medium">{applicant.email}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {(applicant.uiSkills || applicant.skills || []).slice(0, 4).map((skill: string, index: number) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setSelectedSkill({ candidateName: applicant.name, skillKey: skill })}
                              className="rounded-md focus:outline-none focus:ring-2 focus:ring-veo-green/30"
                              title={`View details for ${skill}`}
                            >
                              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">
                                {skill}
                              </Badge>
                            </button>
                          ))}
                          {((applicant.uiSkills || applicant.skills || []).length > 4) && (
                            <Badge variant="secondary" className="text-xs bg-veo-green/10 text-veo-green">
                              +{(applicant.uiSkills || applicant.skills || []).length - 4}
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
                              title="View Report"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              Report
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
                  <span className="text-sm text-gray-600">Recommended</span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    {filteredAndSortedCandidates.filter(c => c.isRecommended).length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Favorites</span>
                  <Badge variant="secondary" className="bg-pink-50 text-pink-700">
                    {favoriteIds.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Added from Recos</span>
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                    {addedCandidates.length}
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
              key={assessmentCriteriaKey}
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
                  onClick={() => runCrossJobRecommendations()}
                  disabled={isSuggesting}
                  title="Re-run recommendations"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  {isSuggesting ? 'Finding Candidates...' : 'Re-run Recommendations'}
                </Button>
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
        onCriteriaSaved={() => {
          setAssessmentCriteriaKey(prev => prev + 1) // Force refresh of assessment criteria
        }}
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
              {(extractedSkillsFullMap[selectedSkill.candidateName]?.[selectedSkill.skillKey] || []).length > 0 ? (
                (extractedSkillsFullMap[selectedSkill.candidateName]?.[selectedSkill.skillKey] || []).map((val: string, idx: number) => (
                  <div key={idx} className="px-3 py-2 bg-gray-100 rounded text-gray-800 text-sm">
                    {val}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-600">
                  No details available for this skill.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
