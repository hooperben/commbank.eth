import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Decorator } from "@storybook/react-vite";
import React, { createContext } from "react";

// Create a fresh QueryClient for each story to avoid state leakage
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries in tests for faster feedback
        retry: false,
        // Don't refetch on window focus in tests
        refetchOnWindowFocus: false,
      },
    },
  });

// ============================================================================
// Mock Auth Context - mirrors the real AuthProvider interface
// ============================================================================

interface AuthContextType {
  isLoading: boolean;
  isSignedIn: boolean;
  token: string | null;
  address: string | null;
  privateAddress: string | null;
  signingKey: string | null;
  signIn: (mnemonic?: string) => Promise<void>;
  signOut: () => void;
  getMnemonic: () => Promise<string | null>;
  getEnvelopeKey: () => Promise<string | null>;
  commbankDotEthAccount?: undefined;
}

const MockAuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultMockAuth: AuthContextType = {
  isLoading: false,
  isSignedIn: true,
  token: "mock-jwt-token",
  address: "0x6e400024D346e8874080438756027001896937E3",
  privateAddress: "0x1234567890abcdef1234567890abcdef12345678",
  signingKey: "0xmocksigningkey",
  signIn: async () => {},
  signOut: () => {},
  getMnemonic: async () =>
    "test test test test test test test test test test test junk",
  getEnvelopeKey: async () => "0xmockenvelopekey",
  commbankDotEthAccount: undefined,
};

function MockAuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <MockAuthContext.Provider value={defaultMockAuth}>
      {children}
    </MockAuthContext.Provider>
  );
}

// ============================================================================
// Decorators
// ============================================================================

/**
 * Decorator that provides QueryClient context for stories using React Query hooks
 */
export const withQueryClient: Decorator = (Story) => {
  const queryClient = React.useMemo(() => createTestQueryClient(), []);
  return (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  );
};

/**
 * Combined decorator for components that need both Auth and QueryClient
 * Uses a mock AuthProvider that doesn't have external dependencies
 */
export const withProviders: Decorator = (Story) => {
  const queryClient = React.useMemo(() => createTestQueryClient(), []);
  return (
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider>
        <Story />
      </MockAuthProvider>
    </QueryClientProvider>
  );
};

// Export the mock context so components can use it
// This is used by the module mock to replace the real useAuth
export { MockAuthContext };
