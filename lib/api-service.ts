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
}

export const apiService = new ApiService()
