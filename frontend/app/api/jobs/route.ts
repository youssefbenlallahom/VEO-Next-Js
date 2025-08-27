import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export interface Job {
  id: string
  title: string
  department: string
  location: string
  type: string
  status: string
  postedDate: string
  salary: string
  description: string
  requirements: string[]
  applicants: number
  priority: "High" | "Medium" | "Low"
  hiringManager: string
}

// Ensure this route is not statically cached by Next.js
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const assetsPath = path.join(process.cwd(), 'assets', 'jobs')
    
    if (!fs.existsSync(assetsPath)) {
      return NextResponse.json({ error: 'Assets directory not found' }, { status: 404 })
    }

    const jobFolders = fs.readdirSync(assetsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    const jobs: Job[] = []

    for (const jobFolder of jobFolders) {
      const jobPath = path.join(assetsPath, jobFolder)
      const files = fs.readdirSync(jobPath)
      
      // Find job description file (optional)
      const descriptionFiles = files.filter(file => 
        file.toLowerCase().includes('job-description') && file.toLowerCase().endsWith('.txt')
      )
      
      // Read job description if present; otherwise fallback to a default
      let description = `Job: ${jobFolder}\nDescription not provided. Place a 'job-description.txt' file in this folder for richer details.`
      if (descriptionFiles.length > 0) {
        const descriptionPath = path.join(jobPath, descriptionFiles[0])
        description = fs.readFileSync(descriptionPath, 'utf-8')
      }
      
      // Count CV files
  const cvFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'))
      
      // Parse job description to extract requirements
  const requirements = extractRequirements(description)
      
      // Create job object
      const job: Job = {
        id: jobFolder.toLowerCase().replace(/\s+/g, '-'),
        title: jobFolder,
        department: getDepartmentFromTitle(jobFolder),
        location: "Tunisia", // Default location
        type: "Full-time", // Default type
        status: "Open",
        postedDate: new Date().toISOString().split('T')[0],
        salary: "Competitive",
        description: description,
        requirements: requirements,
        applicants: cvFiles.length,
        priority: getPriorityFromApplicants(cvFiles.length),
        hiringManager: "HR Team"
      }
      
      jobs.push(job)
    }

    return NextResponse.json(jobs)
  } catch (error) {
    console.error('Error reading jobs:', error)
    return NextResponse.json({ error: 'Failed to read jobs' }, { status: 500 })
  }
}

function extractRequirements(description: string): string[] {
  const requirements: string[] = []
  const lines = description.split('\n')
  
  let inRequirementsSection = false
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // Check if we're entering a requirements section
    if (trimmedLine.toLowerCase().includes('requirement') || 
        trimmedLine.toLowerCase().includes('skill') ||
        trimmedLine.toLowerCase().includes('qualification')) {
      inRequirementsSection = true
      continue
    }
    
    // Check if we're leaving requirements section
    if (inRequirementsSection && trimmedLine.length === 0) {
      continue
    }
    
    // Extract bullet points or numbered items
    if (inRequirementsSection && (trimmedLine.startsWith('•') || 
        trimmedLine.startsWith('-') || 
        trimmedLine.match(/^\d+\./))) {
      requirements.push(trimmedLine.replace(/^[•\-\d\.]\s*/, ''))
    }
  }
  
  // If no structured requirements found, extract key skills mentioned
  if (requirements.length === 0) {
    const skillKeywords = ['experience', 'knowledge', 'skills', 'proficient', 'degree']
    for (const line of lines) {
      const lowerLine = line.toLowerCase()
      if (skillKeywords.some(keyword => lowerLine.includes(keyword))) {
        requirements.push(line.trim())
      }
    }
  }
  
  return requirements.slice(0, 8) // Limit to 8 requirements
}

function getDepartmentFromTitle(title: string): string {
  const lowerTitle = title.toLowerCase()
  
  if (lowerTitle.includes('hr') || lowerTitle.includes('human')) return 'Human Resources'
  if (lowerTitle.includes('sap') || lowerTitle.includes('developer') || lowerTitle.includes('bi')) return 'IT & Development'
  if (lowerTitle.includes('account') || lowerTitle.includes('finance')) return 'Finance'
  if (lowerTitle.includes('analyst')) return 'Analytics'
  
  return 'General'
}

function getPriorityFromApplicants(count: number): "High" | "Medium" | "Low" {
  if (count >= 10) return "High"
  if (count >= 5) return "Medium"
  return "Low"
}