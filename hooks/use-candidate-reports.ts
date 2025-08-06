import { useState, useEffect } from 'react'
import { apiService, CandidateReport } from '@/lib/api-service'

// Hook to fetch candidate reports for a specific job
export function useCandidateReports(jobTitle?: string) {
  const [candidateReports, setCandidateReports] = useState<CandidateReport[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (jobTitle) {
      fetchReports()
    }
  }, [jobTitle])

  const fetchReports = async () => {
    if (!jobTitle) return

    try {
      setLoading(true)
      setError(null)
      const response = await apiService.searchCandidates({
        job_title: jobTitle,
        limit: 100
      })
      setCandidateReports(response.candidates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch candidate reports')
    } finally {
      setLoading(false)
    }
  }

  return { candidateReports, loading, error, refetch: fetchReports }
}

// Helper function to merge candidate data with reports
export function mergeCandidateWithReport(candidate: any, reports: CandidateReport[]) {
  const report = reports.find(r => 
    r.candidate_name.toLowerCase().includes(candidate.name.toLowerCase()) ||
    candidate.name.toLowerCase().includes(r.candidate_name.toLowerCase())
  )

  if (report) {
    return {
      ...candidate,
      aiScore: Math.round(report.total_weighted_score * 10) / 10, // Convert to 0-10 scale if needed
      actualScore: report.total_weighted_score,
      hasAIReport: true,
      reportId: report.id,
      strengths: report.strengths,
      gaps: report.gaps,
      scoreDetails: report.score_details,
      reportDate: report.created_at
    }
  }

  return {
    ...candidate,
    aiScore: 0,
    hasAIReport: false,
    reportId: null,
    strengths: [],
    gaps: [],
    scoreDetails: null,
    reportDate: null
  }
}
