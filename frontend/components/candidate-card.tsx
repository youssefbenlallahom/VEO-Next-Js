import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Calendar, Briefcase, Eye, MessageSquare } from "lucide-react"

interface Candidate {
  id: number
  name: string
  email: string
  position: string
  aiScore: number
  status: string
  appliedDate: string
  experience: string
  location: string
  skills: string[]
  avatar: string
}

interface CandidateCardProps {
  candidate: Candidate
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800 border-green-200"
    if (score >= 80) return "bg-blue-100 text-blue-800 border-blue-200"
    if (score >= 70) return "bg-yellow-100 text-yellow-800 border-yellow-200"
    return "bg-red-100 text-red-800 border-red-200"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New Application":
        return "bg-blue-100 text-blue-800"
      case "Under Review":
        return "bg-yellow-100 text-yellow-800"
      case "Interview Scheduled":
        return "bg-purple-100 text-purple-800"
      case "Final Round":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={candidate.avatar || "/placeholder.svg"} alt={candidate.name} />
              <AvatarFallback>
                {candidate.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{candidate.name}</h3>
              <p className="text-sm text-gray-600">{candidate.email}</p>
            </div>
          </div>
          <Badge className={`${getScoreColor(candidate.aiScore)} font-bold text-lg px-3 py-1`}>
            {candidate.aiScore}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">{candidate.position}</h4>
          <Badge className={getStatusColor(candidate.status)}>{candidate.status}</Badge>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{candidate.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span>{candidate.experience} experience</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Applied {candidate.appliedDate}</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Key Skills</p>
          <div className="flex flex-wrap gap-1">
            {candidate.skills.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {candidate.skills.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{candidate.skills.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1 bg-veo-green hover:bg-veo-green/90">
            <Eye className="h-4 w-4 mr-2" />
            View Profile
          </Button>
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
