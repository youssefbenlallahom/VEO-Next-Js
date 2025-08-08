"use client"

import React from "react"
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

interface AssessmentCriteriaSidebarProps {
  jobTitle: string
  onConfigureClick: () => void
}

export function AssessmentCriteriaSidebar({ jobTitle, onConfigureClick }: AssessmentCriteriaSidebarProps) {
  // Get job-specific assessment criteria
  const getJobAssessmentCriteria = (): AssessmentCriteria | null => {
    try {
      const saved = JSON.parse(localStorage.getItem('job-skills-barems') || '[]')
      return saved.find((barem: any) => barem.jobTitle === jobTitle) || null
    } catch {
      return null
    }
  }

  const criteria = getJobAssessmentCriteria()

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

  // Separate categories and languages
  const categories = Object.keys(criteria.categorizedSkills || {}).filter(cat => cat !== 'Languages')
  const languages = criteria.categorizedSkills?.['Languages'] || []

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
          {languages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mt-3">
                <Languages className="h-3 w-3" />
                Languages
              </div>
              {languages.map((language: string) => {
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