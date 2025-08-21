import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: { job_title: string } }
) {
  try {
    const jobTitle = decodeURIComponent(params.job_title)
    
    const res = await fetch(`http://localhost:8000/job-barem/${encodeURIComponent(jobTitle)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    
    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(
          { error: `No assessment criteria found for job: ${jobTitle}` },
          { status: 404 }
        )
      }
      throw new Error(`Backend API error: ${res.status}`)
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching job barem:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assessment criteria' },
      { status: 500 }
    )
  }
}
