// Worker accounts derived from hardhat's default test mnemonic. The deployer
// uses account 0; workers use accounts 1..WORKER_COUNT.
//
// Same mnemonic that `hardhat node` exposes by default — keys are well-known
// and not secret; these accounts only exist on the local stress node.

import { HDNodeWallet, Mnemonic, Wallet } from "ethers";

export const HARDHAT_MNEMONIC =
  "test test test test test test test test test test test junk";

// Hardhat funds accounts 0..19 with 10000 ETH each on the default mnemonic.
// We carve them up:
//   index 0          : deployer
//   index 1..N       : workers (own deposits, generate transfer/withdraw proofs)
//   index N+1..N+R   : relayers (submit transfer/withdraw txs on workers' behalf)
//
// Worker addresses must also receive DEPOSIT_ROLE; relayers don't need it
// because transfer() and withdraw() are unrestricted on the contract.
export const DEPLOYER_PATH = "m/44'/60'/0'/0/0";
export const workerPath = (i: number) => `m/44'/60'/0'/0/${i + 1}`;
export const relayerPath = (i: number, workerCt: number) =>
  `m/44'/60'/0'/0/${workerCt + 1 + i}`;

const m = Mnemonic.fromPhrase(HARDHAT_MNEMONIC);

export const deployerWallet = (): HDNodeWallet =>
  HDNodeWallet.fromMnemonic(m, DEPLOYER_PATH);

export const workerWallet = (i: number): HDNodeWallet =>
  HDNodeWallet.fromMnemonic(m, workerPath(i));

export const relayerWallet = (i: number, workerCt: number): HDNodeWallet =>
  HDNodeWallet.fromMnemonic(m, relayerPath(i, workerCt));

export const workerCount = (): number => Number(process.env.WORKER_COUNT ?? 10);
export const relayerCount = (): number => Number(process.env.RELAYER_COUNT ?? 3);
