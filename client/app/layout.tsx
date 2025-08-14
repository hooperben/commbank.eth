"use client";

import { AppSidebar } from "@/components/app-sidebar";
import Footer from "@/components/footer";
import PageHead from "@/components/page-head";
import { ThemeProvider } from "@/components/theme-provider";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { CurrencyProvider } from "@/lib/currency-context";
import WagmiProvider from "@/providers/wagmi";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import { useState } from "react";

import "./globals.css";

function SidebarTriggerFixed() {
  const { open, isMobile } = useSidebar();
  const { isLoading } = useAuth();

  if (isLoading) return <></>;

  return (
    <SidebarTrigger
      className={`fixed top-2 z-50 h-10 w-10 hover:bg-accent transition-all duration-200 ${
        !isMobile && open
          ? "left-[calc(var(--sidebar-width)+0.5rem)]"
          : "left-15"
      }`}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Create a new QueryClient instance for each session
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryClientProvider client={queryClient}>
          <WagmiProvider>
            <SidebarProvider
              style={
                {
                  "--sidebar-width": "19rem",
                } as React.CSSProperties
              }
            >
              <AuthProvider>
                <CurrencyProvider>
                  <PageHead
                    title="commbank.eth"
                    description="the bank you don't need to trust"
                  />
                  <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                  >
                    <AppSidebar />
                    <div className="flex flex-col w-full min-h-screen">
                      <SidebarTriggerFixed />

                      <main className="flex-1 p-4">{children}</main>

                      <Footer />
                    </div>
                    <Toaster />
                  </ThemeProvider>
                </CurrencyProvider>
              </AuthProvider>
            </SidebarProvider>
          </WagmiProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
