import express, { Request, Response } from "express";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json({ limit: "10mb" }));

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
  console.log(`   GET /health - Health check\n`);
});
