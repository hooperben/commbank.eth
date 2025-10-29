import { HashRouter, Route, Routes } from "react-router-dom";

import "./App.css";
import { AppLayout } from "./components/layout";
import { AuthProvider } from "./lib/auth-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HomePage } from "./pages/home";
import { AccountPage } from "./pages/account";
import { SettingsPage } from "./pages/settings";
import { ThemeProvider } from "./components/theme-provider";

const queryClient = new QueryClient();

function App() {
  return (
    <HashRouter>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppLayout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </AppLayout>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </HashRouter>
  );
}

export default App;
