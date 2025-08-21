"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Settings,
  Info,
  Brain,
  Languages,
  Wand2,
} from "lucide-react"

interface AssessmentCriteria {
  id: string
  name: string
  description: string
  skills: Record<string, number>
  createdDate: string
  jobTitle: string
  categorizedSkills?: Record<string, string[]>
}

interface JobBaremResponse {
  job_title: string
  barem: {
    [category: string]: {
      weight: number
      type: "category" | "individual"
      skills?: string[]
      criteria: string[]
    }
  }
}

interface AssessmentCriteriaSidebarProps {
  jobTitle: string
  onConfigureClick: () => void
}

export function AssessmentCriteriaSidebar({ jobTitle, onConfigureClick }: AssessmentCriteriaSidebarProps) {
  const [criteria, setCriteria] = useState<AssessmentCriteria | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch job-specific assessment criteria from API
  useEffect(() => {
    const fetchJobBarem = async () => {
      if (!jobTitle) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch(`/api/job-barem/${encodeURIComponent(jobTitle)}`)
        
        if (response.status === 404) {
          // No criteria found for this job
          setCriteria(null)
          setIsLoading(false)
          return
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch assessment criteria: ${response.status}`)
        }
        
        const data: JobBaremResponse = await response.json()
        
        // Check if barem is empty or has no meaningful data
        if (!data.barem || Object.keys(data.barem).length === 0) {
          // Empty barem means no criteria configured yet
          setCriteria(null)
          setIsLoading(false)
          return
        }
        
        // Transform API response to match our interface
        const weights: Record<string, number> = {}
        const categorizedSkills: Record<string, string[]> = {}
        
        // Extract weights and categorized skills from the new structure
        Object.entries(data.barem).forEach(([category, categoryData]) => {
          weights[category] = categoryData.weight
          
          if (categoryData.type === "category" && categoryData.skills) {
            categorizedSkills[category] = categoryData.skills
          } else if (categoryData.type === "individual") {
            // For individual skills like languages, create a Languages category if it doesn't exist
            if (category.includes("Level") || category.includes("Language")) {
              if (!categorizedSkills['Languages']) {
                categorizedSkills['Languages'] = []
              }
              categorizedSkills['Languages'].push(category)
            }
          }
        })
        
        // If no weights were extracted, treat as no criteria
        if (Object.keys(weights).length === 0) {
          setCriteria(null)
          setIsLoading(false)
          return
        }
        
        const transformedCriteria: AssessmentCriteria = {
          id: `${data.job_title}-${Date.now()}`,
          name: `${data.job_title} - Assessment Criteria`,
          description: `Assessment criteria for ${data.job_title} position`,
          skills: weights,
          createdDate: new Date().toISOString(), // We don't have creation date from API
          jobTitle: data.job_title,
          categorizedSkills: categorizedSkills
        }
        
        setCriteria(transformedCriteria)
      } catch (err) {
        console.error('Error fetching job barem:', err)
        setError(err instanceof Error ? err.message : 'Failed to load assessment criteria')
        setCriteria(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchJobBarem()
  }, [jobTitle])

  if (isLoading) {
    return (
      <Card className="shadow-soft animate-slideUp" style={{ animationDelay: "0.45s" }}>
        <CardHeader>
          <CardTitle className="text-lg">Assessment Criteria</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-veo-green border-t-transparent mx-auto"></div>
            <p className="text-sm text-gray-600">Loading assessment criteria...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-soft animate-slideUp" style={{ animationDelay: "0.45s" }}>
        <CardHeader>
          <CardTitle className="text-lg">Assessment Criteria</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="p-3 bg-red-50 rounded-lg">
              <Info className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
            <Button 
              onClick={onConfigureClick}
              className="w-full bg-veo-green hover:bg-veo-green/90 text-white"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Configure Skills
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!criteria) {
    return (
      <Card className="shadow-soft animate-slideUp" style={{ animationDelay: "0.45s" }}>
        <CardHeader>
          <CardTitle className="text-lg">Assessment Criteria</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Info className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                No assessment criteria configured for this job yet.
              </p>
            </div>
            <Button 
              onClick={onConfigureClick}
              className="w-full bg-veo-green hover:bg-veo-green/90 text-white"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Configure Skills
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Separate categories and individual language skills
  const categories = Object.keys(criteria.categorizedSkills || {}).filter(cat => cat !== 'Languages')
  const languages = criteria.categorizedSkills?.['Languages'] || []
  
  // Also identify language skills directly from the skills list (those containing "Level")
  const individualLanguages = Object.keys(criteria.skills).filter(skill => 
    skill.includes("Level") || skill.includes("Language")
  )
  
  // Combine both language sources
  const allLanguages = [...new Set([...languages, ...individualLanguages])]

  // Calculate total skills count
  const totalSkills = Object.keys(criteria.skills).length

  return (
    <Card className="shadow-soft animate-slideUp" style={{ animationDelay: "0.45s" }}>
      <CardHeader>
        <CardTitle className="text-lg">Assessment Criteria</CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* Assessment Details */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 text-sm">Assessment Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Created:</p>
              <p className="font-medium text-gray-900">
                {new Date(criteria.createdDate).toLocaleDateString('en-GB')}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Skills Count:</p>
              <p className="font-medium text-gray-900">{totalSkills}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-600">Original Job:</p>
              <p className="font-medium text-gray-900">{criteria.jobTitle}</p>
            </div>
          </div>
        </div>

        {/* Skills & Weights */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 text-sm">Skills & Weights</h4>
          
          {/* Categories */}
          {categories.length > 0 && (
            <div className="space-y-2">
              {categories.map((category) => {
                const weight = criteria.skills[category] || 0
                return (
                  <div key={category} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="p-1 bg-veo-green/10 rounded">
                        <Brain className="h-3 w-3 text-veo-green" />
                      </div>
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {category}
                      </span>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-veo-green/10 text-veo-green text-xs font-bold">
                        {weight}%
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Languages */}
          {allLanguages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mt-3">
                <Languages className="h-3 w-3" />
                Languages
              </div>
              {allLanguages.map((language: string) => {
                const weight = criteria.skills[language] || 0
                return (
                  <div key={language} className="flex items-center justify-between py-1 pl-6">
                    <span className="text-sm text-gray-800 truncate">
                      {language}
                    </span>
                    <Badge variant="secondary" className="bg-veo-green/10 text-veo-green text-xs font-bold">
                      {weight}%
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t">
          <Button 
            onClick={onConfigureClick}
            variant="outline"
            className="w-full text-veo-green border-veo-green hover:bg-veo-green/10"
          >
            <Settings className="h-4 w-4 mr-2" />
            Modify Criteria
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}