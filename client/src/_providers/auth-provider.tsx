import { SUPPORTED_NETWORKS } from "@/_constants/networks";
import { fetchIndexerNotes } from "@/_hooks/use-indexer-notes";
import { useIsRegistered } from "@/_hooks/use-is-registered";
import { CommbankDotETHAccount } from "@/lib/commbankdoteth-account";
import {
  addNote,
  addTransaction,
  getAllPayloads,
  migrateTransactionsToV4,
} from "@/lib/db";
import { transactionMonitor } from "@/lib/transaction-monitor";
import { poseidon2Hash } from "@zkpassport/poseidon2";
import { ethers, formatUnits } from "ethers";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { NoteDecryption, NoteEncryption } from "shared/classes/Note";
import {
  defaultNetwork,
  defaultNetworkAssetByAddress,
} from "shared/constants/token";

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
  refreshNotes: () => Promise<number>;
  commbankDotEthAccount?: CommbankDotETHAccount;
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

  // Ref to store wallet during sign-in for refreshNotes
  // TODO review more in depth
  const walletRef = useRef<ethers.HDNodeWallet | null>(null);

  const { refetch: refetchRegistered } = useIsRegistered();

  useEffect(() => {
    if (typeof window === "undefined") return;

    setCommbankDotEthAccount(new CommbankDotETHAccount());

    // Run database migration for v4 schema
    migrateTransactionsToV4().catch((error) => {
      console.error("Failed to migrate transactions:", error);
    });

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

  // Start/stop transaction monitor based on auth state
  useEffect(() => {
    if (isSignedIn && address && privateAddress) {
      transactionMonitor.start();
    } else {
      transactionMonitor.stop();
    }

    return () => {
      transactionMonitor.stop();
    };
  }, [isSignedIn, address, privateAddress]);

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

      // Store wallet in ref for refreshNotes to use during sign-in
      walletRef.current = wallet;

      // Fetch and decrypt notes from indexer
      try {
        await refreshNotes();
      } catch (error) {
        // Silently fail if indexer is unavailable
        console.error("Failed to sync notes during sign-in:", error);
      } finally {
        // Clear wallet ref after refresh
        walletRef.current = null;
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

  const getMnemonic = useCallback(async (): Promise<string | null> => {
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
  }, [isSignedIn, commbankDotEthAccount]);

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

  const refreshNotes = useCallback(async (): Promise<number> => {
    let wallet = walletRef.current;

    // If no wallet in ref, try to get it from mnemonic (for post-login refreshes)
    if (!wallet) {
      if (!isSignedIn) {
        return 0;
      }

      const mnemonic = await getMnemonic();
      if (!mnemonic) {
        return 0;
      }
      wallet = ethers.Wallet.fromPhrase(mnemonic);
    }

    try {
      let newNotesCount = 0;

      const indexerPayloads = await fetchIndexerNotes(50, 0);
      const existingPayloads = await getAllPayloads();
      const existingPayloadIds = new Set(existingPayloads.map((p) => p.id));

      const chain = SUPPORTED_NETWORKS[defaultNetwork];

      for (const payload of indexerPayloads) {
        // TODO this is not a good check - we should check if it's in the decrypted notes, not payloads
        if (existingPayloadIds.has(payload.id)) {
          console.log("existing in loop");
          continue;
        }

        try {
          const decrypted = await NoteDecryption.decryptEncryptedNote(
            payload.encryptedNote,
            wallet.privateKey,
          );

          // Add the note to the database
          await addNote({
            id: payload.id,
            assetId: decrypted.asset_id,
            assetAmount: decrypted.asset_amount,
            nullifier: payload.id,
            secret: decrypted.secret,
            entity_id: decrypted.owner,
            isUsed: false,
          });

          // Create a "Transfer" transaction record for the received note
          const asset =
            defaultNetworkAssetByAddress[BigInt(decrypted.asset_id).toString()];

          if (asset && chain) {
            const txId = crypto.randomUUID();
            // TODO this should look different in the transfer UI
            await addTransaction({
              id: txId,
              chainId: defaultNetwork,
              type: "Transfer",
              status: "confirmed",
              createdAt: Date.now(),
              confirmedAt: Date.now(),
              timestamp: Date.now(),
              to: chain.CommBankDotEth,
              asset: {
                address: asset.address,
                symbol: asset.symbol,
                decimals: asset.decimals,
                amount: decrypted.asset_amount,
                formattedAmount: formatUnits(
                  BigInt(decrypted.asset_amount),
                  asset.decimals,
                ),
              },
              sender: {
                isSelf: false,
              },
              recipient: {
                privateAddress: decrypted.owner,
                isSelf: true,
              },
              inputNotes: [],
              outputNotes: [
                {
                  commitment: payload.id,
                  isInput: false,
                  isChange: false,
                },
              ],
            });
          }

          newNotesCount++;
          console.log("Decrypted and stored note:", payload.id);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_e) {
          // Silently ignore decryption failures - note wasn't meant for this user
          continue;
        }
      }

      return newNotesCount;
    } catch (error) {
      console.error("Failed to sync encrypted payloads:", error);
      throw error;
    }
  }, [isSignedIn, getMnemonic]);

  const signOut = () => {
    // Stop transaction monitor
    transactionMonitor.stop();

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
        refreshNotes,
        commbankDotEthAccount,
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
