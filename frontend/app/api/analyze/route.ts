import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  console.log('[API/analyze] POST handler called');
  try {
    // Forward multipart/form-data to FastAPI
    const formData = await req.formData();
    console.log('[API/analyze] Forwarding to FastAPI with fields:', Array.from(formData.keys()));
    const res = await fetch('http://localhost:8000/analyze', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    console.log('[API/analyze] FastAPI response status:', res.status);
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[API/analyze] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method Not Allowed' }, { status: 405 });
}