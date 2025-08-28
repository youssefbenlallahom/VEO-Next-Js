import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  context: { params: { path: string[] } }
) {
  try {
    // Await params as required by Next.js app router
    const awaitedContext = await context;
    const { params } = awaitedContext;
    const pathSegments = params.path;
    // Try primary root: assets/jobs
    const assetsRoot = path.join(process.cwd(), 'assets', 'jobs');
    const candidatePath1 = path.join(assetsRoot, ...pathSegments);
    const resolvedAssetsRoot = path.resolve(assetsRoot);
    let resolvedPath = path.resolve(candidatePath1);

    // Security check primary root
    if (!resolvedPath.startsWith(resolvedAssetsRoot)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // If not exists in assets/, try public/assets/
    if (!fs.existsSync(resolvedPath)) {
      const publicRoot = path.join(process.cwd(), 'public', 'assets', 'jobs');
      const candidatePath2 = path.join(publicRoot, ...pathSegments);
      const resolvedPublicRoot = path.resolve(publicRoot);
      const resolvedAlt = path.resolve(candidatePath2);
      if (resolvedAlt.startsWith(resolvedPublicRoot) && fs.existsSync(resolvedAlt)) {
        resolvedPath = resolvedAlt;
      } else {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
    }

    // Read the file
    const fileBuffer = fs.readFileSync(resolvedPath);

    // Determine content type based on file extension
    const extension = path.extname(resolvedPath).toLowerCase();
    let contentType = 'application/octet-stream';

    switch (extension) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.txt':
        contentType = 'text/plain';
        break;
      case '.doc':
        contentType = 'application/msword';
        break;
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
    }

    // Return the file with appropriate headers for react-pdf
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${path.basename(resolvedPath)}"`,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Accept-Ranges': 'bytes',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
  
