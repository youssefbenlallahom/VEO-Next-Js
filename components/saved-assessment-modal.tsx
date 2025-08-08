"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Brain,
  Plus,
  Calendar,
  Trash2,
  Eye,
  Settings,
  X,
  Play,
} from "lucide-react"

interface SavedAssessmentModalProps {
  isOpen: boolean
  onClose: () => void
  job: {
    title: string
    description: string
  } | null
  selectedApplicants: number[]
  onStartAnalysis: (barem: any) => void
}

interface SavedBarem {
  id: string
  name: string
  description: string
  skills: Record<string, number>
  createdDate: string
  jobTitle?: string
  categorizedSkills?: Record<string, string[]>
}

export function SavedAssessmentModal({ 
  isOpen, 
  onClose, 
  job, 
  selectedApplicants, 
  onStartAnalysis 
}: SavedAssessmentModalProps) {
  const [savedBarems, setSavedBarems] = useState<SavedBarem[]>([])
  const [selectedBarem, setSelectedBarem] = useState<string>("")
  const [viewingBarem, setViewingBarem] = useState<SavedBarem | null>(null)

  // Load saved barems from localStorage
  useEffect(() => {
    if (isOpen) {
      const saved = JSON.parse(localStorage.getItem('job-skills-barems') || '[]')
      setSavedBarems(saved)
    }
  }, [isOpen])

  // Delete a saved barem
  const deleteBarem = (id: string) => {
    const updated = savedBarems.filter(b => b.id !== id)
    setSavedBarems(updated)
    localStorage.setItem('job-skills-barems', JSON.stringify(updated))
    if (selectedBarem === id) {
      setSelectedBarem("")
    }
  }

  // Get the selected barem object
  const getSelectedBaremObject = () => {
    return savedBarems.find(b => b.id === selectedBarem)
  }

  // Start analysis with selected barem
  const handleStartAnalysis = () => {
    const barem = getSelectedBaremObject()
    if (barem) {
      // Convert the saved barem to the format expected by the analysis
      const analysisData = {
        barem: {
          skills: barem.skills,
          categorized_skills: barem.categorizedSkills || {}
        }
      }
      onStartAnalysis(analysisData.barem)
      onClose()
    }
  }

  if (!isOpen || !job) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <DialogHeader className="bg-veo-green text-white p-4 -m-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Select Assessment Criteria</DialogTitle>
                <p className="text-white/90 text-sm">
                  Choose from saved assessment criteria for {selectedApplicants.length} selected candidates
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {savedBarems.length === 0 ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center max-w-md">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4">
                    <Settings className="h-8 w-8 text-gray-400 mx-auto mt-1" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">No Assessment Criteria Found</h3>
                  <p className="text-gray-600 mb-6">
                    You need to create assessment criteria first before running AI analysis.
                    Use the "Configure Job Skills" button to create your first assessment.
                  </p>
                  <Button onClick={onClose} variant="outline">
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Selection */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-green-900 mb-2">Select Assessment Criteria</h3>
                  <p className="text-sm text-green-700 mb-4">
                    Choose which assessment criteria to use for analyzing the selected candidates.
                  </p>
                  <Select value={selectedBarem} onValueChange={setSelectedBarem}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select assessment criteria..." />
                    </SelectTrigger>
                    <SelectContent>
                      {savedBarems.map((barem) => (
                        <SelectItem key={barem.id} value={barem.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{barem.name}</span>
                            {barem.jobTitle && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {barem.jobTitle}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selected Barem Details */}
                {selectedBarem && getSelectedBaremObject() && (
                  <Card className="border-green-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Brain className="h-5 w-5 text-green-600" />
                        {getSelectedBaremObject()!.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{getSelectedBaremObject()!.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Assessment Details</h4>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span>Created:</span>
                              <span>{new Date(getSelectedBaremObject()!.createdDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Skills Count:</span>
                              <span>{Object.keys(getSelectedBaremObject()!.skills).length}</span>
                            </div>
                            {getSelectedBaremObject()!.jobTitle && (
                              <div className="flex justify-between">
                                <span>Original Job:</span>
                                <span>{getSelectedBaremObject()!.jobTitle}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Skills & Weights</h4>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {Object.entries(getSelectedBaremObject()!.skills).map(([skill, weight]) => (
                              <div key={skill} className="flex justify-between text-sm">
                                <span className="text-gray-700 truncate">{skill}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {weight}%
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* All Saved Barems List */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">All Saved Assessment Criteria</h3>
                  <div className="grid gap-4">
                    {savedBarems.map((barem) => (
                      <Card key={barem.id} className={`transition-all hover:shadow-md ${
                        selectedBarem === barem.id ? 'ring-2 ring-green-500 border-green-200' : ''
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-900">{barem.name}</h4>
                                {barem.jobTitle && (
                                  <Badge variant="outline" className="text-xs">
                                    {barem.jobTitle}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{barem.description}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(barem.createdDate).toLocaleDateString()}
                                </div>
                                <span>{Object.keys(barem.skills).length} skills</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewingBarem(barem)}
                                className="h-8 w-8 p-0"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteBarem(barem.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {savedBarems.length > 0 && (
            <div className="border-t bg-gray-50 p-4 -m-6 mt-6">
              <div className="flex gap-3">
                <Button onClick={onClose} variant="outline" className="flex-1 h-10">
                  Cancel
                </Button>
                <Button
                  onClick={handleStartAnalysis}
                  disabled={!selectedBarem}
                  className="flex-1 h-10 bg-veo-green hover:bg-veo-green/90 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start AI Analysis
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Barem Details Modal */}
      <Dialog open={!!viewingBarem} onOpenChange={() => setViewingBarem(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Assessment Details: {viewingBarem?.name}
            </DialogTitle>
          </DialogHeader>
          {viewingBarem && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-700">{viewingBarem.description}</p>
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 font-medium">{new Date(viewingBarem.createdDate).toLocaleDateString()}</span>
                  </div>
                  {viewingBarem.jobTitle && (
                    <div>
                      <span className="text-gray-600">Job Title:</span>
                      <span className="ml-2 font-medium">{viewingBarem.jobTitle}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Skills & Weights</h4>
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {Object.entries(viewingBarem.skills).map(([skill, weight]) => (
                    <div key={skill} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-gray-900">{skill}</span>
                      <Badge variant="secondary">{weight}%</Badge>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={() => setViewingBarem(null)} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
