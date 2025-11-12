/// <reference types="hardhat" />

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CommbankDotEthModule = buildModule("commbankDotEth", (m) => {
  const zkTranscriptLib = m.library(
    "contracts/verifiers/DepositVerifier.sol:ZKTranscriptLib",
  );
  const depositVerifier = m.contract("DepositVerifier", [], {
    libraries: {
      ZKTranscriptLib: zkTranscriptLib,
    },
  });
  const transferVerifier = m.contract("TransferVerifier", [], {
    libraries: {
      ZKTranscriptLib: zkTranscriptLib,
    },
  });
  const withdrawVerifier = m.contract("WithdrawVerifier", [], {
    libraries: {
      ZKTranscriptLib: zkTranscriptLib,
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
