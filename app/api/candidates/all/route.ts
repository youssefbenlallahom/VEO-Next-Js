import { NextRequest, NextResponse } from 'next/server'
import { readdirSync, statSync } from 'fs'
import { join } from 'path'

// Function to extract candidate name from filename
function extractCandidateInfo(filename: string, jobTitle: string) {
  // Remove the '-cv.pdf' suffix and convert to proper name
  const nameFromFile = filename
    .replace('-cv.pdf', '')
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return {
    name: nameFromFile,
    jobTitle: jobTitle,
    filename: filename
  }
}

export async function GET() {
  try {
    const assetsPath = join(process.cwd(), 'assets', 'jobs')
    
    const allCandidates: any[] = []
    let candidateId = 1

    // Read all job directories
    const jobDirectories = readdirSync(assetsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    console.log('📁 Found job directories:', jobDirectories)

    for (const jobDir of jobDirectories) {
      const jobPath = join(assetsPath, jobDir)
      
      try {
        const files = readdirSync(jobPath)
        const pdfFiles = files.filter(file => file.endsWith('-cv.pdf'))
        
        console.log(`📄 Found ${pdfFiles.length} CV files in ${jobDir}:`, pdfFiles)

        for (const pdfFile of pdfFiles) {
          const candidateInfo = extractCandidateInfo(pdfFile, jobDir)
          
          allCandidates.push({
            id: candidateId++,
            candidate_name: candidateInfo.name,
            applied_job_title: candidateInfo.jobTitle,
            filename: candidateInfo.filename,
            // Default values for candidates without analysis
            total_weighted_score: 0,
            strengths: [],
            gaps: [],
            score_details: null,
            created_at: new Date().toISOString(),
            hasAnalysis: false
          })
        }
      } catch (err) {
        console.error(`Error reading job directory ${jobDir}:`, err)
      }
    }

    console.log(`✅ Found ${allCandidates.length} total candidates from assets`)

    return NextResponse.json({
      candidates: allCandidates,
      count: allCandidates.length
    })
    
  } catch (error) {
    console.error('❌ Error scanning candidates from assets:', error)
    return NextResponse.json(
      { error: 'Failed to scan candidates from assets' },
      { status: 500 }
    )
  }
}
