// Block until the JSON-RPC endpoint at RPC_URL responds to eth_chainId.
// Used by docker-compose so deployer/workers don't race the hardhat-node container.

import { JsonRpcProvider } from "ethers";
import { info, warn } from "./log.js";

const RPC_URL = process.env.RPC_URL || "http://hardhat-node:8545";
const MAX_WAIT_MS = Number(process.env.WAIT_RPC_MAX_MS ?? 60_000);
const POLL_MS = 500;

const main = async () => {
  const provider = new JsonRpcProvider(RPC_URL);
  const start = Date.now();
  while (Date.now() - start < MAX_WAIT_MS) {
    try {
      const net = await provider.getNetwork();
      info("wait-rpc", "rpc ready", { rpc: RPC_URL, chainId: Number(net.chainId) });
      return;
    } catch (e) {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
  warn("wait-rpc", "timeout waiting for rpc", { rpc: RPC_URL, waited_ms: MAX_WAIT_MS });
  process.exit(1);
};

main();
