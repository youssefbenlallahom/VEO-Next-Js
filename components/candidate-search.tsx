"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCandidateSearch } from "@/hooks/use-backend-api"
import { Search, Filter, User, Calendar, Star } from "lucide-react"

export function CandidateSearchComponent() {
  const [searchFilters, setSearchFilters] = useState({
    name: "",
    min_score: "",
    max_score: "",
    job_title: "",
    limit: 50
  })

  const { candidates, count, loading, error, search } = useCandidateSearch()

  const handleSearch = () => {
    const filters: any = {}
    if (searchFilters.name) filters.name = searchFilters.name
    if (searchFilters.min_score) filters.min_score = parseFloat(searchFilters.min_score)
    if (searchFilters.max_score) filters.max_score = parseFloat(searchFilters.max_score)
    if (searchFilters.job_title) filters.job_title = searchFilters.job_title
    if (searchFilters.limit) filters.limit = searchFilters.limit

    search(filters)
  }

  const handleClearFilters = () => {
    setSearchFilters({
      name: "",
      min_score: "",
      max_score: "",
      job_title: "",
      limit: 50
    })
  }

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Candidates
          </CardTitle>
          <CardDescription>
            Find candidates using various filters and criteria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="name">Candidate Name</Label>
              <Input
                id="name"
                placeholder="Enter name..."
                value={searchFilters.name}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_title">Job Title</Label>
              <Input
                id="job_title"
                placeholder="Enter job title..."
                value={searchFilters.job_title}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, job_title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_score">Min Score</Label>
              <Input
                id="min_score"
                type="number"
                step="0.1"
                placeholder="0"
                value={searchFilters.min_score}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, min_score: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_score">Max Score</Label>
              <Input
                id="max_score"
                type="number"
                step="0.1"
                placeholder="100"
                value={searchFilters.max_score}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, max_score: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Results Limit</Label>
              <Select
                value={searchFilters.limit.toString()}
                onValueChange={(value) => setSearchFilters(prev => ({ ...prev, limit: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 results</SelectItem>
                  <SelectItem value="25">25 results</SelectItem>
                  <SelectItem value="50">50 results</SelectItem>
                  <SelectItem value="100">100 results</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              {loading ? "Searching..." : "Search"}
            </Button>
            <Button variant="outline" onClick={handleClearFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      <Card>
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
          {count > 0 && (
            <CardDescription>
              Found {count} candidate{count !== 1 ? 's' : ''}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={handleSearch} variant="outline">
                Try Again
              </Button>
            </div>
          ) : candidates.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                No candidates found matching your criteria
              </p>
              <Button onClick={handleSearch} variant="outline">
                Search All Candidates
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {candidates.map((candidate) => (
                <div key={candidate.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{candidate.candidate_name}</h4>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {candidate.total_weighted_score.toFixed(1)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    Applied for: <span className="font-medium">{candidate.applied_job_title}</span>
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(candidate.created_at).toLocaleDateString()}
                    </span>
                    <span>ID: {candidate.id}</span>
                  </div>

                  {candidate.strengths && candidate.strengths.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {candidate.strengths.slice(0, 3).map((strength, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {strength}
                        </Badge>
                      ))}
                      {candidate.strengths.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{candidate.strengths.length - 3} more
                        </Badge>
                      )}
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
