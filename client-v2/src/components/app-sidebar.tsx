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
import { Logo } from "./logo";

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

export function AppSidebar() {
  const { open, isMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex justify-center text-lg font-bold px-4 py-6">
            <div className={`flex ${!open ? "display-none" : ""}`}>
              <Logo />
            </div>
            {open || isMobile ? (
              <>
                commbank.eth
                <span className="ml-2 text-xs bg-primary text-white dark:text-secondary px-2 py-0.5 rounded">
                  beta
                </span>
              </>
            ) : (
              <></>
            )}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="">
              {!open && !isMobile && (
                <SidebarMenuItem className={`${open ? "mt-4" : "ml-1"}`}>
                  <Logo />
                </SidebarMenuItem>
              )}
              <div className="h-4"></div>
              {items.map((item) => (
                <SidebarMenuItem key={item.href} className="py-1 px-1">
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    variant="ghost"
                    className={`
                      h-10
                      rounded-2xl
                      backdrop-blur-xl
                      bg-background/40
                      border border-border/50
                      shadow-lg shadow-black/5
                      hover:shadow-xl hover:shadow-black/10
                      hover:bg-background/60
                      hover:border-border/80
                      hover:scale-105
                      active:scale-95
                      transition-all duration-300 ease-out
                      before:absolute before:inset-0
                      before:bg-gradient-to-br before:from-white/10 before:to-transparent
                      before:opacity-0 before:group-hover:opacity-100
                      before:transition-opacity before:duration-300
                      after:absolute after:inset-0
                      after:bg-gradient-to-tr after:from-transparent after:via-white/5 after:to-white/10
                      after:opacity-60
                    `}
                  >
                    <Link to={item.href}>
                      <item.icon
                        className={`h-4 w-4 ${open ? "ml-3 h-10" : ""}`}
                      />
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
