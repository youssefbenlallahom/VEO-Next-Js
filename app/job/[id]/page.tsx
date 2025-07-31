import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { JobDetailView } from "@/components/job-detail-view"

interface JobPageProps {
  params: {
    id: string
  }
}

export default async function JobPage({ params }: JobPageProps) {
  const { id } = await params
  
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="bg-gray-50 md:ml-[16rem]">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <JobDetailView jobId={id} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
