import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, TrendingUp, Clock } from "lucide-react"

export function StatsCards() {
  const stats = [
    {
      title: "Total Candidates",
      value: "247",
      change: "+12%",
      changeType: "positive" as const,
      icon: Users,
      description: "from last month",
    },
    {
      title: "Active Job Postings",
      value: "18",
      change: "+3",
      changeType: "positive" as const,
      icon: Briefcase,
      description: "new this week",
    },
    {
      title: "Avg. AI Score",
      value: "84.2%",
      change: "+2.1%",
      changeType: "positive" as const,
      icon: TrendingUp,
      description: "quality improvement",
    },
    {
      title: "Pending Reviews",
      value: "23",
      change: "-5",
      changeType: "negative" as const,
      icon: Clock,
      description: "from yesterday",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-veo-green" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <p className="text-xs text-gray-600 mt-1">
              <span className={`font-medium ${stat.changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
                {stat.change}
              </span>{" "}
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
