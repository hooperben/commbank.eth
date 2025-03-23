import { Calendar, Home, Inbox, Search, Settings, Users } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { Button } from "./ui/button";
import ThemeToggle from "./theme-toggle";
import { useAuth } from "@/lib/auth-context";

// Menu items.
const items = [
  {
    href: "/",
    icon: Home,
    label: "Dashboard",
  },
  {
    href: "/home",
    icon: Users,
    label: "My Account",
  },
];

export function AppSidebar() {
  const { token, signOut } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex h-14 items-center border-b px-6 font-semibold">
          <Link href="/" className="flex items-center gap-2">
            commbank.eth
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton asChild>
                    <a href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="border-t p-4">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground">
            <div className="text-sm">
              <div>
                {token && (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {
                      signOut();
                    }}
                  >
                    Logout
                  </Button>
                )}

                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
