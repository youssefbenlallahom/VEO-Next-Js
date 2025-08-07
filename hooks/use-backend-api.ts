import { useState, useEffect } from 'react'
import { 
  apiService, 
  CandidateReport
} from '@/lib/api-service'

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
