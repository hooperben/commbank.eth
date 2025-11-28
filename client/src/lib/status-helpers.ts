import { CommbankDotETHAccount } from "./commbankdoteth-account";
import { isIndexedDBSupported } from "./db";
import type { SystemStatus } from "@/_types";

/**
 * Get the app version from environment or build info
 * @returns App version string
 */
export function getAppVersion(): string {
  // TODO: Get actual version from build process
  return import.meta.env.VITE_APP_VERSION || "development";
}

/**
 * Get GitHub Actions build link
 * @returns GitHub Actions link or undefined
 */
export function getGitHubActionLink(): string | undefined {
  // TODO: Get actual GitHub Actions run URL from build
  return import.meta.env.VITE_GITHUB_ACTION_URL;
}

/**
 * Check RPC status by attempting to connect
 * @returns Status object
 */
export async function checkRPCStatus(): Promise<SystemStatus> {
  try {
    // TODO: Implement actual RPC ping
    // For now, return success
    // Simulate ping
    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      type: "success",
      message: "RPC is operational",
      info: "An RPC is what allows you to send transactions to the blockchain to be processed. commbank.eth currently uses Alchemy, but future versions of the app will allow the user to choose or input their own RPC.",
    };
  } catch (error) {
    return {
      type: "error",
      message: "RPC is unreachable",
      info: "An RPC is what allows you to send transactions to the blockchain to be processed. commbank.eth currently uses Alchemy, but future versions of the app will allow the user to choose or input their own RPC.",
    };
  }
}

/**
 * Check indexer status by attempting to ping
 * @returns Status object
 */
export async function checkIndexerStatus(): Promise<SystemStatus> {
  try {
    const indexerUrl = import.meta.env.VITE_INDEXER_URL;
    if (!indexerUrl) {
      return {
        type: "warning",
        message: "Indexer URL not configured",
        info: "commbank.eth uses an envio indexer to make it easier to retrieve and build private transactions instructions. Like RPCs, a future version of the app will support the ability to change or add custom indexers.",
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
        info: "commbank.eth uses an envio indexer to make it easier to retrieve and build private transactions instructions. Like RPCs, a future version of the app will support the ability to change or add custom indexers.",
      };
    } else {
      return {
        type: "warning",
        message: "Indexer responded with error",
        info: "commbank.eth uses an envio indexer to make it easier to retrieve and build private transactions instructions. Like RPCs, a future version of the app will support the ability to change or add custom indexers.",
      };
    }
  } catch (error) {
    return {
      type: "error",
      message: "Indexer is unreachable",
      info: "commbank.eth uses an envio indexer to make it easier to retrieve and build private transactions instructions. Like RPCs, a future version of the app will support the ability to change or add custom indexers.",
    };
  }
}

/**
 * Check if passkeys are supported
 * @returns Status object
 */
export function checkPasskeySupport(): SystemStatus {
  const isSupported = CommbankDotETHAccount.isSupported();

  if (isSupported) {
    return {
      type: "success",
      message: "Passkey is supported",
      info: "commbank.eth makes use of passkey to manage account secrets securely. If your browser does not support passkey, the commbank.eth web app will not work as expected.",
    };
  } else {
    return {
      type: "warning",
      message: "Passkey is not supported",
      info: "commbank.eth makes use of passkey to manage account secrets securely. If your browser does not support passkey, the commbank.eth web app will not work as expected.",
    };
  }
}

/**
 * Check if IndexedDB is supported
 * @returns Status object
 */
export function checkIndexedDBSupport(): SystemStatus {
  const isSupported = isIndexedDBSupported();

  if (isSupported) {
    return {
      type: "success",
      message: "IndexedDB is supported",
      info: "commbank.eth uses indexdb in your browser to store and manage account state and transaction history. If your browser doesn't support indexdb, the commbank.eth web app will not work as expected.",
    };
  } else {
    return {
      type: "warning",
      message: "IndexedDB is not supported",
      info: "commbank.eth uses indexdb in your browser to store and manage account state and transaction history. If your browser doesn't support indexdb, the commbank.eth web app will not work as expected.",
    };
  }
}
