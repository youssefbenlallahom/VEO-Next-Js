import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('Received request to /api/skills-from-cv');
    const backendUrl = 'http://127.0.0.1:8000/extract-skills-from-cv';
    const contentType = req.headers.get('content-type') || '';

    let response;
    if (contentType.includes('multipart/form-data')) {
      // Handle file upload or job_title+job_description as FormData
      const formData = await req.formData();
      response = await fetch(backendUrl, {
        method: 'POST',
        body: formData,
      });
    } else if (contentType.includes('application/json')) {
      // Handle JSON body (job_description + job_title)
      const { job_description, job_title } = await req.json();
      if (!job_description || !job_title) {
        return NextResponse.json({ error: 'job_description and job_title are required in JSON body' }, { status: 400 });
      }
      const formData = new FormData();
      formData.append('job_description', job_description);
      formData.append('job_title', job_title);
      response = await fetch(backendUrl, {
        method: 'POST',
        body: formData,
      });
    } else {
      return NextResponse.json({ error: 'Unsupported content type' }, { status: 400 });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', errorText);
      return NextResponse.json(
        { error: 'Failed to process request', details: errorText },
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
