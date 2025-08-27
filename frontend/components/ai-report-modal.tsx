"use client"

import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Star, Calendar, CheckCircle, AlertTriangle, TrendingUp } from "lucide-react"

interface AIReportModalProps {
  isOpen: boolean
  onClose: () => void
  candidate: {
    id: number
    name: string
    hasAIReport: boolean
    aiScore: number
    actualScore?: number
    reportId: number | null
    strengths: string[]
    gaps: string[]
    scoreDetails: any
    reportDate: string | null
  } | null
}

export function AIReportModal({ isOpen, onClose, candidate }: AIReportModalProps) {
  if (!candidate || !candidate.hasAIReport) return null

  // Parse and format score details
  const formatScoreDetails = (scoreDetails: any) => {
    if (!scoreDetails) return []

    try {
      const details = typeof scoreDetails === 'string' ? JSON.parse(scoreDetails) : scoreDetails
      
      if (Array.isArray(details)) {
        return details.map((section: any, index: number) => ({
          id: index,
          section: section.section || `Section ${index + 1}`,
          raw_score: section.raw_score || 0,
          weight: section.weight || 0,
          weighted_score: section.weighted_score || 0
        }))
      }
      
      return Object.entries(details).map(([key, value]: [string, any], index) => ({
        id: index,
        section: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        raw_score: value.raw_score || value.score || 0,
        weight: value.weight || 1,
        weighted_score: value.weighted_score || value.score || 0
      }))
    } catch (error) {
      console.error('Error parsing score details:', error)
      return []
    }
  }

  const scoreBreakdown = formatScoreDetails(candidate.scoreDetails)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-600 rounded-full flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-purple-900">AI Analysis Report</span>
              <p className="text-sm text-purple-700 font-normal">{candidate.name}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Score */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-900">{candidate.aiScore}/10</div>
                <div className="text-xs font-medium text-purple-700">Overall Score</div>
              </div>
              {candidate.reportDate && (
                <div className="text-sm text-purple-700">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Analyzed on {new Date(candidate.reportDate).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-purple-600">Report ID: {candidate.reportId}</div>
                </div>
              )}
            </div>
          </div>

          {/* Strengths and Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {candidate.strengths && candidate.strengths.length > 0 ? (
                  candidate.strengths.map((strength, idx) => (
                    <div key={idx} className="p-3 bg-green-50 text-green-800 rounded-lg border border-green-200">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{strength}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No strengths recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {candidate.gaps && candidate.gaps.length > 0 ? (
                  candidate.gaps.map((gap, idx) => (
                    <div key={idx} className="p-3 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{gap}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No improvement areas recorded</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Score Breakdown */}
          {scoreBreakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-800">
                  <TrendingUp className="h-5 w-5" />
                  Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scoreBreakdown.map((section) => (
                    <div key={section.id} className="p-4 bg-gray-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{section.section}</h4>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {typeof section.weighted_score === 'number' ? section.weighted_score.toFixed(2) : section.weighted_score}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex justify-between">
                          <span>Raw Score:</span>
                          <span className="font-medium">{typeof section.raw_score === 'number' ? section.raw_score.toFixed(2) : section.raw_score}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Weight:</span>
                          <span className="font-medium">{typeof section.weight === 'number' ? section.weight.toFixed(2) : section.weight}</span>
                        </div>
                      </div>

                      {/* Visual score bar */}
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ 
                              width: `${Math.min(100, Math.max(0, (section.raw_score / 10) * 100))}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Final Score Summary */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-900 mb-2">
                  Final Score: {candidate.actualScore?.toFixed(2) || candidate.aiScore}/10
                </div>
                <div className="text-sm text-purple-700">
                  {candidate.aiScore >= 8.5 ? "🎉 Highly Recommended" : 
                   candidate.aiScore >= 7 ? "👍 Recommended" : 
                   candidate.aiScore >= 5 ? "⚠️ Consider with Caution" : "❌ Not Recommended"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose} variant="outline">
              Close Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
