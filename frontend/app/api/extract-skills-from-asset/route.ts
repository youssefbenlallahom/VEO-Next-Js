import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('Received request to /api/extract-skills-from-asset');
    const { job_title, filename } = await req.json();
    
    if (!job_title || !filename) {
      return NextResponse.json({ 
        error: 'job_title and filename are required' 
      }, { status: 400 });
    }
    
    const backendUrl = 'http://127.0.0.1:8000/extract-skills-from-asset-cv';
    
    // Create FormData for the backend request
    const formData = new FormData();
    formData.append('job_title', job_title);
    formData.append('filename', filename);
    
    console.log(`Calling backend to extract skills from asset: ${job_title}/${filename}`);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      return NextResponse.json(
        { error: 'Failed to extract skills from asset', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('Backend response data:', JSON.stringify(data, null, 2));
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error in /api/extract-skills-from-asset:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}