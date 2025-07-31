import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export interface Candidate {
  id: number
  name: string
  email: string
  phone: string
  position: string
  aiScore: number
  status: string
  appliedDate: string
  experience: string
  location: string
  skills: string[]
  avatar: string
  resumeUrl: string
  strengths: string[]
  gaps: string[]
  salary: string
  availability: string
  jobId: string
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    
    const assetsPath = path.join(process.cwd(), 'assets', 'jobs')
    
    if (!fs.existsSync(assetsPath)) {
      return NextResponse.json({ error: 'Assets directory not found' }, { status: 404 })
    }

    const candidates: Candidate[] = []
    let candidateId = 1

    const jobFolders = fs.readdirSync(assetsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    for (const jobFolder of jobFolders) {
      const currentJobId = jobFolder.toLowerCase().replace(/\s+/g, '-')
      
      // If jobId filter is provided, only process that job
      if (jobId && currentJobId !== jobId) {
        continue
      }

      const jobPath = path.join(assetsPath, jobFolder)
      const files = fs.readdirSync(jobPath)
      
      // Find all CV files
      const cvFiles = files.filter(file => file.endsWith('.pdf'))
      
      for (const cvFile of cvFiles) {
        const candidate = createCandidateFromFilename(
          candidateId++,
          cvFile,
          jobFolder,
          currentJobId
        )
        candidates.push(candidate)
      }
    }

    return NextResponse.json(candidates)
  } catch (error) {
    console.error('Error reading candidates:', error)
    return NextResponse.json({ error: 'Failed to read candidates' }, { status: 500 })
  }
}

function createCandidateFromFilename(
  id: number,
  filename: string,
  jobTitle: string,
  jobId: string
): Candidate {
  // Extract name from filename (remove -cv.pdf and format)
  const nameFromFile = filename
    .replace('-cv.pdf', '')
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  // Generate mock data based on filename and job type
  const mockData = generateMockCandidateData(nameFromFile, jobTitle)

  return {
    id,
    name: nameFromFile,
    email: `${filename.replace('-cv.pdf', '').replace(/-/g, '.')}@email.com`,
    phone: generatePhoneNumber(),
    position: jobTitle,
    aiScore: Math.floor(Math.random() * 40) + 60, // 60-100 range
    status: getRandomStatus(),
    appliedDate: getRandomDate(),
    experience: mockData.experience,
    location: mockData.location,
    skills: mockData.skills,
    avatar: "/placeholder-user.jpg",
    resumeUrl: `/api/cv/${jobTitle}/${filename}`,
    strengths: mockData.strengths,
    gaps: mockData.gaps,
    salary: mockData.salary,
    availability: mockData.availability,
    jobId
  }
}

function generateMockCandidateData(name: string, jobTitle: string) {
  const locations = ["Tunis", "Sfax", "Sousse", "Ariana", "Ben Arous", "Monastir"]
  const experiences = ["2-3 years", "3-5 years", "5-7 years", "7-10 years", "10+ years"]
  const availabilities = ["Immediate", "2 weeks notice", "1 month notice", "Flexible"]
  
  // Job-specific skills
  const skillSets: { [key: string]: string[] } = {
    'hr': ['Human Resources', 'Recruitment', 'Employee Relations', 'HR Analytics', 'HRIS', 'Performance Management'],
    'sap': ['SAP ABAP', 'SAP HANA', 'SAP Fiori', 'SQL', 'ABAP Development', 'SAP Modules'],
    'bi': ['Business Intelligence', 'SQL', 'Data Analysis', 'Power BI', 'Tableau', 'ETL'],
    'analyst': ['Data Analysis', 'Excel', 'SQL', 'Statistics', 'Reporting', 'Analytics'],
    'accountant': ['Accounting', 'Financial Analysis', 'SAP', 'Excel', 'Auditing', 'Tax']
  }
  
  // Determine skill set based on job title
  let skills: string[] = []
  const jobLower = jobTitle.toLowerCase()
  
  if (jobLower.includes('hr')) skills = skillSets.hr
  else if (jobLower.includes('sap')) skills = skillSets.sap
  else if (jobLower.includes('bi')) skills = skillSets.bi
  else if (jobLower.includes('analyst')) skills = skillSets.analyst
  else if (jobLower.includes('account')) skills = skillSets.accountant
  else skills = ['Communication', 'Problem Solving', 'Teamwork', 'Leadership']

  // Add some random additional skills
  const additionalSkills = ['French', 'English', 'Arabic', 'Project Management', 'Leadership', 'Communication']
  skills = [...skills, ...additionalSkills.slice(0, 2)]

  const strengths = [
    'Strong analytical skills',
    'Excellent communication',
    'Proven track record',
    'Team leadership experience',
    'Technical expertise',
    'Problem-solving abilities'
  ]

  const gaps = [
    'Limited experience with latest tools',
    'Could benefit from additional certifications',
    'Needs more exposure to international projects',
    'Would benefit from leadership training'
  ]

  return {
    experience: experiences[Math.floor(Math.random() * experiences.length)],
    location: locations[Math.floor(Math.random() * locations.length)],
    skills: skills.slice(0, 6),
    strengths: strengths.slice(0, 3),
    gaps: gaps.slice(0, 2),
    salary: `${Math.floor(Math.random() * 30000) + 20000} TND`,
    availability: availabilities[Math.floor(Math.random() * availabilities.length)]
  }
}

function generatePhoneNumber(): string {
  const prefixes = ['20', '21', '22', '23', '24', '25', '26', '27', '28', '29']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const number = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return `+216 ${prefix} ${number.slice(0, 3)} ${number.slice(3)}`
}

function getRandomStatus(): string {
  const statuses = ['New', 'Reviewing', 'Interview Scheduled', 'Interviewed', 'On Hold']
  return statuses[Math.floor(Math.random() * statuses.length)]
}

function getRandomDate(): string {
  const start = new Date(2024, 0, 1)
  const end = new Date()
  const randomDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
  return randomDate.toISOString().split('T')[0]
}