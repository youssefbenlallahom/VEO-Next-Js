import { useState, useEffect } from 'react'

export interface Candidate {
  id: number
  name: string
  email: string
  phone: string
  position: string
  aiScore: number
  status: string
  appliedDate: string
  experience: string
  location: string
  skills: string[]
  avatar: string
  resumeUrl: string
  strengths: string[]
  gaps: string[]
  salary: string
  availability: string
  jobId: string
}

export interface Job {
  id: string
  title: string
  department: string
  location: string
  type: string
  status: string
  postedDate: string
  salary: string
  description: string
  requirements: string[]
  applicants: number
  priority: "High" | "Medium" | "Low"
  hiringManager: string
}

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/jobs')
        if (!response.ok) {
          throw new Error('Failed to fetch jobs')
        }
        const data = await response.json()
        setJobs(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  return { jobs, loading, error }
}

export function useCandidates(jobId?: string) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        setLoading(true)
        const url = jobId ? `/api/candidates?jobId=${jobId}` : '/api/candidates'
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch candidates')
        }
        const data = await response.json()
        setCandidates(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCandidates()
  }, [jobId])

  return { candidates, loading, error }
}

export function useJobWithCandidates(jobId: string) {
  const { jobs, loading: jobsLoading } = useJobs()
  const { candidates, loading: candidatesLoading } = useCandidates(jobId)
  
  const job = jobs.find(j => j.id === jobId)
  const loading = jobsLoading || candidatesLoading
  
  return { job, candidates, loading }
}