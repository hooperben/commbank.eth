/// <reference types="hardhat" />

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CommbankDotEthModule = buildModule("commbankDotEth", (m) => {
  const depositVerifierZKTL = m.library(
    "contracts/verifiers/DepositVerifier.sol:ZKTranscriptLib",
    { id: "DepositVerifierLib" },
  );
  const depositVerifier = m.contract("DepositVerifier", [], {
    libraries: {
      ZKTranscriptLib: depositVerifierZKTL,
    },
  });

  const transferVerifierZKTL = m.library(
    "contracts/verifiers/TransferVerifier.sol:ZKTranscriptLib",
    { id: "TransferVerifierLib" },
  );
  const transferVerifier = m.contract("TransferVerifier", [], {
    libraries: {
      ZKTranscriptLib: transferVerifierZKTL,
    },
  });

  const withdrawVerifierZKTL = m.library(
    "contracts/verifiers/WithdrawVerifier.sol:ZKTranscriptLib",
    { id: "WithdrawVerifierLib" },
  );
  const withdrawVerifier = m.contract("WithdrawVerifier", [], {
    libraries: {
      ZKTranscriptLib: withdrawVerifierZKTL,
    },
  });

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
