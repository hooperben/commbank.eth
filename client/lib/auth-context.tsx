"use client";

import React, { createContext, useContext, useState } from "react";
import { getRegisteredUsername } from "./passkey";

interface AuthContextType {
  isSignedIn: boolean;
  token: string | null;
  mnemonic: string | null;
  signIn: (secret: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [mnemonic, setMnemonic] = useState<string | null>(null);

  const signIn = async (secret: string) => {
    // Create payload with 1-hour expiration
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 60 * 60; // 1 hour in seconds

    const payload = {
      username: await getRegisteredUsername(),
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
  };

  return (
    <AuthContext.Provider
      value={{
        isSignedIn,
        token,
        mnemonic,
        signIn,
        signOut,
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
