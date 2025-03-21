"use client"

import { Home, Users, Settings } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export function AppSidebar() {
  return (
    <div className="hidden border-r bg-muted/40 md:block w-64">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-6 font-semibold">
          <Link href="/" className="flex items-center gap-2">
            commbank.eth
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-4 text-sm font-medium">
            <Button variant="ghost" size="sm" className="justify-start gap-2" asChild>
              <Link href="/">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="justify-start gap-2" asChild>
              <Link href="/contacts">
                <Users className="h-4 w-4" />
                Contacts
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="justify-start gap-2" asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </Button>
          </nav>
        </div>
        <div className="border-t p-4">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground">
            <div className="text-sm">
              <p className="font-medium">commbank.eth</p>
              <p className="text-xs">Web3 Contact Manager</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

