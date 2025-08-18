import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const debug = !!payload?.debug

    if (debug) {
      try {
        console.log('\n[skill-match-multi] Incoming payload:')
        console.log(JSON.stringify(payload, null, 2))
      } catch {}
    }

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'
    const res = await fetch(`${backendUrl}/analyze-skill-match-multi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(debug ? { ...payload, debug: true } : payload),
    })

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
