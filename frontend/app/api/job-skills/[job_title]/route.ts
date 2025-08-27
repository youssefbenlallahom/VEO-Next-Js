import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { job_title: string } }
) {
  try {
    // Await the params object first (Next.js 15+ requirement)
    const { job_title } = await params
    
    if (!job_title) {
      return NextResponse.json(
        { error: 'job_title parameter is required' },
        { status: 400 }
      )
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const res = await fetch(`${backendUrl}/job-skills/${encodeURIComponent(job_title)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    
    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(
          { error: `No skills data found for job title: ${job_title}` },
          { status: 404 }
        )
      }
      
      const errorText = await res.text().catch(() => '')
      console.error('Backend API error:', res.status, errorText)
      return NextResponse.json(
        { error: `Backend API error: ${res.status}` },
        { status: res.status }
      )
    }
    
    const data = await res.json()
    
    // Extract the required_skills from the backend response
    // Backend returns: { job_title: string, required_skills: Record<string, string[]> }
    const skills = data.required_skills || {}
    
    return NextResponse.json(skills)
  } catch (error) {
    console.error('Error in /api/job-skills/[job_title]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
