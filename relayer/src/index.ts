import cors from "cors";
import express, { Request, Response } from "express";

import "dotenv/config";

import { SUPPORTED_NETWORKS } from "shared/constants/networks";
import { RPC_URLS } from "./constants";
import {
  generateTxId,
  processQueue,
  transactionMap,
  transactionQueue,
} from "./helpers";
import type {
  QueuedTransaction,
  SponsorRequest,
  TransactionRequest,
} from "./types";

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
      console.log(`\n[rpc] Request to chain ${chainId}:`);
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
    console.log("\n[tx] Received transaction request:");
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

    console.log("\n[ok] Transaction accepted for processing\n");

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

// Sponsor transaction endpoint - queues transfer/transferExternal for submission
app.post("/tx/sponsor", (req: Request, res: Response) => {
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
    const contractAddress =
      SUPPORTED_NETWORKS[sponsorRequest.chainId].CommBankDotEth;
    if (!contractAddress) {
      res.status(400).json({
        error: "Unsupported chain ID",
        supportedChains: Object.keys(SUPPORTED_NETWORKS),
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

    // Check sponsor is configured
    if (!process.env.SPONSOR_PRIVATE_KEY) {
      console.error("SPONSOR_PRIVATE_KEY not configured");
      res.status(500).json({
        error: "Sponsor not configured",
      });
      return;
    }

    // Generate transaction ID and create queued transaction
    const txId = generateTxId();
    const now = Date.now();

    const queuedTx: QueuedTransaction = {
      txId,
      status: "queued",
      request: sponsorRequest,
      createdAt: now,
      updatedAt: now,
      queuePosition: transactionQueue.length,
    };

    // Add to queue and lookup map
    transactionQueue.push(queuedTx);
    transactionMap.set(txId, queuedTx);

    console.log(`\n[sponsor] Transaction ${txId} queued`);
    console.log("  - Type:", sponsorRequest.type);
    console.log("  - Chain ID:", sponsorRequest.chainId);
    console.log("  - Queue position:", queuedTx.queuePosition);
    console.log("  - Queue length:", transactionQueue.length);

    // Start processing queue (non-blocking)
    processQueue();

    // Return immediately with txId
    res.json({
      success: true,
      txId,
      status: "queued",
      queuePosition: queuedTx.queuePosition,
    });
  } catch (error) {
    console.error("Error queuing transaction:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    res.status(400).json({
      error: "Failed to queue transaction",
      message: errorMessage,
    });
  }
});

// Get transaction status by txId
app.get("/tx/sponsor/:txId", (req: Request, res: Response) => {
  try {
    const { txId } = req.params;

    const queuedTx = transactionMap.get(txId);

    if (!queuedTx) {
      res.status(404).json({
        error: "Transaction not found",
        txId,
      });
      return;
    }

    // Calculate current queue position if still queued
    let queuePosition: number | undefined;
    if (queuedTx.status === "queued") {
      queuePosition = transactionQueue.findIndex((tx) => tx.txId === txId);
      if (queuePosition === -1) queuePosition = undefined;
    }

    res.json({
      txId: queuedTx.txId,
      status: queuedTx.status,
      transactionHash: queuedTx.transactionHash,
      errorMessage: queuedTx.errorMessage,
      queuePosition,
      createdAt: queuedTx.createdAt,
      updatedAt: queuedTx.updatedAt,
    });
  } catch (error) {
    console.error("Error getting transaction status:", error);

    res.status(500).json({
      error: "Failed to get transaction status",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`\n[server] Relayer running on http://localhost:${PORT}`);
  console.log(`   POST /tx - Submit a transaction`);
  console.log(
    `   POST /tx/sponsor - Queue a sponsored transfer/withdraw transaction`,
  );
  console.log(`   GET  /tx/sponsor/:txId - Get transaction status`);
  console.log(`   POST /rpc/:chainId - RPC proxy endpoint`);
  console.log(`   GET  /health - Health check`);
  console.log(`\n[cors] Allowed origins: ${ALLOWED_ORIGINS.join(", ")}`);
  console.log(
    `[rpc] Chains configured: ${Object.keys(RPC_URLS)
      .filter((k) => RPC_URLS[k])
      .join(", ")}`,
  );
  console.log(
    `[sponsor] Chains configured: ${Object.keys(SUPPORTED_NETWORKS).join(", ")}\n`,
  );
});
