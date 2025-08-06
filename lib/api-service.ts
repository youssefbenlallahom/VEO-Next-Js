// API service for backend integration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface CandidateReport {
  id: number
  candidate_name: string
  applied_job_title: string
  total_weighted_score: number
  strengths: string[]
  gaps: string[]
  score_details: any
  created_at: string
}

export interface DatabaseStats {
  total_reports: number
  unique_candidates: number
  unique_job_positions: number
  average_score: number
  top_candidates: Array<{
    name: string
    score: number
  }>
  recent_activity: Array<{
    id: number
    candidate_name: string
    job_title: string
    score: number
    date: string
  }>
}

export interface JobPosition {
  title: string
  candidate_count: number
  average_score: number
  highest_score: number
  lowest_score: number
}

export interface SearchFilters {
  name?: string
  min_score?: number
  max_score?: number
  job_title?: string
  limit?: number
}

export interface ComparisonCandidate {
  id: number
  candidate_name: string
  job_title: string
  total_score: number
  strengths: string[]
  gaps: string[]
  score_details: any
  created_at: string
}

export interface TopPerformer {
  id: number
  candidate_name: string
  job_title: string
  score: number
  strengths: string[]
  created_at: string
}

class ApiService {
  private async fetchAPI(endpoint: string, options?: RequestInit) {
    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  // Delete a specific report
  async deleteReport(reportId: number): Promise<{ message: string }> {
    return this.fetchAPI(`/reports/${reportId}`, {
      method: 'DELETE',
    })
  }

  // Get database statistics
  async getDatabaseStats(): Promise<DatabaseStats> {
    return this.fetchAPI('/stats')
  }

  // Get all job positions with statistics
  async getJobPositions(): Promise<{ job_positions: JobPosition[] }> {
    return this.fetchAPI('/job-positions')
  }

  // Search candidates with filters
  async searchCandidates(filters: SearchFilters = {}): Promise<{
    candidates: CandidateReport[]
    count: number
  }> {
    const params = new URLSearchParams()
    
    if (filters.name) params.append('name', filters.name)
    if (filters.min_score !== undefined) params.append('min_score', filters.min_score.toString())
    if (filters.max_score !== undefined) params.append('max_score', filters.max_score.toString())
    if (filters.job_title) params.append('job_title', filters.job_title)
    if (filters.limit) params.append('limit', filters.limit.toString())

    const queryString = params.toString()
    const endpoint = queryString ? `/candidates/search?${queryString}` : '/candidates/search'
    
    return this.fetchAPI(endpoint)
  }

  // Compare multiple candidates
  async compareCandidates(candidateIds: number[]): Promise<{
    comparison: ComparisonCandidate[]
  }> {
    const idsString = candidateIds.join(',')
    return this.fetchAPI(`/reports/compare?candidate_ids=${idsString}`)
  }

  // Get top performers
  async getTopPerformers(limit: number = 10, jobTitle?: string): Promise<{
    top_performers: TopPerformer[]
  }> {
    const params = new URLSearchParams()
    params.append('limit', limit.toString())
    if (jobTitle) params.append('job_title', jobTitle)

    const queryString = params.toString()
    const endpoint = `/candidates/top-performers?${queryString}`
    
    return this.fetchAPI(endpoint)
  }
}

export const apiService = new ApiService()
