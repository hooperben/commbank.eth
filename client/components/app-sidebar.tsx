import { Home, Settings, Users } from "lucide-react";
import * as React from "react";

import AccountManager from "@/components/account-manager";
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
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useAuth } from "@/lib/auth-context";

// Menu items.
const items = [
  {
    href: "/",
    icon: Home,
    label: "Dashboard",
  },
  {
    href: "/account/",
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
  const pathname = usePathname();

  const { isConnected } = useAccount();
  const { isSignedIn } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { isMobile, toggleSidebar } = useSidebar();

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader className="bg-white dark:bg-black -z-10">
        <div className="flex items-center font-semibold px-2 py-4">
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
          <SidebarMenu className="gap-2">
            {items.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  className={pathname === item.href ? "text-primary" : ""}
                  onClick={() => isMobile && toggleSidebar()}
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

      <SidebarFooter className="bg-white dark:bg-black">
        <AccountManager
          open={isModalOpen}
          onOpenChange={() => setIsModalOpen(false)}
        />
        {(isConnected || isSignedIn) && (
          <Button onClick={() => setIsModalOpen(true)}>My Account</Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
