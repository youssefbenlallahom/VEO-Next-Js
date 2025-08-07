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
      console.log(`🚀 Fetching reports for job: "${jobTitle}"`)
      const response = await apiService.searchCandidates({
        job_title: jobTitle,
        limit: 100
      })
      console.log(`📊 Backend returned ${response.candidates.length} reports`)
      console.log('📋 Reports:', response.candidates)
      setCandidateReports(response.candidates)
    } catch (err) {
      console.error('❌ Error fetching candidate reports:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch candidate reports')
    } finally {
      setLoading(false)
    }
  }

  return { candidateReports, loading, error, refetch: fetchReports }
}

// Helper function to merge candidate data with reports
export function mergeCandidateWithReport(candidate: any, reports: CandidateReport[]) {
  console.log(`🔍 Looking for candidate: "${candidate.name}"`)
  console.log(`📊 Available reports:`, reports.map(r => r.candidate_name))
  
  const report = reports.find(r => {
    const reportName = r.candidate_name.toLowerCase().trim()
    const candidateName = candidate.name.toLowerCase().trim()
    
    console.log(`🔄 Checking: "${candidateName}" vs "${reportName}"`)
    
    // Direct match
    if (reportName === candidateName) {
      console.log(`✅ Direct match found for: ${candidate.name}`)
      return true
    }
    
    // Check if names contain each other
    if (reportName.includes(candidateName) || candidateName.includes(reportName)) {
      console.log(`✅ Partial match found for: ${candidate.name}`)
      return true
    }
    
    // Split names and check for word matches (handle different name orders)
    const reportWords = reportName.split(/\s+/)
    const candidateWords = candidateName.split(/\s+/)
    
    // Check if all words from one name exist in the other (any order)
    const reportWordsInCandidate = reportWords.every((word: string) => 
      candidateWords.some((cWord: string) => cWord.includes(word) || word.includes(cWord))
    )
    const candidateWordsInReport = candidateWords.every((word: string) => 
      reportWords.some((rWord: string) => rWord.includes(word) || word.includes(rWord))
    )
    
    if (reportWordsInCandidate || candidateWordsInReport) {
      console.log(`✅ Word-based match found for: ${candidate.name}`)
      return true
    }
    
    return false
  })

  if (report) {
    console.log(`✅ Report found for ${candidate.name}:`, report)
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

  console.log(`❌ No report found for: ${candidate.name}`)
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
