import express, { Request, Response } from "express";
import cors from "cors";

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

// Start the server
app.listen(PORT, () => {
  console.log(`\n🚀 Relayer server running on http://localhost:${PORT}`);
  console.log(`   POST /tx - Submit a transaction`);
  console.log(`   POST /rpc/:chainId - RPC proxy endpoint`);
  console.log(`   GET /health - Health check`);
  console.log(`\n🔒 CORS enabled for origins: ${ALLOWED_ORIGINS.join(", ")}`);
  console.log(
    `📡 RPC chains configured: ${Object.keys(RPC_URLS)
      .filter((k) => RPC_URLS[k])
      .join(", ")}\n`,
  );
});
