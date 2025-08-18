import { useState, useEffect } from 'react'
import { 
  apiService, 
  CandidateReport
} from '@/lib/api-service'

// Infer skills from a job title for candidates without AI analysis
function inferSkillsFromJobTitle(jobTitle: string) {
  const skillMap: Record<string, string[]> = {
    'SAP ABAP Developer': ['SAP ABAP', 'SAP HANA', 'SAP Fiori', 'SQL', 'ABAP Development', 'SAP Modules'],
    'HR Data Analyst': ['Human Resources', 'Data Analysis', 'Excel', 'HRIS', 'Recruitment', 'Employee Relations', 'Reporting', 'KPI Development'],
    'Technical Consultant': ['Technical Consulting', 'System Analysis', 'Project Management', 'Client Relations'],
    'Senior BI Developer': ['Business Intelligence', 'SQL', 'ETL', 'Data Warehousing', 'Power BI', 'Tableau'],
    'Supplier Accountant': ['Accounting', 'Supplier Management', 'Financial Analysis', 'SAP', 'Excel'],
    'Data Analyst': ['SQL', 'Excel', 'Reporting', 'Dashboards', 'Data Visualization', 'Power BI']
  }

  // Best-effort exact or contains match
  for (const [key, skills] of Object.entries(skillMap)) {
    if (jobTitle.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(jobTitle.toLowerCase())) {
      return skills
    }
  }

  // Defaults by keyword
  if (jobTitle.toLowerCase().includes('sap')) {
    return ['SAP', 'ERP', 'Business Process', 'System Integration']
  }
  if (jobTitle.toLowerCase().includes('analyst')) {
    return ['Data Analysis', 'Excel', 'Reporting', 'Analytics']
  }
  if (jobTitle.toLowerCase().includes('developer')) {
    return ['Programming', 'Software Development', 'Database', 'Technical Skills']
  }
  return ['Professional Skills', 'Team Work', 'Problem Solving']
}

// Helper function to transform database candidate report to UI format
function transformCandidateReport(report: CandidateReport, filename?: string) {
  // Generate a fake email and other details based on the candidate name
  const nameToEmail = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '.') + '@email.com'
  }

  // Extract location from skills or generate a default
  const generateLocation = (name: string) => {
    // Simple location assignment based on name patterns
    if (name.includes('Ahmed') || name.includes('Mohamed') || name.includes('Ghassen') || name.includes('Baha')) {
      return 'Tunis, Tunisia'
    }
    if (name.includes('Ferchichi') || name.includes('Selmi')) {
      return 'Sfax, Tunisia'
    }
    return 'Tunisia'
  }

  // Generate phone number
  const generatePhone = (id: number) => {
    const phoneNumbers = [
      '+216 20 123 456',
      '+216 21 234 567',
      '+216 22 345 678',
      '+216 23 456 789',
      '+216 24 567 890',
      '+216 25 678 901',
      '+216 26 789 012',
      '+216 27 890 123',
      '+216 28 901 234',
      '+216 29 012 345'
    ]
    return phoneNumbers[id % phoneNumbers.length]
  }


  return {
    id: report.id,
    name: report.candidate_name,
    email: nameToEmail(report.candidate_name),
    phone: generatePhone(report.id),
    position: report.applied_job_title,
    aiScore: Math.round(report.total_weighted_score * 10) / 10, // Assuming score is 0-10
    status: report.total_weighted_score >= 8 ? 'Shortlisted' : 
           report.total_weighted_score >= 6 ? 'Under Review' : 'New Application',
    appliedDate: new Date(report.created_at).toISOString().split('T')[0],
    experience: '3+ years', // Default experience
    location: generateLocation(report.candidate_name),
  skills: inferSkillsFromJobTitle(report.applied_job_title),
    avatar: "/placeholder.svg",
    // Prefer exact filename if provided from assets enumeration; fallback to slug pattern
    resumeUrl: filename
      ? `/cv/${report.applied_job_title}/${filename}`
      : `/cv/${report.applied_job_title}/${report.candidate_name.toLowerCase().replace(/\s+/g, '-')}-cv.pdf`,
    strengths: report.strengths,
    gaps: report.gaps,
    salary: '$60,000 - $80,000', // Default salary range
    availability: 'Immediate',
    // Add the report data for AI analysis
    hasAIReport: true,
    reportId: report.id,
    scoreDetails: report.score_details,
    reportDate: report.created_at
  }
}

// Hook for fetching all candidates from database
export function useAllCandidates() {
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)

  const fetchCandidates = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Clear existing candidates first to force re-render
      setCandidates([])
      
      console.log('🚀 Fetching all candidates (analyzed + not analyzed)...', new Date().toISOString())
      
      // Get all candidates from assets (this includes everyone)
      const allCandidatesResponse = await apiService.getAllCandidatesFromAssets()
      console.log(`� Assets returned ${allCandidatesResponse.candidates.length} total candidates`)
      
      // Get analyzed candidates from database
      const analyzedResponse = await apiService.searchCandidates({ limit: 1000 })
      console.log(`� Database returned ${analyzedResponse.candidates.length} analyzed candidates`)
      
      // Create a map of analyzed candidates by name for quick lookup
      const analyzedMap = new Map<string, CandidateReport>()
      analyzedResponse.candidates.forEach(report => {
        const normalizedName = report.candidate_name.toLowerCase().trim()
        analyzedMap.set(normalizedName, report)
      })
      
      // Merge the data: for each candidate from assets, check if they have analysis
      const mergedCandidates = allCandidatesResponse.candidates.map(assetCandidate => {
        const normalizedName = assetCandidate.candidate_name.toLowerCase().trim()
        const analysisReport = analyzedMap.get(normalizedName)
        
        if (analysisReport) {
          // Candidate has been analyzed - use the analysis data
          console.log(`✅ Found analysis for: ${assetCandidate.candidate_name}`)
          return transformCandidateReport(
            {
              ...analysisReport
            },
            // Ensure we keep the correct filename from assets
            assetCandidate.filename
          )
        } else {
          // Candidate has NOT been analyzed - synthesize reasonable skills from the applied job title
          console.log(`❌ No analysis for: ${assetCandidate.candidate_name}`)
          const inferredSkills = inferSkillsFromJobTitle(assetCandidate.applied_job_title)
          return {
            id: assetCandidate.id + 1000, // Ensure unique IDs
            name: assetCandidate.candidate_name,
            email: assetCandidate.candidate_name.toLowerCase().replace(/\s+/g, '.') + '@email.com',
            phone: '+216 20 123 456',
            position: assetCandidate.applied_job_title,
            aiScore: 0,
            status: 'Not Analyzed',
            appliedDate: new Date().toISOString().split('T')[0],
            experience: 'Unknown',
            location: 'Tunisia',
            skills: inferredSkills && inferredSkills.length ? inferredSkills : ['To be determined'],
            avatar: "/placeholder.svg",
            resumeUrl: `/cv/${assetCandidate.applied_job_title}/${assetCandidate.filename}`,
            strengths: [],
            gaps: [],
            salary: 'To be negotiated',
            availability: 'Unknown',
            // Mark as not having AI report
            hasAIReport: false,
            reportId: null,
            scoreDetails: null,
            reportDate: null
          }
        }
      })

      // Include analyzed candidates that don't have a matching asset file (still show them)
      const assetNames = new Set(
        allCandidatesResponse.candidates.map((c: any) => c.candidate_name.toLowerCase().trim())
      )
      const dbOnlyCandidates = analyzedResponse.candidates
        .filter(report => !assetNames.has(report.candidate_name.toLowerCase().trim()))
        .map(report => {
          console.log(`� Adding DB-only candidate (no asset file found): ${report.candidate_name}`)
          return transformCandidateReport({ ...report })
        })

      const finalList = [...mergedCandidates, ...dbOnlyCandidates]
      
      console.log(`🔄 Final merged candidates: ${finalList.length}`)
      console.log('📋 Analyzed candidates:', finalList.filter(c => c.hasAIReport).length)
      console.log('❓ Not analyzed candidates:', finalList.filter(c => !c.hasAIReport).length)
      
      // Force React to re-render by creating a completely new array
      setCandidates([...finalList])
      setRefreshCounter(prev => prev + 1)
      console.log('🔄 State updated, refresh counter:', refreshCounter + 1)
    } catch (err) {
      console.error('❌ Error fetching candidates:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch candidates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCandidates()
  }, [])

  const manualRefetch = async () => {
    console.log('🔄 Manual refetch triggered...')
    await fetchCandidates()
    console.log('✅ Manual refetch completed')
  }

  return { candidates, loading, error, refetch: manualRefetch, refreshCounter }
}

// Hook for report deletion
export function useReportDeletion() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteReport = async (reportId: number) => {
    try {
      setLoading(true)
      setError(null)
      await apiService.deleteReport(reportId)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report')
      return false
    } finally {
      setLoading(false)
    }
  }

  return { deleteReport, loading, error }
}
