import { getIndexerUrl } from "@/_constants/indexer";
import { SUPPORTED_NETWORKS } from "@/_constants/networks";
import type { SystemStatus } from "@/_types";
import { CommbankDotETHAccount } from "@/lib/commbankdoteth-account";
import { isIndexedDBSupported } from "@/lib/db";
import { JsonRpcProvider } from "ethers";
import { defaultNetwork } from "shared/constants/token";

/**
 * Get the app version from environment or build info
 * @returns App version string
 */
export function getAppVersion(): string {
  return import.meta.env.VITE_APP_VERSION || "development";
}

/**
 * Get GitHub Actions build link
 * @returns GitHub Actions link or undefined
 */
export function getGitHubActionLink(): string | undefined {
  return import.meta.env.VITE_GITHUB_ACTION_URL;
}

/**
 * Check RPC status by attempting to connect
 * @returns Status object
 */
export async function checkRPCStatus(): Promise<SystemStatus> {
  const info =
    "An RPC is what allows you to send transactions to the blockchain to be processed. commbank.eth currently uses Alchemy, but future versions of the app will allow the user to choose or input their own RPC.";
  try {
    const chain = SUPPORTED_NETWORKS[defaultNetwork];
    const provider = new JsonRpcProvider(chain.rpc);

    await provider.getBlockNumber();

    return {
      type: "success",
      message: "RPC is operational",
      info,
    };
  } catch (error) {
    console.error(error);
    return {
      type: "error",
      message: "RPC is unreachable",
      info,
    };
  }
}

/**
 * Check indexer status by attempting to ping
 * @returns Status object
 */
export async function checkIndexerStatus(): Promise<SystemStatus> {
  const info =
    "commbank.eth uses an envio indexer to make it easier to retrieve and build private transactions instructions. Like RPCs, a future version of the app will support the ability to change or add custom indexers.";

  try {
    const indexerUrl = getIndexerUrl();

    if (!indexerUrl) {
      return {
        type: "warning",
        message: "Indexer URL not configured",
        info,
      };
    }

    // Try to ping the indexer
    const response = await fetch(indexerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "{ __typename }",
      }),
    });

    if (response.ok) {
      return {
        type: "success",
        message: "Indexer is operational",
        info,
      };
    } else {
      return {
        type: "warning",
        message: "Indexer responded with error",
        info,
      };
    }
  } catch (error) {
    console.error(error);
    return {
      type: "error",
      message: "Indexer is unreachable",
      info,
    };
  }
}

/**
 * Check if passkeys are supported
 * @returns Status object
 */
export function checkPasskeySupport(): SystemStatus {
  const isSupported = CommbankDotETHAccount.isSupported();

  const info =
    "commbank.eth makes use of passkey to manage account secrets securely. If your browser does not support passkey, the commbank.eth web app will not work as expected.";

  if (isSupported) {
    return {
      type: "success",
      message: "Passkey is supported",
      info,
    };
  } else {
    return {
      type: "warning",
      message: "Passkey is not supported",
      info,
    };
  }
}

/**
 * Check if IndexedDB is supported
 * @returns Status object
 */
export function checkIndexedDBSupport(): SystemStatus {
  const isSupported = isIndexedDBSupported();

  const info =
    "commbank.eth uses indexdb in your browser to store and manage account state and transaction history. If your browser doesn't support indexdb, the commbank.eth web app will not work as expected.";

  if (isSupported) {
    return {
      type: "success",
      message: "IndexedDB is supported",
      info,
    };
  } else {
    return {
      type: "warning",
      message: "IndexedDB is not supported",
      info,
    };
  }
}

const RELAYER_URL = "https://relayer-production-91b9.up.railway.app";

/**
 * Check relayer status by pinging health endpoint
 * @returns Status object
 */
export async function checkRelayerStatus(): Promise<SystemStatus> {
  const info =
    "The relayer enables gasless transactions by submitting proofs on behalf of users. When operational, users can perform private transfers without needing ETH for gas.";

  try {
    const response = await fetch(`${RELAYER_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      return {
        type: "success",
        message:
          data.status === "ok"
            ? "Relayer is operational"
            : "Relayer is responding",
        info,
      };
    } else {
      return {
        type: "warning",
        message: "Relayer responded with error",
        info,
      };
    }
  } catch (error) {
    console.error("Relayer status check failed:", error);
    return {
      type: "error",
      message: "Relayer is unreachable",
      info,
    };
  }
}
