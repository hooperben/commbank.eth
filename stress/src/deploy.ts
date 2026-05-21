// Stress harness deployer. One-shot: deploys the full protocol against the
// running hardhat node, grants DEPOSIT_ROLE to every worker, writes the
// deployment manifest to DEPLOYMENT_PATH so workers can read it.
//
// Run with: tsx src/deploy.ts

import {
  Contract,
  ContractFactory,
  JsonRpcProvider,
  NonceManager,
  keccak256,
  toUtf8Bytes,
} from "ethers";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { deployerWallet, workerCount, workerWallet } from "./accounts.js";
import { artifacts, linkBytecode, loadPoseidon2Huff, loadVerifierLib } from "./artifacts.js";
import { error, info } from "./log.js";

const RPC_URL = process.env.RPC_URL || "http://hardhat-node:8545";
const DEPLOYMENT_PATH = process.env.DEPLOYMENT_PATH || "/shared/deployment.json";

const DEPOSIT_ROLE = keccak256(toUtf8Bytes("DEPOSIT_ROLE"));

type Manifest = {
  rpcUrl: string;
  chainId: number;
  commbankDotEth: string;
  poseidon2: string;
  depositVerifier: string;
  transferVerifier: string;
  withdrawVerifier: string;
  transferExternalVerifier: string;
  workers: { index: number; address: string }[];
};

const main = async () => {
  const provider = new JsonRpcProvider(RPC_URL);
  const network = await provider.getNetwork();
  // NonceManager keeps a local nonce counter so back-to-back deploys don't
  // race the node's view of mempool state. Without this, ethers v6's
  // waitForDeployment can resolve before the node has actually mined the
  // tx, and the next deploy submits with the same nonce.
  const deployer = new NonceManager(deployerWallet().connect(provider));

  const deployerAddr = await deployer.getAddress();
  info("deploy", "starting deployment", {
    rpc: RPC_URL,
    chainId: Number(network.chainId),
    deployer: deployerAddr,
  });

  // Deploy a contract from a raw {abi, bytecode}. Used for the unlinked
  // library and CommBankDotEth itself.
  const deployArtifact = async (
    name: string,
    art: { abi: any[]; bytecode: string },
    args: any[] = [],
  ) => {
    const f = new ContractFactory(art.abi, art.bytecode, deployer as any);
    const c = await f.deploy(...args);
    // Explicitly await the deploy tx receipt — waitForDeployment alone can
    // resolve via getCode polling before the node has flushed the tx,
    // which races the next nonce.
    const tx = c.deploymentTransaction();
    if (tx) await tx.wait();
    await c.waitForDeployment();
    const addr = await c.getAddress();
    info("deploy", `${name} deployed`, { address: addr });
    return addr;
  };

  // Each verifier .sol embeds its own ZKTranscriptLib. Deploy a fresh lib
  // per verifier, then link its address into the verifier bytecode before
  // deploying the verifier.
  const deployVerifier = async (name: string) => {
    const libArt = await loadVerifierLib(name, "ZKTranscriptLib");
    const libAddr = await deployArtifact(`${name}/ZKTranscriptLib`, libArt);

    // Verifier artifact — note both `name` (loaded fn) and library link map
    const art =
      name === "DepositVerifier"
        ? await artifacts.depositVerifier()
        : name === "TransferVerifier"
          ? await artifacts.transferVerifier()
          : name === "WithdrawVerifier"
            ? await artifacts.withdrawVerifier()
            : await artifacts.transferExternalVerifier();

    const linked = linkBytecode(art, { ZKTranscriptLib: libAddr });
    return await deployArtifact(name, { abi: art.abi, bytecode: linked });
  };

  const depositAddr = await deployVerifier("DepositVerifier");
  const transferAddr = await deployVerifier("TransferVerifier");
  const withdrawAddr = await deployVerifier("WithdrawVerifier");
  const transferExtAddr = await deployVerifier("TransferExternalVerifier");

  // Poseidon2 hasher (Huff bytecode, no ABI)
  const huff = await loadPoseidon2Huff();
  const poseidonAddr = await deployArtifact("Poseidon2Huff", {
    abi: [],
    bytecode: huff.bytecode,
  });

  // CommBankDotEth
  const cbArt = await artifacts.commbankDotEth();
  const cbAddr = await deployArtifact(
    "CommBankDotEth",
    { abi: cbArt.abi, bytecode: cbArt.bytecode },
    [depositAddr, transferAddr, withdrawAddr, transferExtAddr],
  );

  // Wire poseidon
  const cbContract = new Contract(cbAddr, cbArt.abi, deployer as any);
  const setTx = await cbContract.setPoseidon(poseidonAddr);
  await setTx.wait();
  info("deploy", "setPoseidon done");

  // Grant DEPOSIT_ROLE to all workers
  const workers: Manifest["workers"] = [];
  for (let i = 0; i < workerCount(); i++) {
    const w = workerWallet(i);
    const grantTx = await cbContract.grantRole(DEPOSIT_ROLE, w.address);
    await grantTx.wait();
    workers.push({ index: i, address: w.address });
    info("deploy", "granted DEPOSIT_ROLE", { worker: i, address: w.address });
  }

  const manifest: Manifest = {
    rpcUrl: RPC_URL,
    chainId: Number(network.chainId),
    commbankDotEth: cbAddr,
    poseidon2: poseidonAddr,
    depositVerifier: depositAddr,
    transferVerifier: transferAddr,
    withdrawVerifier: withdrawAddr,
    transferExternalVerifier: transferExtAddr,
    workers,
  };

  await mkdir(dirname(DEPLOYMENT_PATH), { recursive: true });
  await writeFile(DEPLOYMENT_PATH, JSON.stringify(manifest, null, 2));
  info("deploy", "manifest written", { path: DEPLOYMENT_PATH });
};

main().catch((e) => {
  error("deploy", "fatal", { err: e?.message ?? String(e), stack: e?.stack });
  process.exit(1);
});
