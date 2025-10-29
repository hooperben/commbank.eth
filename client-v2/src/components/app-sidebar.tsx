"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Home, Users, Settings } from "lucide-react";
import { Link } from "react-router-dom";

// Menu items
const items = [
  {
    href: "/",
    icon: Home,
    label: "Home",
  },
  {
    href: "/account/",
    icon: Users,
    label: "Account",
  },
  {
    href: "/settings/",
    icon: Settings,
    label: "Settings",
  },
];

function LogoIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 8L12 3L21 8V16L12 21L3 16V8Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 3V21" stroke="currentColor" strokeWidth="2" />
      <path d="M3 8L21 16" stroke="currentColor" strokeWidth="2" />
      <path d="M21 8L3 16" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold px-4 py-6">
            {open ? (
              <>
                commbank.eth
                <span className="ml-2 text-xs bg-orange-500 text-white px-2 py-0.5 rounded">
                  beta
                </span>
              </>
            ) : (
              <div className="flex items-center justify-center w-full">
                <LogoIcon />
              </div>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <Link to={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
