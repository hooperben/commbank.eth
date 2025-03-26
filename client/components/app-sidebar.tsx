"use client";

import { Home, Loader2, Settings, Users } from "lucide-react";
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
import { useAuth } from "@/lib/auth-context";
import { getRegisteredUsername } from "@/lib/passkey";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

// Menu items.
const items = [
  {
    href: "/",
    icon: Home,
    label: "Dashboard",
  },
  {
    href: "/home/",
    icon: Users,
    label: "My Account",
  },
  {
    href: "/settings/",
    icon: Settings,
    label: "Settings",
  },
];

export function AppSidebar() {
  const { isSignedIn, signOut, handleSignIn } = useAuth();
  const pathname = usePathname();

  const { data: isRegisteredUsername, isLoading: isLoadingUsername } = useQuery(
    {
      queryKey: ["registered-username"],
      queryFn: async () => {
        const username = await getRegisteredUsername();
        return { username };
      },
    },
  );

  return (
    <Sidebar className="bg-white dark:bg-black">
      <SidebarHeader className="bg-background">
        <div className="flex h-14 items-center border-b px-6 font-semibold">
          <Link href="/" className="flex items-center gap-2">
            commbank.eth
          </Link>
          <Badge variant="default" className="ml-2">
            beta
          </Badge>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-white dark:bg-black">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="px-3">
              {items.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    className={pathname === item.href ? "text-primary" : ""}
                  >
                    <Link href={item.href}>
                      <item.icon
                        className={pathname === item.href ? "text-primary" : ""}
                      />
                      <span
                        className={pathname === item.href ? "text-primary" : ""}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-white dark:bg-black">
        <div className="border-t w-full">
          <div className="flex flex-col w-full gap-2 rounded-lg px-3 py-2 text-muted-foreground">
            {isLoadingUsername && (
              <Button className="w-full" disabled variant="outline">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              </Button>
            )}

            {isSignedIn && (
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

            {isRegisteredUsername?.username && !isSignedIn && (
              <Button
                onClick={() => {
                  handleSignIn();
                }}
              >
                Login
              </Button>
            )}
            {!isRegisteredUsername && !isSignedIn && (
              <Button asChild>
                <Link href="/home">Register</Link>
              </Button>
            )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
