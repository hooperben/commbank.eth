import { Home, Settings, Users } from "lucide-react";
import * as React from "react";

import AccountManager from "@/components/account-manager";
import CommBankDotETHLogo from "@/components/commbankdotethlogo";
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

  const { isMobile, toggleSidebar, state } = useSidebar();

  return (
    <Sidebar variant="floating" collapsible="icon" {...props}>
      <SidebarHeader className="bg-white dark:bg-black -z-10">
        <div className="flex items-center font-semibold px-2 py-4">
          <Link
            href="/"
            className="flex items-center group-data-[collapsible=icon]:justify-center"
          >
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
              <div className="w-full h-full relative">
                <div className="ml-[-6px] absolute inset-0 group-data-[collapsible=icon]:scale-[1.1] scale-[1.5] origin-center flex items-center justify-center">
                  <CommBankDotETHLogo />
                </div>
              </div>
            </div>
            <div className="group-data-[collapsible=icon]:hidden flex items-center gap-2">
              <span>commbank.eth</span>
              <Badge variant="default">beta</Badge>
            </div>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-white dark:bg-black">
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            {items.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  size="xl"
                  className={pathname === item.href ? "text-primary" : ""}
                  onClick={() => isMobile && toggleSidebar()}
                  tooltip={state === "collapsed" ? item.label : undefined}
                >
                  <Link href={item.href}>
                    <item.icon
                      className={`${
                        pathname === item.href ? "text-primary" : ""
                      } h-14 w-14`}
                    />
                    <span
                      className={`${
                        pathname === item.href ? "text-primary" : ""
                      } text-base font-medium`}
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
          <Button
            onClick={() => setIsModalOpen(true)}
            className="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:h-10"
          >
            <span className="group-data-[collapsible=icon]:hidden">
              My Account
            </span>
            <Users className="group-data-[state=collapsed]:block hidden h-5 w-5" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
