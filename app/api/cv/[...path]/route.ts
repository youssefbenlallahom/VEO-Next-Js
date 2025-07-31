import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstruct the file path from the dynamic segments
    const filePath = path.join(process.cwd(), 'assets', 'jobs', ...params.path)
    
    // Security check: ensure the path is within the assets directory
    const assetsPath = path.join(process.cwd(), 'assets', 'jobs')
    const resolvedPath = path.resolve(filePath)
    const resolvedAssetsPath = path.resolve(assetsPath)
    
    if (!resolvedPath.startsWith(resolvedAssetsPath)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }
    
    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
    // Read the file
    const fileBuffer = fs.readFileSync(resolvedPath)
    
    // Determine content type based on file extension
    const extension = path.extname(resolvedPath).toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (extension) {
      case '.pdf':
        contentType = 'application/pdf'
        break
      case '.txt':
        contentType = 'text/plain'
        break
      case '.doc':
        contentType = 'application/msword'
        break
      case '.docx':
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        break
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
    })
  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
