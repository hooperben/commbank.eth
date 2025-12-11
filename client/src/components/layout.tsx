import { AppSidebar } from "@/components/app-sidebar";
import Footer from "@/components/footer";
import PageHead from "@/_providers/page-head";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/_providers/auth-provider";
import {
  PageTitleProvider,
  usePageTitle,
} from "@/_providers/page-title-context";
import type React from "react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { SettingsDropdown } from "./settings/settings-dropdown";

function SidebarTriggerFixed() {
  const { open, isMobile } = useSidebar();
  const { isLoading } = useAuth();
  const { title } = usePageTitle();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isLoading) return null;

  return (
    <div
      className={`fixed top-4 z-50 transition-all duration-300 ease-out flex items-center gap-4 ${
        isMobile
          ? "left-4"
          : open
            ? "left-[calc(var(--sidebar-width)+1rem)]"
            : "left-[calc(var(--sidebar-width-icon)+1rem)]"
      }`}
    >
      <SidebarTrigger
        className={`
          group relative overflow-hidden
          ${isMobile ? "h-14 w-14" : "h-10 w-10"}
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
      />
      {title && !isMobile && (
        <h1
          className={`text-xl font-semibold tracking-tight transition-opacity duration-300 ease-out ${
            isScrolled ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          {title}
        </h1>
      )}
    </div>
  );
}

export function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="antialiased">
      <SidebarProvider
        defaultOpen={true}
        style={
          {
            "--sidebar-width": "19rem",
            "--sidebar-width-icon": "3.5rem",
          } as React.CSSProperties
        }
      >
        <PageTitleProvider>
          <PageHead
            title="commbank.eth"
            description="open source, privacy enhancing financial technologies"
          />
          <AppSidebar />
          <div className="flex flex-col w-full min-h-screen">
            <SidebarTriggerFixed />
            <SettingsDropdown />
            <main className="flex-1 p-6 md:p-8 pt-24 md:pt-20">
              <div className="mx-auto w-full max-w-5xl lg:mx-0 lg:max-w-none">
                {children}
              </div>
            </main>
            <Footer />
          </div>
          <Toaster />
        </PageTitleProvider>
      </SidebarProvider>
    </div>
  );
}
