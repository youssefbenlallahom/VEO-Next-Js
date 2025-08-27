import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { JobsDashboard } from "@/components/jobs-dashboard"

export default function Dashboard() {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="bg-gray-50 md:ml-[16rem]">
        <DashboardHeader />
        <main className="flex-1 p-6">
          <JobsDashboard />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
