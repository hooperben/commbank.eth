// Load compiled contract artifacts straight from `contracts/artifacts/`.
// These get produced by `npx hardhat compile` in the contracts package.
//
// We don't go through hardhat-ignition here — the stress harness needs a
// minimal deploy path that works from any node process pointed at any
// JSON-RPC endpoint, not just hardhat-the-test-runner.

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// stress/src/artifacts.ts -> repo-root/contracts/artifacts/
const ARTIFACTS_ROOT = resolve(__dirname, "../../contracts/artifacts");
const CONTRACTS_ROOT = resolve(__dirname, "../../contracts/contracts");

export type Artifact = {
  abi: any[];
  bytecode: string;
  linkReferences: Record<string, Record<string, { length: number; start: number }[]>>;
};

const loadArtifact = async (relPath: string): Promise<Artifact> => {
  const full = resolve(ARTIFACTS_ROOT, relPath);
  const raw = await readFile(full, "utf8");
  const json = JSON.parse(raw);
  return {
    abi: json.abi,
    bytecode: json.bytecode,
    linkReferences: json.linkReferences ?? {},
  };
};

// Each verifier ships with its own ZKTranscriptLib in the same .sol file.
// Returns the artifact for that lib next to a given verifier.
export const loadVerifierLib = (verifier: string, libName: string) =>
  loadArtifact(`contracts/verifiers/${verifier}.sol/${libName}.json`);

// Replace `__$hash$__` placeholders in bytecode with deployed library
// addresses. ethers v6's ContractFactory doesn't link automatically when
// you pass a raw bytecode string, so we substitute by position based on
// the artifact's linkReferences map.
export const linkBytecode = (
  art: Artifact,
  libs: Record<string, string>, // libName -> deployed 0x address
): string => {
  let bytecode = art.bytecode;
  for (const sourceFile of Object.keys(art.linkReferences)) {
    for (const libName of Object.keys(art.linkReferences[sourceFile])) {
      const addr = libs[libName];
      if (!addr) {
        throw new Error(`Missing library address for ${libName}`);
      }
      const addrHex = addr.toLowerCase().replace(/^0x/, "");
      if (addrHex.length !== 40) {
        throw new Error(`Bad library address ${addr}`);
      }
      for (const ref of art.linkReferences[sourceFile][libName]) {
        // `start` is in bytes within the deployable bytecode (sans 0x).
        // In the hex string we have to account for the "0x" prefix + 2 chars per byte.
        const hexStart = 2 + ref.start * 2;
        const hexEnd = hexStart + ref.length * 2;
        bytecode = bytecode.slice(0, hexStart) + addrHex + bytecode.slice(hexEnd);
      }
    }
  }
  return bytecode;
};

export const artifacts = {
  // Verifiers (auto-generated from circuits)
  depositVerifier: () =>
    loadArtifact("contracts/verifiers/DepositVerifier.sol/DepositVerifier.json"),
  transferVerifier: () =>
    loadArtifact("contracts/verifiers/TransferVerifier.sol/TransferVerifier.json"),
  withdrawVerifier: () =>
    loadArtifact("contracts/verifiers/WithdrawVerifier.sol/WithdrawVerifier.json"),
  transferExternalVerifier: () =>
    loadArtifact(
      "contracts/verifiers/TransferExternalVerifier.sol/TransferExternalVerifier.json",
    ),
  // Main protocol
  commbankDotEth: () =>
    loadArtifact("contracts/CommBankDotEth.sol/CommBankDotEth.json"),
};

// The Poseidon2 Huff hasher is shipped as a prebuilt JSON next to the source.
export const loadPoseidon2Huff = async (): Promise<{ bytecode: string }> => {
  const raw = await readFile(
    resolve(CONTRACTS_ROOT, "utils/Poseidon2Huff.json"),
    "utf8",
  );
  const json = JSON.parse(raw);
  return { bytecode: json.bytecode };
};
