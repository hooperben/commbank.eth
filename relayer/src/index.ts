import express, { Request, Response } from "express";
import cors from "cors";
import { ethers, parseUnits } from "ethers";

import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - restrict to allowed origins
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:5173"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

// Middleware to parse JSON bodies
app.use(express.json({ limit: "10mb" }));

// RPC URL configuration - map chain IDs to RPC URLs
const RPC_URLS: Record<string, string> = {
  "1": process.env.RPC_ETH_MAINNET || "",
  "11155111": process.env.RPC_ETH_SEPOLIA || "",
  "421614": process.env.RPC_ARB_SEPOLIA || "",
};

// Types for the proof structure
interface ProofData {
  proof: string;
  publicInputs: string[];
}

interface TransactionRequest {
  proof: ProofData;
  payload: string[];
}

// Sponsor transaction request type
interface SponsorRequest {
  type: "transfer" | "transferExternal";
  chainId: number;
  proof: string;
  publicInputs: string[];
  payload: string[];
}

// Contract addresses by chain ID
const CONTRACT_ADDRESSES: Record<number, string> = {
  11155111: "0x3b4eEb695754F868DF6BaF0c0B788cC6E553DbdA", // Sepolia
  421614: "0xC0e0C9DC1DE67B7f6434FfdDf2A33300ed6f49E3", // Arb Sepolia
};

// Minimal ABI for transfer and transferExternal functions
const COMMBANK_ABI = [
  {
    inputs: [
      { internalType: "bytes", name: "_proof", type: "bytes" },
      { internalType: "bytes32[]", name: "_publicInputs", type: "bytes32[]" },
      { internalType: "bytes[]", name: "_payload", type: "bytes[]" },
    ],
    name: "transfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes", name: "_proof", type: "bytes" },
      { internalType: "bytes32[]", name: "_publicInputs", type: "bytes32[]" },
      { internalType: "bytes[]", name: "_payload", type: "bytes[]" },
    ],
    name: "transferExternal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

/**
 * Get adjusted gas price from provider.
 * Doubles the gas price to ensure transaction inclusion.
 * Falls back to 2 gwei if gas price is unavailable.
 */
async function getDoubledGasPrice(
  provider: ethers.JsonRpcProvider
): Promise<bigint> {
  const feeData = await provider.getFeeData();

  // Use maxFeePerGas (EIP-1559) or gasPrice (legacy), with 2x multiplier
  const basePrice = feeData.maxFeePerGas ?? feeData.gasPrice;

  if (!basePrice) {
    // Fallback to 2 gwei if provider returns nothing
    return parseUnits("2", "gwei");
  }

  // Double the gas price
  return basePrice * 2n;
}

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// RPC proxy endpoint - forwards RPC requests to hide credentials
app.post("/rpc/:chainId", async (req: Request, res: Response) => {
  try {
    const { chainId } = req.params;

    // Validate chain ID
    if (!RPC_URLS[chainId]) {
      res.status(400).json({
        error: "Unsupported chain ID",
        supportedChains: Object.keys(RPC_URLS),
      });
      return;
    }

    const rpcUrl = RPC_URLS[chainId];

    if (!rpcUrl) {
      res.status(503).json({
        error: "RPC endpoint not configured for this chain",
        chainId,
      });
      return;
    }

    // Forward the JSON-RPC request
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    // Log RPC requests (optional, can be disabled in production)
    if (process.env.LOG_RPC_REQUESTS === "true") {
      console.log(`\n🔗 RPC Request to chain ${chainId}:`);
      console.log("  Method:", req.body.method);
      console.log("  Response status:", response.status);
    }

    res.status(response.status).json(data);
  } catch (error) {
    console.error("Error proxying RPC request:", error);
    res.status(500).json({
      error: "Failed to proxy RPC request",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Main transaction endpoint
app.post("/tx", (req: Request, res: Response) => {
  try {
    const txRequest = req.body as TransactionRequest;

    // Validate the request structure
    if (!txRequest.proof || !txRequest.payload) {
      res.status(400).json({
        error: "Invalid request: missing proof or payload",
      });
      return;
    }

    if (!txRequest.proof.proof || !txRequest.proof.publicInputs) {
      res.status(400).json({
        error: "Invalid proof structure: missing proof or publicInputs",
      });
      return;
    }

    // Log the received transaction
    console.log("\n📥 Received transaction request:");
    console.log("  - Proof length:", txRequest.proof.proof.length, "bytes");
    console.log("  - Public inputs:", txRequest.proof.publicInputs.length);
    console.log("  - Payload items:", txRequest.payload.length);

    // Log public inputs
    console.log("\n  Public Inputs:");
    txRequest.proof.publicInputs.forEach((input, i) => {
      console.log(`    [${i}]: ${input.slice(0, 20)}...${input.slice(-10)}`);
    });

    // Log payload sizes
    console.log("\n  Payload sizes:");
    txRequest.payload.forEach((p, i) => {
      console.log(`    [${i}]: ${p.length} chars`);
    });

    // TODO: Add actual proof verification and transaction submission logic here
    // For now, we just acknowledge receipt

    console.log("\n✅ Transaction accepted for processing\n");

    res.json({
      success: true,
      message: "Transaction received and queued for processing",
      txId: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    });
  } catch (error) {
    console.error("Error processing transaction:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Sponsor transaction endpoint - submits transfer/transferExternal on behalf of user
app.post("/tx/sponsor", async (req: Request, res: Response) => {
  try {
    const sponsorRequest = req.body as SponsorRequest;

    // Validate request structure
    if (!sponsorRequest.type || !sponsorRequest.chainId) {
      res.status(400).json({
        error: "Invalid request: missing type or chainId",
      });
      return;
    }

    if (!["transfer", "transferExternal"].includes(sponsorRequest.type)) {
      res.status(400).json({
        error: "Invalid type: must be 'transfer' or 'transferExternal'",
      });
      return;
    }

    if (!sponsorRequest.proof || !sponsorRequest.publicInputs) {
      res.status(400).json({
        error: "Invalid request: missing proof or publicInputs",
      });
      return;
    }

    if (!sponsorRequest.payload || !Array.isArray(sponsorRequest.payload)) {
      res.status(400).json({
        error: "Invalid request: missing or invalid payload",
      });
      return;
    }

    // Validate chain ID
    const contractAddress = CONTRACT_ADDRESSES[sponsorRequest.chainId];
    if (!contractAddress) {
      res.status(400).json({
        error: "Unsupported chain ID",
        supportedChains: Object.keys(CONTRACT_ADDRESSES),
      });
      return;
    }

    // Get RPC URL for chain
    const rpcUrl = RPC_URLS[String(sponsorRequest.chainId)];
    if (!rpcUrl) {
      res.status(400).json({
        error: "RPC not configured for this chain",
        chainId: sponsorRequest.chainId,
      });
      return;
    }

    // Get sponsor private key
    const sponsorPrivateKey = process.env.SPONSOR_PRIVATE_KEY;
    if (!sponsorPrivateKey) {
      console.error("SPONSOR_PRIVATE_KEY not configured");
      res.status(500).json({
        error: "Sponsor not configured",
      });
      return;
    }

    console.log("\n📥 Received sponsor request:");
    console.log("  - Type:", sponsorRequest.type);
    console.log("  - Chain ID:", sponsorRequest.chainId);
    console.log("  - Proof length:", sponsorRequest.proof.length, "chars");
    console.log("  - Public inputs:", sponsorRequest.publicInputs.length);
    console.log("  - Payload items:", sponsorRequest.payload.length);

    // Set up provider and signer
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(sponsorPrivateKey, provider);

    // Get doubled gas price
    const gasPrice = await getDoubledGasPrice(provider);
    console.log("  - Gas price (2x):", ethers.formatUnits(gasPrice, "gwei"), "gwei");

    // Initialize contract
    const contract = new ethers.Contract(
      contractAddress,
      COMMBANK_ABI,
      wallet
    );

    // Submit transaction
    let tx: ethers.ContractTransactionResponse;

    if (sponsorRequest.type === "transfer") {
      tx = await contract.transfer(
        sponsorRequest.proof,
        sponsorRequest.publicInputs,
        sponsorRequest.payload,
        { gasPrice }
      );
    } else {
      tx = await contract.transferExternal(
        sponsorRequest.proof,
        sponsorRequest.publicInputs,
        sponsorRequest.payload,
        { gasPrice }
      );
    }

    console.log("✅ Transaction submitted:", tx.hash);

    res.json({
      success: true,
      transactionHash: tx.hash,
    });
  } catch (error) {
    console.error("Error sponsoring transaction:", error);

    // Return 400 for transaction failures
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    res.status(400).json({
      error: "Transaction failed",
      message: errorMessage,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`\n🚀 Relayer server running on http://localhost:${PORT}`);
  console.log(`   POST /tx - Submit a transaction`);
  console.log(`   POST /tx/sponsor - Sponsor a transfer/withdraw transaction`);
  console.log(`   POST /rpc/:chainId - RPC proxy endpoint`);
  console.log(`   GET /health - Health check`);
  console.log(`\n🔒 CORS enabled for origins: ${ALLOWED_ORIGINS.join(", ")}`);
  console.log(
    `📡 RPC chains configured: ${Object.keys(RPC_URLS)
      .filter((k) => RPC_URLS[k])
      .join(", ")}`,
  );
  console.log(
    `💰 Sponsor chains configured: ${Object.keys(CONTRACT_ADDRESSES).join(", ")}\n`,
  );
});
