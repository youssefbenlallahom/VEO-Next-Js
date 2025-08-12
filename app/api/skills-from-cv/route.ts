import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('Received request to /api/skills-from-cv');
    
    // Get the form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      console.error('No file found in the request');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    console.log(`Processing file: ${file.name} (${file.size} bytes)`);
    
    // Backend FastAPI URL
    const backendUrl = 'http://127.0.0.1:8000/extract-skills-from-cv';
    
    console.log('Forwarding request to FastAPI backend...');
    const startTime = Date.now();
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
      // Do NOT set Content-Type; browser will set it for multipart/form-data
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`Backend responded with status: ${response.status} (${responseTime}ms)`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      return NextResponse.json(
        { error: 'Failed to process CV', details: errorText },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('Backend response data:', JSON.stringify(data, null, 2));
    
    return NextResponse.json(data, { status: 200 });
    
  } catch (error) {
    console.error('Error in /api/skills-from-cv:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
