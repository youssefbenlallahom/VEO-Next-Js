"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Brain,
  Wand2,
  ArrowLeft,
  TrendingUp,
  Check,
  X,
  Save,
  Settings,
} from "lucide-react"

interface JobSkillsModalProps {
  isOpen: boolean
  onClose: () => void
  job: {
    title: string
    description: string
  } | null
}

interface Barem {
  id: string
  name: string
  description: string
  skills: Record<string, number>
  createdDate: string
  jobTitle?: string
}

export function JobSkillsModal({ isOpen, onClose, job }: JobSkillsModalProps) {
  const { toast } = useToast()
  
  // Barem creation states
  const [baremName, setBaremName] = useState("")
  const [baremDescription, setBaremDescription] = useState("")
  // Weights for categories (except Languages)
  const [categoryWeights, setCategoryWeights] = useState<Record<string, number>>({})
  // Weights for individual languages
  const [languageWeights, setLanguageWeights] = useState<Record<string, number>>({})
  // Store categorized skills from API
  const [categorizedSkills, setCategorizedSkills] = useState<Record<string, string[]>>({})
  const [isExtracting, setIsExtracting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentBarem, setCurrentBarem] = useState<Barem | null>(null)

  // Load existing criteria for this job when modal opens
  React.useEffect(() => {
    if (isOpen && job) {
      // Try to load existing criteria for this job
      const existingBarems = JSON.parse(localStorage.getItem('job-skills-barems') || '[]')
      const existingCriteria = existingBarems.find((b: any) => b.jobTitle === job.title)
      
      if (existingCriteria) {
        console.log('📋 Loading existing criteria for job:', job.title)
        // Load the existing weights and skills
        setCategorizedSkills(existingCriteria.categorizedSkills || {})
        
        // Separate category and language weights
        const cats = Object.keys(existingCriteria.categorizedSkills || {}).filter((cat) => cat !== 'Languages')
        const langs = existingCriteria.categorizedSkills?.['Languages'] || []
        
        const catWeights: Record<string, number> = {}
        const langWeights: Record<string, number> = {}
        
        // Distribute the saved weights
        Object.entries(existingCriteria.skills || {}).forEach(([skill, weight]) => {
          if (langs.includes(skill)) {
            langWeights[skill] = weight as number
          } else if (cats.includes(skill)) {
            catWeights[skill] = weight as number
          }
        })
        
        setCategoryWeights(catWeights)
        setLanguageWeights(langWeights)
        setBaremName(existingCriteria.name || `${job.title} - Assessment Criteria`)
        setBaremDescription(existingCriteria.description || `Assessment criteria for ${job.title} position`)
      } else {
        // Reset for new criteria
        setCategoryWeights({})
        setLanguageWeights({})
        setCategorizedSkills({})
        setBaremName("")
        setBaremDescription("")
      }
    } else if (!isOpen) {
      // Reset when closing
      setCategoryWeights({})
      setLanguageWeights({})
      setCategorizedSkills({})
      setBaremName("")
      setBaremDescription("")
      setCurrentBarem(null)
    }
  }, [isOpen, job])

  // AI-powered skill extraction and barem creation (category-based)
  const extractSkillsFromJob = async () => {
    console.log('🎯 EXTRACT SKILLS BUTTON CLICKED!')
    if (!job) return
    setIsExtracting(true)
    setCategoryWeights({})
    setLanguageWeights({})
    setCategorizedSkills({})

    try {
      console.log('📡 Calling /api/extract-skills...')
      console.log('Job title:', job.title)
      console.log('Job description length:', job.description.length)
      
      // 1. Extract skills from job description
      const extractRes = await fetch('/api/extract-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: job.title,
          job_description: job.description,
        }),
      })
      
      console.log('Extract skills response status:', extractRes.status)
      console.log('Extract skills response ok:', extractRes.ok)
      
      if (!extractRes.ok) {
        console.error('Extract skills API failed:', extractRes.status, extractRes.statusText)
        const errorText = await extractRes.text()
        console.error('Error response body:', errorText)
        toast({
          title: "Service Unavailable",
          description: "Skills extraction service is not available. Please add skills manually using the form below.",
          variant: "destructive",
        })
        return
      }
      
      const extractData = await extractRes.json()
      console.log('📊 Skills extraction result:')
      console.log('Extract data:', JSON.stringify(extractData, null, 2))

      // 2. Prepare initial weights
      const cats = extractData.categorized_skills || {}
      console.log('📋 Categorized skills received:', cats)
      setCategorizedSkills(cats)
      // Exclude Languages from categories
      const categoryNames = Object.keys(cats).filter((cat) => cat !== 'Languages')
      const languageSkills = cats['Languages'] || []
      console.log('📂 Category names:', categoryNames)
      console.log('🗣️ Language skills:', languageSkills)
      
      // Distribute 100%: 80% for categories, 20% for languages (modifiable)
      const defaultCatWeight = categoryNames.length > 0 ? Math.floor(80 / categoryNames.length) : 0
      const defaultLangWeight = languageSkills.length > 0 ? Math.floor(20 / languageSkills.length) : 0
      const catRemainder = 80 - defaultCatWeight * categoryNames.length
      const langRemainder = 20 - defaultLangWeight * languageSkills.length
      const initialCatWeights: Record<string, number> = {}
      const initialLangWeights: Record<string, number> = {}
      categoryNames.forEach((cat, idx) => {
        initialCatWeights[cat] = defaultCatWeight + (idx < catRemainder ? 1 : 0)
      })
      languageSkills.forEach((lang: string, idx: number) => {
        initialLangWeights[lang] = defaultLangWeight + (idx < langRemainder ? 1 : 0)
      })
      
      console.log('⚖️ Initial category weights:', initialCatWeights)
      console.log('🗣️ Initial language weights:', initialLangWeights)
      
      setCategoryWeights(initialCatWeights)
      setLanguageWeights(initialLangWeights)

      // Set default name and description automatically
      setBaremName(`${job.title} - Assessment Criteria`)
      setBaremDescription(`Intelligent scoring criteria generated for ${job.title} position`)

    } catch (err) {
      console.error('❌ ERROR in extractSkillsFromJob:', err)
      setCategoryWeights({})
      setLanguageWeights({})
      setCategorizedSkills({})
      setCurrentBarem(null)
      toast({
        title: "Service Error",
        description: "Unable to connect to skills extraction service. Please ensure the backend is running or add skills manually.",
        variant: "destructive",
      })
    } finally {
      setIsExtracting(false)
    }
  }

  // Update category weight
  const updateCategoryWeight = (cat: string, weight: number) => {
    setCategoryWeights((prev) => ({ ...prev, [cat]: weight }))
  }

  // Update language weight
  const updateLanguageWeight = (lang: string, weight: number) => {
    setLanguageWeights((prev) => ({ ...prev, [lang]: weight }))
  }

  // Auto-distribute: 80% for categories, 20% for languages
  const autoDistributeWeights = () => {
    const cats = Object.keys(categorizedSkills).filter((cat) => cat !== 'Languages')
    const langs = categorizedSkills['Languages'] || []
    const defaultCatWeight = cats.length > 0 ? Math.floor(80 / cats.length) : 0
    const defaultLangWeight = langs.length > 0 ? Math.floor(20 / langs.length) : 0
    const catRemainder = 80 - defaultCatWeight * cats.length
    const langRemainder = 20 - defaultLangWeight * langs.length
    const newCatWeights: Record<string, number> = {}
    const newLangWeights: Record<string, number> = {}
    cats.forEach((cat, idx) => {
      newCatWeights[cat] = defaultCatWeight + (idx < catRemainder ? 1 : 0)
    })
    langs.forEach((lang: string, idx: number) => {
      newLangWeights[lang] = defaultLangWeight + (idx < langRemainder ? 1 : 0)
    })
    setCategoryWeights(newCatWeights)
    setLanguageWeights(newLangWeights)
  }

  // Total = sum of all category weights + all language weights
  const getTotalWeight = () => {
    return (
      Object.values(categoryWeights).reduce((sum, w) => sum + w, 0) +
      Object.values(languageWeights).reduce((sum, w) => sum + w, 0)
    )
  }

  // Save barem to database/localStorage (job-specific)
  const saveBarem = async () => {
    if (!job || getTotalWeight() !== 100) return
    
    setIsSaving(true)
    try {
      // Combine all weights
      const skills_weights: Record<string, number> = {}
      
      // For categories, use category names as keys
      Object.keys(categoryWeights).forEach((cat) => {
        skills_weights[cat] = categoryWeights[cat]
      })
      
      // For languages, use individual language names as keys
      Object.keys(languageWeights).forEach((lang) => {
        skills_weights[lang] = languageWeights[lang]
      })

      console.log('💾 Saving job-specific barem with skills weights:', skills_weights)

      // Create barem via API
      const baremRes = await fetch('/api/barem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills_weights,
          categorized_skills: categorizedSkills,
        }),
      })
      
      if (!baremRes.ok) {
        console.error('Barem creation API failed:', baremRes.status, baremRes.statusText)
        const errorText = await baremRes.text()
        console.error('Error response body:', errorText)
        return
      }
      
      const baremData = await baremRes.json()
      console.log('✅ BAREM SAVED SUCCESSFULLY!')
      console.log('Saved barem data:', JSON.stringify(baremData, null, 2))

      setCurrentBarem(baremData.barem)

      // Save to localStorage with job title as unique identifier
      const existingBarems = JSON.parse(localStorage.getItem('job-skills-barems') || '[]')
      
      // Remove any existing criteria for this job
      const filteredBarems = existingBarems.filter((b: any) => b.jobTitle !== job.title)
      
      // Add the new criteria for this job
      const savedBarem = {
        id: `${job.title}-${Date.now()}`,
        name: baremName,
        description: baremDescription,
        skills: skills_weights,
        createdDate: new Date().toISOString(),
        jobTitle: job.title,
        categorizedSkills,
      }

      filteredBarems.push(savedBarem)
      localStorage.setItem('job-skills-barems', JSON.stringify(filteredBarems))

      console.log('💾 Saved criteria for job:', job.title)
      
      // Close modal after successful save
      onClose()
      
    } catch (err) {
      console.error('❌ ERROR saving barem:', err)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !job) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="bg-veo-green text-white p-4 -m-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Job Skills Configuration</DialogTitle>
              <p className="text-white/90 text-sm">
                Configure skill weights and assessment criteria for "{job.title}"
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {Object.keys(categorizedSkills).length === 0 ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-veo-green/10 rounded-full mb-4">
                  <Brain className="h-4 w-4 text-veo-green" />
                  <span className="text-sm font-medium text-veo-green">AI-Powered Skills Extraction</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Generate Job Skills Assessment</h3>
                <p className="text-gray-600 mb-6">
                  Our AI will analyze "<strong>{job.title}</strong>" requirements to automatically extract
                  relevant skills and suggest optimal weights for evaluation criteria.
                </p>

                <Button
                  onClick={extractSkillsFromJob}
                  disabled={isExtracting}
                  size="lg"
                  className="bg-veo-green hover:bg-veo-green/90 text-white px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  {isExtracting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Extracting Skills...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5 mr-2" />
                      Extract Job Skills
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-veo-green/10 rounded-full mb-3">
                  <div className="p-0.5 bg-veo-green rounded-full">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-veo-green">Skills Extracted Successfully!</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Configure Assessment Criteria</h3>
                <p className="text-gray-600 text-sm">
                  Adjust the weights for each skill category and language for "{job.title}".
                </p>
              </div>

              {/* Total Weight Display */}
              <div className="flex items-center justify-between mb-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-white rounded shadow-sm">
                    <TrendingUp className="h-4 w-4 text-gray-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Total Weight</h4>
                    <p className="text-xs text-gray-600">Must equal 100%</p>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`text-xl font-bold ${getTotalWeight() === 100 ? "text-veo-green" : "text-red-500"}`}
                  >
                    {getTotalWeight()}%
                  </div>
                  {getTotalWeight() !== 100 && (
                    <p className="text-xs text-red-500">
                      {getTotalWeight() > 100 ? "Reduce by" : "Add"} {Math.abs(100 - getTotalWeight())}%
                    </p>
                  )}
                </div>
              </div>

              {/* Auto-distribute button */}
              <div className="flex gap-2 mb-4">
                <Button
                  onClick={autoDistributeWeights}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-xs"
                >
                  <Wand2 className="h-3 w-3" />
                  Auto-Distribute (80% Categories / 20% Languages)
                </Button>
                <Button
                  onClick={() => {
                    setCategoryWeights({})
                    setLanguageWeights({})
                    setCategorizedSkills({})
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-xs"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Regenerate
                </Button>
              </div>

              {/* Category weights sliders */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {Object.keys(categorizedSkills).filter((cat) => cat !== 'Languages').map((cat) => (
                  <div key={cat} className="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-veo-green/10 rounded">
                          <Brain className="h-3 w-3 text-veo-green" />
                        </div>
                        <span className="font-medium text-gray-900 text-sm">{cat}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-veo-green">{categoryWeights[cat] || 0}%</div>
                      </div>
                    </div>
                    <Slider
                      value={[categoryWeights[cat] || 0]}
                      onValueChange={(value) => updateCategoryWeight(cat, value[0])}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    {/* Show skills in this category */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {categorizedSkills[cat].map((skill: string) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
                
                {/* Language weights sliders */}
                {categorizedSkills['Languages'] && (
                  <div className="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-all">
                    <div className="font-medium text-gray-900 text-sm mb-2 flex items-center gap-2">
                      <div className="p-1 bg-veo-green/10 rounded">
                        <Brain className="h-3 w-3 text-veo-green" />
                      </div>
                      Languages
                    </div>
                    {categorizedSkills['Languages'].map((lang: string) => (
                      <div key={lang} className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-800">{lang}</span>
                          <span className="text-sm font-bold text-veo-green">{languageWeights[lang] || 0}%</span>
                        </div>
                        <Slider
                          value={[languageWeights[lang] || 0]}
                          onValueChange={(value) => updateLanguageWeight(lang, value[0])}
                          max={100}
                          step={1}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {Object.keys(categorizedSkills).length > 0 && (
          <div className="border-t bg-gray-50 p-4 -m-6 mt-6">
            <div className="flex gap-3">
              <Button onClick={onClose} variant="outline" className="flex-1 h-10">
                Cancel
              </Button>
              <Button
                onClick={saveBarem}
                disabled={getTotalWeight() !== 100 || isSaving}
                className="flex-1 h-10 bg-veo-green hover:bg-veo-green/90 text-white"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Assessment Criteria
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
