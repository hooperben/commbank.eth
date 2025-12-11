/// <reference types="hardhat" />

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DepositVerifierModule = buildModule("depositVerifier", (m) => {
  const depositVerifierZKTL = m.library(
    "contracts/verifiers/DepositVerifier.sol:ZKTranscriptLib",
    {
      id: "DepositVerifierLib",
    },
  );

  const depositVerifier = m.contract("DepositVerifier", [], {
    libraries: {
      ZKTranscriptLib: depositVerifierZKTL,
    },
  });

  return {
    depositVerifier,
  };
});

export default DepositVerifierModule;
