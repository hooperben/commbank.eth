import { Home, Loader2, Settings, Users } from "lucide-react";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";
import { getRegisteredUsername } from "@/lib/passkey";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <div className="flex items-center font-semibold px-2 py-4">
          <Link href="/" className="flex items-center gap-2">
            commbank.eth
          </Link>
          <Badge variant="default" className="ml-2">
            beta
          </Badge>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            {items.map((item) => (
              <SidebarMenuItem key={item.href}>
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
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="w-full">
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
