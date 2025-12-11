/// <reference types="hardhat" />

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import DepositVerifierModule from "./DepositVerifier";
import TransferVerifierModule from "./TransferVerifier";
import WithdrawVerifierModule from "./WithdrawVerifier";

const CommbankDotEthModule = buildModule("commbankDotEth", (m) => {
  // Import the verifier modules
  const { depositVerifier } = m.useModule(DepositVerifierModule);
  const { transferVerifier } = m.useModule(TransferVerifierModule);
  const { withdrawVerifier } = m.useModule(WithdrawVerifierModule);

  // Deploy CommBankDotEth with the verifier contracts (not libraries)
  const commbankDotEth = m.contract("CommBankDotEth", [
    depositVerifier,
    transferVerifier,
    withdrawVerifier,
  ]);

  return {
    commbankDotEth,
    depositVerifier,
    transferVerifier,
    withdrawVerifier,
  };
});

export default CommbankDotEthModule;
