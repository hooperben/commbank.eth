/**
 * Mock implementation of auth-provider for Storybook
 * This file replaces @/_providers/auth-provider in Storybook builds
 */
import React, { createContext, useContext } from "react";

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultMockAuth: AuthContextType = {
  isLoading: false,
  isSignedIn: true,
  token: "mock-jwt-token",
  address: "0x742d35Cc6634C0532925a3b844Bc9e7595f5bB91",
  privateAddress: "0x1234567890abcdef1234567890abcdef12345678",
  signingKey: "0xmocksigningkey",
  signIn: async () => {},
  signOut: () => {},
  getMnemonic: async () =>
    "test test test test test test test test test test test junk",
  getEnvelopeKey: async () => "0xmockenvelopekey",
  commbankDotEthAccount: undefined,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={defaultMockAuth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Return default mock values instead of throwing
    // This allows components to work without being wrapped in a provider
    return defaultMockAuth;
  }
  return context;
}
