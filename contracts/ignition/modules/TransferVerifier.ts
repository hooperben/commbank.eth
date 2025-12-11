/// <reference types="hardhat" />

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TransferVerifierModule = buildModule("transferVerifier", (m) => {
  const transferVerifierZKTL = m.library(
    "contracts/verifiers/TransferVerifier.sol:ZKTranscriptLib",
    {
      id: "TransferVerifierLib",
    },
  );

  const transferVerifier = m.contract("TransferVerifier", [], {
    libraries: {
      ZKTranscriptLib: transferVerifierZKTL,
    },
  });

  return {
    transferVerifier,
    transferVerifierZKTL,
  };
});

export default TransferVerifierModule;
