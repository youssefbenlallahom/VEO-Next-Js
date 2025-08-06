"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { useCandidateComparison } from "@/hooks/use-backend-api"
import { GitCompare, Users, Star, Calendar, Lightbulb, AlertTriangle } from "lucide-react"

export function CandidateComparisonComponent() {
  const [candidateIdsInput, setCandidateIdsInput] = useState("")
  const { comparison, loading, error, compare, clear } = useCandidateComparison()

  const handleCompare = () => {
    try {
      const ids = candidateIdsInput
        .split(',')
        .map(id => parseInt(id.trim()))
        .filter(id => !isNaN(id))
      
      if (ids.length < 2) {
        alert("Please enter at least 2 candidate report IDs separated by commas")
        return
      }
      
      compare(ids)
    } catch (err) {
      alert("Please enter valid candidate report IDs separated by commas")
    }
  }

  const handleClear = () => {
    setCandidateIdsInput("")
    clear()
  }

  return (
    <div className="space-y-6">
      {/* Comparison Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Compare Candidates
          </CardTitle>
          <CardDescription>
            Enter candidate report IDs (separated by commas) to compare their performance side by side
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="candidate_ids">Candidate Report IDs</Label>
            <Input
              id="candidate_ids"
              placeholder="e.g., 1, 5, 12, 23"
              value={candidateIdsInput}
              onChange={(e) => setCandidateIdsInput(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter the report IDs you want to compare. You can find these IDs in the search results or database.
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCompare} disabled={loading || !candidateIdsInput.trim()}>
              <GitCompare className="h-4 w-4 mr-2" />
              {loading ? "Comparing..." : "Compare"}
            </Button>
            {comparison.length > 0 && (
              <Button variant="outline" onClick={handleClear}>
                Clear Comparison
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-8 w-20" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={handleCompare} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : comparison.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Comparison Results</h3>
            <Badge variant="secondary">
              {comparison.length} candidate{comparison.length !== 1 ? 's' : ''} compared
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {comparison.map((candidate, index) => (
              <Card key={candidate.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{candidate.candidate_name}</CardTitle>
                      <CardDescription>{candidate.job_title}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1 text-lg font-bold">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {candidate.total_score.toFixed(1)}
                    </Badge>
                  </div>
                  
                  {index === 0 && comparison.length > 1 && candidate.total_score === Math.max(...comparison.map(c => c.total_score)) && (
                    <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-white">
                      Highest Score
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {new Date(candidate.created_at).toLocaleDateString()}
                  </div>

                  <Separator />

                  {/* Strengths */}
                  {candidate.strengths && candidate.strengths.length > 0 && (
                    <div>
                      <h4 className="flex items-center gap-2 font-medium text-sm mb-2 text-green-700">
                        <Lightbulb className="h-4 w-4" />
                        Strengths
                      </h4>
                      <div className="space-y-1">
                        {candidate.strengths.slice(0, 3).map((strength, strengthIndex) => (
                          <div key={strengthIndex} className="text-xs bg-green-50 text-green-800 p-2 rounded">
                            {strength}
                          </div>
                        ))}
                        {candidate.strengths.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{candidate.strengths.length - 3} more strengths
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Gaps */}
                  {candidate.gaps && candidate.gaps.length > 0 && (
                    <div>
                      <h4 className="flex items-center gap-2 font-medium text-sm mb-2 text-red-700">
                        <AlertTriangle className="h-4 w-4" />
                        Areas for Improvement
                      </h4>
                      <div className="space-y-1">
                        {candidate.gaps.slice(0, 2).map((gap, gapIndex) => (
                          <div key={gapIndex} className="text-xs bg-red-50 text-red-800 p-2 rounded">
                            {gap}
                          </div>
                        ))}
                        {candidate.gaps.length > 2 && (
                          <p className="text-xs text-muted-foreground">
                            +{candidate.gaps.length - 2} more areas
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Report ID: {candidate.id}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
