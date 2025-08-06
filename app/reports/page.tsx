"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DatabaseStatsOverview } from "@/components/database-stats-overview"
import { CandidateSearchComponent } from "@/components/candidate-search"
import { TopPerformersComponent } from "@/components/top-performers"
import { CandidateComparisonComponent } from "@/components/candidate-comparison"
import { BarChart3, Search, Trophy, Database, GitCompare } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive insights into candidate performance and recruitment analytics
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search
          </TabsTrigger>
          <TabsTrigger value="performers" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Top Performers
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2">
            <GitCompare className="h-4 w-4" />
            Compare
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DatabaseStatsOverview />
        </TabsContent>

        <TabsContent value="search" className="space-y-6">
          <CandidateSearchComponent />
        </TabsContent>

        <TabsContent value="performers" className="space-y-6">
          <TopPerformersComponent />
        </TabsContent>

        <TabsContent value="compare" className="space-y-6">
          <CandidateComparisonComponent />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Advanced Analytics
              </CardTitle>
              <CardDescription>
                Detailed performance metrics and trending data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                <p className="text-muted-foreground">
                  Advanced analytics dashboard with charts, trends, and detailed insights
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
