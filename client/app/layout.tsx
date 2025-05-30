"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";
import { useState } from "react";
import "./globals.css";

import { AppSidebar } from "@/components/app-sidebar";
import PageHead from "@/components/page-head";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";

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
        <SidebarProvider
          style={
            {
              "--sidebar-width": "19rem",
            } as React.CSSProperties
          }
        >
          <AuthProvider>
            <PageHead
              title="commbank.eth"
              description="a bank you don't need to trust"
            />
            <QueryClientProvider client={queryClient}>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
              >
                <AppSidebar />
                <div className="flex flex-col w-full gap-4 mt-4">
                  <SidebarTrigger />

                  {children}
                </div>
                <Toaster />
              </ThemeProvider>
            </QueryClientProvider>
          </AuthProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
