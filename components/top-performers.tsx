"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useTopPerformers } from "@/hooks/use-backend-api"
import { Trophy, Star, Briefcase, Calendar, Filter } from "lucide-react"

export function TopPerformersComponent() {
  const [limit, setLimit] = useState(10)
  const [jobTitle, setJobTitle] = useState("")
  const { topPerformers, loading, error, refetch } = useTopPerformers(limit, jobTitle || undefined)

  const handleApplyFilters = () => {
    refetch()
  }

  const handleClearFilters = () => {
    setJobTitle("")
    setLimit(10)
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-600" />
            Top Performers
          </CardTitle>
          <CardDescription>
            View the highest scoring candidates across all positions or filter by specific job title
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="job_filter">Filter by Job Title (Optional)</Label>
              <Input
                id="job_filter"
                placeholder="Enter job title..."
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit_select">Number of Results</Label>
              <Select
                value={limit.toString()}
                onValueChange={(value) => setLimit(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">Top 5</SelectItem>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="20">Top 20</SelectItem>
                  <SelectItem value="50">Top 50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleApplyFilters} disabled={loading}>
                <Filter className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          {topPerformers.length > 0 && (
            <CardDescription>
              Showing top {topPerformers.length} performer{topPerformers.length !== 1 ? 's' : ''}
              {jobTitle && ` for "${jobTitle}"`}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: limit }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-4 w-48 mb-2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={refetch} variant="outline">
                Try Again
              </Button>
            </div>
          ) : topPerformers.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No performers found matching your criteria
              </p>
              <Button onClick={handleClearFilters} variant="outline">
                View All Top Performers
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {topPerformers.map((performer, index) => (
                <div key={performer.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold">{performer.candidate_name}</h4>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {performer.job_title}
                        </p>
                      </div>
                    </div>
                    
                    <Badge variant="secondary" className="flex items-center gap-1 text-lg font-bold">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {performer.score.toFixed(1)}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(performer.created_at).toLocaleDateString()}
                    </span>
                    <span>Report ID: {performer.id}</span>
                  </div>

                  {performer.strengths && performer.strengths.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Top Strengths:</p>
                      <div className="flex flex-wrap gap-1">
                        {performer.strengths.map((strength, strengthIndex) => (
                          <Badge key={strengthIndex} variant="outline" className="text-xs">
                            {strength}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
