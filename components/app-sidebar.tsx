"use client"

import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Briefcase, Users, BarChart3 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const menuItems = [
  {
    title: "Job Openings",
    url: "/",
    icon: Briefcase,
  },
  {
    title: "All Candidates",
    url: "/candidates",
    icon: Users,
  },
  {
    title: "Reports & Analytics",
    url: "/reports",
    icon: BarChart3,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar className="border-r border-gray-200 animate-slideRight">
      <SidebarHeader className="p-6 border-b border-gray-200 animate-fadeIn">
        <div className="flex items-center gap-3 hover-scale">
          <div className="relative">
            <Image
              src="/images/veo-logo.png"
              alt="Veo Worldwide Services"
              width={40}
              height={40}
              className="rounded-lg shadow-soft hover-glow transition-all"
            />
          </div>
          <div>
            <h2 className="font-bold text-lg text-gray-900">Veo Worldwide</h2>
            <p className="text-sm text-gray-600">HR Dashboard</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="animate-slideUp">
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-700 font-medium text-sm">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item, index) => (
                <SidebarMenuItem
                  key={item.title}
                  className="animate-slideIn"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="sidebar-item data-[active=true]:bg-veo-green data-[active=true]:text-white hover:bg-veo-green/10 hover:text-veo-green transition-all duration-200 rounded-lg"
                  >
                    <Link href={item.url} className="flex items-center gap-3 px-3 py-2">
                      <item.icon className="h-4 w-4" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
