import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params
    
    // Convert job ID back to folder name
    const jobTitle = jobId.replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    
    const jobPath = path.join(process.cwd(), 'assets', 'jobs', jobTitle)
    
    if (!fs.existsSync(jobPath)) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }
    
    // Find job description file
    const files = fs.readdirSync(jobPath)
    const descriptionFiles = files.filter(file => 
      file.includes('job-description') && file.endsWith('.txt')
    )
    
    if (descriptionFiles.length === 0) {
      return NextResponse.json({ error: 'Job description not found' }, { status: 404 })
    }
    
    // Read job description
    const descriptionPath = path.join(jobPath, descriptionFiles[0])
    const description = fs.readFileSync(descriptionPath, 'utf-8')
    
    return NextResponse.json({ 
      jobId,
      jobTitle,
      description,
      filename: descriptionFiles[0]
    })
  } catch (error) {
    console.error('Error reading job description:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
