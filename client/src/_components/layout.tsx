import { AppSidebar } from "@/_components/app-sidebar";
import Footer from "@/_components/footer";
import { Logo } from "@/_components/logo";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/_components/ui/sidebar";
import { useAuth } from "@/_providers/auth-provider";
import PageHead from "@/_providers/page-head";
import {
  PageTitleProvider,
  usePageTitle,
} from "@/_providers/page-title-context";
import type React from "react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
          h-10 w-10
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

function MobileHeader() {
  const { isMobile } = useSidebar();
  const { isSignedIn } = useAuth();
  const location = useLocation();

  // Hide on home page or when not signed in
  const isHomePage = location.pathname === "/" || location.pathname === "";
  if (!isMobile || isHomePage || !isSignedIn) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 h-10 flex items-center">
      <Link to="/" className="flex items-center gap-0.5">
        <Logo height={48} width={48} />
        <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 ml-[-12px]">
          commbank.eth
        </span>
      </Link>
    </div>
  );
}

function MainContent({ children }: { children: React.ReactNode }) {
  const { open, isMobile } = useSidebar();

  // On desktop, offset content to keep it visually centered when sidebar collapses
  // When collapsed, content area expands - add positive margin to compensate
  const sidebarDiff =
    "calc((var(--sidebar-width) - var(--sidebar-width-icon)) / 2)";
  const offsetStyle = !isMobile
    ? {
        marginLeft: open ? "0" : sidebarDiff,
        transition: "margin-left 200ms ease-out",
      }
    : {};

  return (
    <main className="flex-1 p-6 md:p-8 pt-24 md:pt-20">
      <div className="mx-auto w-full max-w-4xl" style={offsetStyle}>
        {children}
      </div>
    </main>
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
            <MobileHeader />
            <SettingsDropdown />
            <MainContent>{children}</MainContent>
            <Footer />
          </div>
          <Toaster />
        </PageTitleProvider>
      </SidebarProvider>
    </div>
  );
}
