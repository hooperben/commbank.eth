import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { InAppBrowserWarning } from "./components/in-app-browser-warning";
import { AppLayout } from "./components/layout";
import { ProtectedRoute } from "./components/protected-route";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./lib/auth-context";
import { AboutPage } from "./pages/about";
import AccountPage from "./pages/account";
import ContactsPage from "./pages/contacts";
import { HomePage } from "./pages/home";
import NotFoundPage from "./pages/not-found";
import { SettingsPage } from "./pages/settings";
import SharePage from "./pages/share";
import StatusPage from "./pages/status";
import TestingPage from "./pages/testing";
import TransactionsPage from "./pages/transactions";

const queryClient = new QueryClient();

function App() {
  return (
    <HashRouter>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <QueryClientProvider client={queryClient}>
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
