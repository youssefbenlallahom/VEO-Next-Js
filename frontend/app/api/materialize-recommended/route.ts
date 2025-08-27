import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

/*
POST /api/materialize-recommended
Body: {
  job_title: string,
  candidates: Array<{ resumeUrl?: string, name?: string }>
}

For each candidate, this will attempt to copy their CV from
  assets/jobs/<src_job>/<filename>
into
  assets/jobs/<job_title>/recommended/<filename>
*/
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const jobTitle: string | undefined = body?.job_title
    const candidates: Array<{ resumeUrl?: string; name?: string }> = Array.isArray(body?.candidates) ? body.candidates : []

    if (!jobTitle || !jobTitle.trim()) {
      return NextResponse.json({ error: 'job_title is required' }, { status: 400 })
    }
    if (!candidates.length) {
      return NextResponse.json({ error: 'candidates array is required' }, { status: 400 })
    }

    const projectRoot = process.cwd()
    const assetsJobs = path.join(projectRoot, 'assets', 'jobs')
    const destDir = path.join(assetsJobs, jobTitle, 'recommended')

    // Ensure destination directory exists
    fs.mkdirSync(destDir, { recursive: true })

    const copied: string[] = []
    const missing: string[] = []

    for (const cand of candidates) {
      const resumeUrl = cand?.resumeUrl || ''
      // Accept both /cv/<job>/<file> and /api/cv/<job>/<file>
      const parts = resumeUrl.replace(/^\/(api\/)?cv\//, '').split('/')
      if (parts.length < 2) {
        if (cand?.name) missing.push(`${cand.name}: invalid resumeUrl`)
        continue
      }
      const srcJob = decodeURIComponent(parts[0])
      const fileName = parts.slice(1).join('/') // support nested if ever

      const srcPath = path.join(assetsJobs, srcJob, fileName)
      const dstPath = path.join(destDir, fileName)

      try {
        if (!fs.existsSync(srcPath)) {
          missing.push(`${cand?.name || fileName}: source not found (${srcPath})`)
          continue
        }
        // Create nested destination dir if fileName contains subfolders
        fs.mkdirSync(path.dirname(dstPath), { recursive: true })
        fs.copyFileSync(srcPath, dstPath)
        copied.push(fileName)
      } catch (e) {
        missing.push(`${cand?.name || fileName}: copy failed`)
      }
    }

    return NextResponse.json({ job_title: jobTitle, copied, missing })
  } catch (error) {
    console.error('Error in /api/materialize-recommended:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
