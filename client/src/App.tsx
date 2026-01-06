import { AppLayout } from "@/_components/layout";
import { InAppBrowserWarning } from "@/_components/status/in-app-browser-warning";
import { AboutPage } from "@/pages/about";
import AccountPage from "@/pages/account";
import AccountsPage from "@/pages/accounts";
import ContactsPage from "@/pages/contacts";
import { HomePage } from "@/pages/home";
import NotFoundPage from "@/pages/not-found";
import { SettingsPage } from "@/pages/settings";
import SharePage from "@/pages/share";
import StatusPage from "@/pages/status";
import TestingPage from "@/pages/testing";
import TransactionsPage from "@/pages/transactions";
import { HashRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./_providers/auth-provider";
import { ProtectedRoute } from "./_providers/protected-route";
import { QueryClientProvider } from "./_providers/query-client";
import { ThemeProvider } from "./_providers/theme-provider";
import "./App.css";

function App() {
  return (
    <HashRouter>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <QueryClientProvider>
          <AuthProvider>
            <InAppBrowserWarning />
            <AppLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route
                  path="/account"
                  element={
                    <ProtectedRoute>
                      <AccountPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/accounts"
                  element={
                    <ProtectedRoute>
                      <AccountsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/contacts"
                  element={
                    <ProtectedRoute>
                      <ContactsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/transactions"
                  element={
                    <ProtectedRoute>
                      <TransactionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/share" element={<SharePage />} />
                <Route path="/status" element={<StatusPage />} />

                {/* TODO remove once confirmed that everything works */}
                <Route
                  path="/testing"
                  element={
                    <ProtectedRoute>
                      <TestingPage />
                    </ProtectedRoute>
                  }
                />
                {/* Catch-all 404 route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </AppLayout>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </HashRouter>
  );
}

export default App;
