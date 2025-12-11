/// <reference types="hardhat" />

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import DepositVerifierModule from "./DepositVerifier";
import TransferVerifierModule from "./TransferVerifier";
import WithdrawVerifierModule from "./WithdrawVerifier";

const CommbankDotEthModule = buildModule("commbankDotEth", (m) => {
  // Import the verifier modules
  // TODO this is a bug - the library in these modules is actually the contract
  const { depositVerifierZKTL } = m.useModule(DepositVerifierModule);
  const { transferVerifierZKTL } = m.useModule(TransferVerifierModule);
  const { withdrawVerifierZKTL } = m.useModule(WithdrawVerifierModule);

  // Deploy CommBankDotEth with the verifier contracts (not libraries)
  const commbankDotEth = m.contract("CommBankDotEth", [
    depositVerifierZKTL,
    transferVerifierZKTL,
    withdrawVerifierZKTL,
  ]);

  return {
    commbankDotEth,
    depositVerifier: depositVerifierZKTL,
    transferVerifier: transferVerifierZKTL,
    withdrawVerifier: withdrawVerifierZKTL,
  };
});

export default CommbankDotEthModule;
