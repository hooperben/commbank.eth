import React, { createContext, useContext } from "react";

interface MockAuthContextType {
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

const MockAuthContext = createContext<MockAuthContextType | undefined>(
  undefined,
);

export interface MockAuthProviderProps {
  children: React.ReactNode;
  overrides?: Partial<MockAuthContextType>;
}

const defaultMockAuth: MockAuthContextType = {
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

export function MockAuthProvider({
  children,
  overrides = {},
}: MockAuthProviderProps) {
  const value = { ...defaultMockAuth, ...overrides };

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
}

// This hook mirrors the real useAuth but uses the mock context
export function useMockAuth() {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error("useMockAuth must be used within a MockAuthProvider");
  }
  return context;
}
