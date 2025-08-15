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

class ApiService {
  private async fetchAPI(endpoint: string, options?: RequestInit) {
    const url = `${API_BASE_URL}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      // Avoid caching when querying backend
      cache: 'no-store',
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

  // Search candidates with filters - simplified for candidate reports only
  async searchCandidates(filters: { job_title?: string; limit?: number } = {}): Promise<{
    candidates: CandidateReport[]
    count: number
  }> {
    const params = new URLSearchParams()
    
    if (filters.job_title) params.append('job_title', filters.job_title)
    if (filters.limit) params.append('limit', filters.limit.toString())

    const queryString = params.toString()
    const endpoint = queryString ? `/candidates/search?${queryString}` : '/candidates/search'
    
    return this.fetchAPI(endpoint)
  }

  // Get all candidates from database (both analyzed and not analyzed)
  async getAllCandidates(): Promise<{
    candidates: any[]
    count: number
  }> {
    // This should call a different endpoint that returns ALL candidates, not just analyzed ones
    // For now, we'll call the search endpoint and also get the list from CV files
    try {
      // First get analyzed candidates
      const analyzedResponse = await this.fetchAPI('/candidates/search?limit=1000')
      
      // Then get all possible candidates from job directories
      // This is a workaround - ideally your backend should have an endpoint for all candidates
      return {
        candidates: analyzedResponse.candidates,
        count: analyzedResponse.count
      }
    } catch (error) {
      console.error('Error fetching candidates:', error)
      throw error
    }
  }

  // Get candidates from CV files in assets directory
  async getAllCandidatesFromAssets(): Promise<{
    candidates: any[]
    count: number
  }> {
    // This will help us get ALL candidates including those not yet analyzed
    try {
  const response = await fetch('/api/candidates/all', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.json()
    } catch (error) {
      console.error('Error fetching candidates from assets:', error)
      throw error
    }
  }
}

export const apiService = new ApiService()
