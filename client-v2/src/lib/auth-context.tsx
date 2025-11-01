import React, { createContext, useContext, useEffect, useState } from "react";
import { CommbankDotETHAccount } from "./commbankdoteth-account";
import { ethers } from "ethers";

interface AuthContextType {
  isLoading: boolean;
  isSignedIn: boolean;
  token: string | null;
  address: string | null;
  signIn: (mnemonic?: string) => Promise<void>;
  signOut: () => void;
  getMnemonic: () => Promise<string | null>;
  isAccountManagerOpen: boolean;
  setIsAccountManagerOpen: (input: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccountManagerOpen, setIsAccountManagerOpen] = useState(false);
  const [commbankDotEthAccount, setCommbankDotEthAccount] =
    useState<CommbankDotETHAccount>();

  useEffect(() => {
    if (typeof window === "undefined") return;

    setCommbankDotEthAccount(new CommbankDotETHAccount());

    const storedToken = sessionStorage.getItem("authToken");

    if (storedToken) {
      try {
        const decoded = JSON.parse(atob(storedToken.split(".")[1]));
        if (decoded.exp > Math.floor(Date.now() / 1000)) {
          setToken(storedToken);
          setIsSignedIn(true);
          setAddress(decoded.address);
        } else {
          sessionStorage.removeItem("authToken");
        }
      } catch (error) {
        console.error("Invalid token:", error);
        sessionStorage.removeItem("authToken");
      }
    }

    setIsLoading(false);
  }, []);

  const signIn = async (providedMnemonic?: string) => {
    try {
      if (!commbankDotEthAccount) {
        // TODO shouldn't happen
        setCommbankDotEthAccount(new CommbankDotETHAccount());
      }

      // Use provided mnemonic if available, otherwise retrieve from passkey
      let mnemonic = providedMnemonic;

      if (!mnemonic) {
        mnemonic = await commbankDotEthAccount?.retrieveMnemonic();
      }

      if (!mnemonic) {
        throw new Error("Error Signing In.");
      }

      const wallet = ethers.Wallet.fromPhrase(mnemonic);

      const now = Math.floor(Date.now() / 1000);
      const expiresIn = 60 * 60; // 1 hour in seconds

      const payload = {
        username: "commbank.eth",
        address: wallet.address,
        iat: now,
        exp: now + expiresIn,
      };

      const encodedPayload = btoa(JSON.stringify(payload))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

      const header = {
        alg: "HS256",
        typ: "JWT",
      };

      const encodedHeader = btoa(JSON.stringify(header))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");

      const jwtContent = `${encodedHeader}.${encodedPayload}`;
      const signature = await computeHmacSha256(jwtContent, mnemonic);
      const jwt = `${encodedHeader}.${encodedPayload}.${signature}`;

      setToken(jwt);
      setIsSignedIn(true);
      setAddress(wallet.address);

      // wipe mnemonic and passkey from memory? I think
      setCommbankDotEthAccount(new CommbankDotETHAccount());

      if (typeof window !== "undefined") {
        sessionStorage.setItem("authToken", jwt);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const computeHmacSha256 = async (
    data: string,
    key: string,
  ): Promise<string> => {
    if (typeof window === "undefined") {
      throw new Error("Crypto operations not available in server environment");
    }

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    const encodedKey = encoder.encode(key);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encodedKey,
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, encodedData);

    return arrayBufferToBase64Url(signature);
  };

  const arrayBufferToBase64Url = (buffer: ArrayBuffer): string => {
    const base64 = btoa(
      Array.from(new Uint8Array(buffer))
        .map((b) => String.fromCharCode(b))
        .join(""),
    );

    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  };

  const getMnemonic = async (): Promise<string | null> => {
    if (!isSignedIn) {
      return null;
    }

    try {
      const account = commbankDotEthAccount || new CommbankDotETHAccount();
      return await account.retrieveMnemonic();
    } catch (error) {
      console.error("Error retrieving mnemonic:", error);
      return null;
    }
  };

  const signOut = () => {
    setToken(null);
    setAddress(null);
    setIsSignedIn(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("authToken");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isSignedIn,
        token,
        address,
        signIn,
        signOut,
        getMnemonic,
        isAccountManagerOpen,
        setIsAccountManagerOpen,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
