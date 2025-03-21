"use client";

import Link from "next/link";

import { ThemeToggle } from "@/components/theme-toggle";
import SideBarContent from "@/components/sidebar/sidebar-content";

export function AppSidebar() {
  return (
    <div className="hidden border-r md:block w-64">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-6 font-semibold">
          <Link href="/" className="flex items-center gap-2">
            commbank.eth
          </Link>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>

        <SideBarContent />
        <div className="border-t p-4">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground">
            <div className="text-sm"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
