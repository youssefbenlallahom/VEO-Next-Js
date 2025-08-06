import { useState, useEffect } from 'react'
import { 
  apiService, 
  DatabaseStats, 
  JobPosition, 
  CandidateReport, 
  SearchFilters, 
  ComparisonCandidate, 
  TopPerformer 
} from '@/lib/api-service'

// Hook for database statistics
export function useDatabaseStats() {
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const data = await apiService.getDatabaseStats()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return { stats, loading, error, refetch: fetchStats }
}

// Hook for job positions
export function useJobPositions() {
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchJobPositions = async () => {
    try {
      setLoading(true)
      const data = await apiService.getJobPositions()
      setJobPositions(data.job_positions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job positions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobPositions()
  }, [])

  return { jobPositions, loading, error, refetch: fetchJobPositions }
}

// Hook for candidate search
export function useCandidateSearch(filters?: SearchFilters) {
  const [candidates, setCandidates] = useState<CandidateReport[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = async (searchFilters?: SearchFilters) => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiService.searchCandidates(searchFilters || filters)
      setCandidates(data.candidates)
      setCount(data.count)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search candidates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (filters) {
      search(filters)
    }
  }, [])

  return { candidates, count, loading, error, search }
}

// Hook for candidate comparison
export function useCandidateComparison() {
  const [comparison, setComparison] = useState<ComparisonCandidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const compare = async (candidateIds: number[]) => {
    try {
      setLoading(true)
      setError(null)
      const data = await apiService.compareCandidates(candidateIds)
      setComparison(data.comparison)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare candidates')
    } finally {
      setLoading(false)
    }
  }

  const clear = () => {
    setComparison([])
    setError(null)
  }

  return { comparison, loading, error, compare, clear }
}

// Hook for top performers
export function useTopPerformers(limit: number = 10, jobTitle?: string) {
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTopPerformers = async () => {
    try {
      setLoading(true)
      const data = await apiService.getTopPerformers(limit, jobTitle)
      setTopPerformers(data.top_performers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch top performers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTopPerformers()
  }, [limit, jobTitle])

  return { topPerformers, loading, error, refetch: fetchTopPerformers }
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
