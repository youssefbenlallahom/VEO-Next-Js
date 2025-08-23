import { NextRequest, NextResponse } from 'next/server'

type CandidatePayload = {
  name: string
  // skills is a categorized object: { CategoryName: string[] }
  skills: Record<string, string[]>
}

type MultiPayload = {
  job_title: string
  candidates: CandidatePayload[]
  job_skills: Record<string, string[]>
  threshold?: number
  debug?: boolean
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as MultiPayload

    const debug = !!payload?.debug

    if (debug) {
      try {
        console.log('\n[skill-match-multi] Incoming payload:')
        console.log(JSON.stringify(payload, null, 2))
      } catch {}
    }

    // Basic validation to ensure required fields are present
    if (!payload || typeof payload.job_title !== 'string' || !payload.job_title.trim()) {
      return NextResponse.json({ error: 'job_title is required' }, { status: 400 })
    }
    if (!payload.candidates || !Array.isArray(payload.candidates) || payload.candidates.length === 0) {
      return NextResponse.json({ error: 'candidates array is required' }, { status: 400 })
    }
    if (!payload.job_skills || typeof payload.job_skills !== 'object') {
      return NextResponse.json({ error: 'job_skills object is required' }, { status: 400 })
    }

    // Enforce max candidates to avoid backend overload
    const limitedCandidates = Array.isArray(payload.candidates)
      ? payload.candidates.slice(0, 25)
      : []

    const normalizedPayload: Required<Omit<MultiPayload, 'debug'>> & { debug?: boolean } = {
      job_title: payload.job_title,
      candidates: limitedCandidates,
      job_skills: payload.job_skills,
      threshold: typeof payload.threshold === 'number' ? payload.threshold : 40,
      ...(debug ? { debug: true } : {}),
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    // Add a 60s timeout to avoid long hangs
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)
    const res = await fetch(`${backendUrl}/analyze-skill-match-multi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizedPayload),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    let data: any
    try {
      data = await res.json()
    } catch (e) {
      data = { error: 'Non-JSON response from backend' }
    }

    if (debug) {
      try {
        console.log('[skill-match-multi] Backend status:', res.status)
        console.log('[skill-match-multi] Backend response:')
        console.log(JSON.stringify(data, null, 2))
      } catch {}
    }

    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('Error in /api/skill-match-multi:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
