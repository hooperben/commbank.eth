"use client";

import { toast } from "@/hooks/use-toast";
import { decryptSecret, getEncryptedSecretById, initDB } from "@/lib/db";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
  authenticateWithPasskey,
  getRegisteredUsername,
  isPasskeyRegistered,
  retrieveMnemonic,
} from "./passkey";

interface AuthContextType {
  isSignedIn: boolean;
  username: string | null;
  token: string | null;
  mnemonic: string | null;
  signIn: (secret: string) => void;
  handleSignIn: () => void;
  isAuthenticating: boolean;
  signOut: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log(mnemonic);
  }, [mnemonic]);

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const isRegistered = isPasskeyRegistered();
      setIsSignedIn(isRegistered);

      if (isRegistered) {
        const registeredUsername = getRegisteredUsername();
        setUsername(registeredUsername);
      }

      const existingToken = sessionStorage.getItem("authToken");

      if (existingToken && isPasskeyRegistered()) {
        setToken(existingToken);
      }

      setIsLoading(false);
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("auth-change", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("auth-change", checkAuth);
    };
  }, []);

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const signIn = async (secret: string) => {
    // Create payload with 1-hour expiration
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 60 * 60; // 1 hour in seconds

    const payload = {
      username: getRegisteredUsername(),
      iat: now,
      exp: now + expiresIn,
    };

    // Convert payload to Base64Url encoded string
    const encodedPayload = btoa(JSON.stringify(payload))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    // Create JWT header
    const header = {
      alg: "HS256",
      typ: "JWT",
    };

    // Convert header to Base64Url encoded string
    const encodedHeader = btoa(JSON.stringify(header))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    // Create JWT content to be signed
    const jwtContent = `${encodedHeader}.${encodedPayload}`;

    // Generate signature using Web Crypto API
    const signature = await computeHmacSha256(jwtContent, secret);

    // Assemble the JWT
    const jwt = `${encodedHeader}.${encodedPayload}.${signature}`;

    // Save token to state and session storage
    setToken(jwt);
    setIsSignedIn(true);
    setMnemonic(secret);
    sessionStorage.setItem("authToken", jwt);
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);

    try {
      await initDB();

      // Use the provided username or fall back to retrieving from storage
      const userToAuthenticate = "commbank.eth";

      // Try to retrieve mnemonic using our enhanced method
      const mnemonic = await retrieveMnemonic();

      if (mnemonic) {
        // Sign in with the retrieved mnemonic
        signIn(mnemonic);
        return;
      }

      // Fall back to original approach if retrieveMnemonic fails
      const commbankSecret = await getEncryptedSecretById(userToAuthenticate);

      if (!commbankSecret)
        throw new Error(`No ${userToAuthenticate} registered`);

      const authData = await authenticateWithPasskey();

      if (!authData) {
        toast({
          title: "Authentication Failed",
          description: "Failed to authenticate with passkey",
          variant: "destructive",
        });
        return;
      }

      const decryptedSecret = await decryptSecret(commbankSecret, authData);
      signIn(decryptedSecret);
    } catch (err) {
      console.log(err);
      toast({
        title: "Authentication Failed",
        description: "Failed to authenticate with passkey",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Production-ready HMAC-SHA256 implementation using Web Crypto API
  const computeHmacSha256 = async (
    data: string,
    key: string,
  ): Promise<string> => {
    // Convert our string data and key to Uint8Array
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
    const encodedKey = encoder.encode(key);

    // Import the key for HMAC usage
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      encodedKey,
      { name: "HMAC", hash: { name: "SHA-256" } },
      false,
      ["sign"],
    );

    // Generate the HMAC signature
    const signature = await window.crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      encodedData,
    );

    // Convert the ArrayBuffer to a base64url string
    return arrayBufferToBase64Url(signature);
  };

  // Helper function to convert ArrayBuffer to base64url
  const arrayBufferToBase64Url = (buffer: ArrayBuffer): string => {
    // Convert ArrayBuffer to base64
    const base64 = btoa(
      Array.from(new Uint8Array(buffer))
        .map((b) => String.fromCharCode(b))
        .join(""),
    );

    // Convert base64 to base64url
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  };

  const signOut = () => {
    setToken(null);
    setMnemonic(null);
    setIsSignedIn(false);
    sessionStorage.removeItem("authToken");
  };

  return (
    <AuthContext.Provider
      value={{
        isSignedIn,
        username,
        token,
        mnemonic,
        signIn,
        handleSignIn,
        signOut,
        isLoading,
        isAuthenticating,
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
