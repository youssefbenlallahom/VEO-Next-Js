"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface PDFViewerProps {
  cvUrl: string
  candidateName?: string
}

export default function PDFViewer({ cvUrl, candidateName }: PDFViewerProps) {
  return (
    <div className="flex flex-col h-full">
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-2 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {candidateName ? `${candidateName}'s Resume` : 'Resume'}
          </span>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.open(cvUrl, '_blank')}
          className="bg-white hover:bg-blue-50 border-blue-200 text-blue-600 shadow-sm px-3 py-1 h-auto text-xs"
        >
          <Download className="h-4 w-4 mr-1" />
          Download
        </Button>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src={cvUrl}
          className="w-full h-full border-0"
          title={`CV for ${candidateName || 'Candidate'}`}
        />
      </div>
    </div>
  )
}