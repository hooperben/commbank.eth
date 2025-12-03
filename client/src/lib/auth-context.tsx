import { fetchIndexerNotes } from "@/hooks/use-indexer-notes";
import { useIsRegistered } from "@/hooks/use-is-registered";
import { poseidon2Hash } from "@zkpassport/poseidon2";
import { ethers } from "ethers";
import React, { createContext, useContext, useEffect, useState } from "react";
import { NoteEncryption } from "shared/classes/Note";
import { CommbankDotETHAccount } from "./commbankdoteth-account";
import { addNote, getAllPayloads } from "./db";
import { NoteDecryption } from "./note-decryption";

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  // evm address
  const [address, setAddress] = useState<string | null>(null);
  // commbank.eth private address
  const [privateAddress, setPrivateAddress] = useState<string | null>(null);
  // signing address (what's used to pass notes)
  const [signingAddress, setSigningAddress] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [commbankDotEthAccount, setCommbankDotEthAccount] =
    useState<CommbankDotETHAccount>();

  const { refetch: refetchRegistered } = useIsRegistered();

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
          setPrivateAddress(decoded.privateAddress);
          setSigningAddress(decoded?.signingAddress);
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

      // if the user has provided the mnemonic, create the passkey
      if (mnemonic) {
        await commbankDotEthAccount?.registerPasskey(mnemonic);
      }

      if (!mnemonic) {
        mnemonic = await commbankDotEthAccount?.retrieveMnemonic();
      }

      if (!mnemonic) {
        throw new Error("Error Signing In.");
      }

      const wallet = ethers.Wallet.fromPhrase(mnemonic);

      const privateAddress = poseidon2Hash([BigInt(wallet.privateKey)]);
      const signingKey = await NoteEncryption.getPublicKeyFromAddress(wallet);
      const privateAddressHex = "0x" + privateAddress.toString(16);

      // TODO review this implementation and reuse elsewhere
      // Fetch and decrypt indexer encrypted payloads
      try {
        const indexerPayloads = await fetchIndexerNotes(50, 0);
        const existingPayloads = await getAllPayloads();
        const existingPayloadIds = new Set(existingPayloads.map((p) => p.id));

        // Try to decrypt each payload
        for (const payload of indexerPayloads) {
          // Skip if already in database
          if (existingPayloadIds.has(payload.id)) {
            console.log("skipping", existingPayloadIds);
            continue;
          }

          try {
            const decrypted = await NoteDecryption.decryptEncryptedNote(
              payload.encryptedNote,
              wallet.privateKey,
            );

            // Successfully decrypted - add to notes database
            await addNote({
              id: payload.id,
              assetId: decrypted.asset_id,
              assetAmount: decrypted.asset_amount,
              nullifier: payload.id,
              secret: decrypted.secret,
              entity_id: decrypted.owner,
              isUsed: false,
            });

            console.log("Decrypted and stored note:", payload.id);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars -- will happen a bit
          } catch (_e) {
            // Silently ignore decryption failures - note wasn't meant for this user
            continue;
          }
        }
      } catch (error) {
        // Silently fail if indexer is unavailable or other errors occur
        console.error("Failed to sync encrypted payloads:", error);
      }

      const now = Math.floor(Date.now() / 1000);
      const expiresIn = 60 * 60; // 1 hour in seconds

      const payload = {
        username: "commbank.eth",
        address: wallet.address,
        privateAddress: privateAddressHex,
        signingAddress: signingKey,
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
      setPrivateAddress(privateAddressHex);
      setSigningAddress(signingKey);

      // wipe mnemonic and passkey from memory? I think
      setCommbankDotEthAccount(new CommbankDotETHAccount());

      if (typeof window !== "undefined") {
        sessionStorage.setItem("authToken", jwt);
        localStorage.setItem("signedIn", "true");
        localStorage.setItem("accountRegistered", "true");
        await refetchRegistered();
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

  const getEnvelopeKey = async (): Promise<string | null> => {
    if (!isSignedIn) {
      return null;
    }

    try {
      const mnemonic = await getMnemonic();
      if (!mnemonic) {
        return null;
      }

      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      return wallet.privateKey;
    } catch (error) {
      console.error("Error retrieving envelope key:", error);
      return null;
    }
  };

  const signOut = () => {
    setToken(null);
    setAddress(null);
    setIsSignedIn(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("authToken");
      localStorage.removeItem("signedIn");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isSignedIn,
        token,
        address,
        privateAddress,
        signingKey: signingAddress,
        signIn,
        signOut,
        getMnemonic,
        getEnvelopeKey,
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
