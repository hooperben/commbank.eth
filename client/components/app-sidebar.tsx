import { Home, Users } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
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
  const pathname = usePathname();

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
          <SidebarGroupContent>
            <SidebarMenu className="px-3">
              {items.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    className={pathname === item.href ? "text-primary" : ""}
                  >
                    <a href={item.href}>
                      <item.icon
                        className={pathname === item.href ? "text-primary" : ""}
                      />
                      <span
                        className={pathname === item.href ? "text-primary" : ""}
                      >
                        {item.label}
                      </span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="border-t w-full">
          <div className="flex flex-col w-full gap-2 rounded-lg px-3 py-2 text-muted-foreground">
            <ThemeToggle />

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
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
