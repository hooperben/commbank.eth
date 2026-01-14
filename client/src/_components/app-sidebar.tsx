import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/_components/ui/sidebar";
import { Link } from "react-router-dom";
import { Logo } from "./logo";
import { useSideBarItems } from "@/_hooks/use-sidebar-item";

export function AppSidebar() {
  const { open, isMobile, setOpenMobile } = useSidebar();

  const menuBarItems = useSideBarItems();

  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="">
              <SidebarMenuItem
                className={`flex flex-row justify-center items-center mt-4`}
              >
                <div className="ml-3">
                  <Logo height={48} width={48} />
                </div>

                {(open || isMobile) && (
                  <div className="flex flex-row items-center">
                    <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 ml-[-6px]">
                      commbank.eth
                    </span>
                    <span className="ml-2 text-xs font-primary bg-primary text-white dark:text-secondary px-2 py-0.5 rounded">
                      beta
                    </span>
                  </div>
                )}
              </SidebarMenuItem>

              <div className="h-4"></div>
              {menuBarItems.map((item) => (
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
                    <Link to={item.href} onClick={handleMenuClick}>
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
