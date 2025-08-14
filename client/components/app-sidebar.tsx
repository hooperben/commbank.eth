"use client";

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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  const { isConnected } = useAccount();
  const { isSignedIn } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { isMobile, toggleSidebar, state } = useSidebar();

  return (
    <Sidebar
      className="bg-white dark:bg-black"
      variant="floating"
      collapsible="icon"
      {...props}
    >
      <SidebarHeader className="bg-white dark:bg-black border-b border-border md:rounded-xl">
        <div className="flex items-center font-semibold px-2 py-6">
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
        <SidebarGroup className="py-4">
          <SidebarMenu className="gap-1">
            {items.map((item, index) => (
              <React.Fragment key={item.href}>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    size="xl"
                    className={`${
                      pathname === item.href ? "" : "hover:bg-muted/50"
                    } transition-all duration-200 group-data-[collapsible=icon]:justify-center`}
                    onClick={() => isMobile && toggleSidebar()}
                    tooltip={state === "collapsed" ? item.label : undefined}
                  >
                    <Link
                      href={item.href}
                      className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center"
                    >
                      <item.icon
                        className={`${
                          pathname === item.href ? "text-primary" : ""
                        } ${
                          state === "collapsed" && "pl-1"
                        } h-5 w-5 group-data-[collapsible=icon]:h-6 group-data-[collapsible=icon]:w-6`}
                      />
                      <span
                        className={`${
                          pathname === item.href
                            ? "text-primary font-semibold"
                            : ""
                        } text-sm font-medium`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {index < items.length - 1 && (
                  <div className="mx-4 my-1 h-px bg-border group-data-[collapsible=icon]:mx-2" />
                )}
              </React.Fragment>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {(isConnected || isSignedIn) && (
        <SidebarFooter className="bg-white dark:bg-black border-t border-border md:rounded-xl">
          <AccountManager
            open={isModalOpen}
            onOpenChange={() => setIsModalOpen(false)}
          />
          {(isConnected || isSignedIn) && (
            <Button
              onClick={() => setIsModalOpen(true)}
              className="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:justify-center w-full justify-start bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
              variant="ghost"
            >
              <Users className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">
                My Account
              </span>
            </Button>
          )}
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
