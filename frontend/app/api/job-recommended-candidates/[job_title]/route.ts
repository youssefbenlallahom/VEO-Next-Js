import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { job_title: string } }
) {
  try {
    // Next.js 15+ requires awaiting params
    const { job_title } = await params
    if (!job_title) {
      return NextResponse.json({ error: 'job_title parameter is required' }, { status: 400 })
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const res = await fetch(`${backendUrl}/job-recommended-candidates/${encodeURIComponent(job_title)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      if (res.status === 404) {
        return NextResponse.json({ job_title, recommended_candidates: [] }, { status: 200 })
      }
      console.error('[job-recommended-candidates] Backend error:', res.status, text)
      return NextResponse.json({ error: `Backend API error: ${res.status}` }, { status: res.status })
    }

    const data = await res.json()
    // Normalize to always return { recommended_candidates: string[] }
    const recommended = Array.isArray(data?.recommended_candidates) ? data.recommended_candidates : []
    return NextResponse.json({ job_title, recommended_candidates: recommended })
  } catch (error) {
    console.error('Error in /api/job-recommended-candidates/[job_title]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
