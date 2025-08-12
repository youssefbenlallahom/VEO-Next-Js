import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Call the FastAPI backend endpoint to get all extracted skills
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const res = await fetch(`${backendUrl}/display_skills`);
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch skills from backend' }, { status: 500 });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching skills from backend:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
