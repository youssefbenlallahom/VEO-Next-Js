"use client"

import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function DashboardHeader() {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 animate-slideDown">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 animate-slideRight">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">HR Dashboard</h1>
        </div>

        <div className="flex items-center gap-4 animate-slideIn">
          <div className="relative form-field">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search candidates, jobs..."
              className="pl-10 w-80 h-10 border-gray-200 focus:border-veo-green focus:ring-veo-green/20"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="relative hover-lift hover:bg-gray-50 transition-all duration-200"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-veo-green text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce-gentle">
              3
            </span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover-scale">
                <Avatar className="h-10 w-10 ring-2 ring-gray-100 hover:ring-veo-green/30 transition-all">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User" />
                  <AvatarFallback className="bg-veo-green/10 text-veo-green font-semibold">HR</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 animate-scaleIn" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">HR Manager</p>
                  <p className="text-xs leading-none text-muted-foreground">hr@veoworldwide.com</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:bg-gray-50 transition-colors">Profile</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-50 transition-colors">Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="hover:bg-red-50 hover:text-red-600 transition-colors">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
