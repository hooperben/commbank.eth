/// <reference types="hardhat" />

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const WithdrawVerifierModule = buildModule("withdrawVerifier", (m) => {
  const withdrawVerifierZKTL = m.library(
    "contracts/verifiers/WithdrawVerifier.sol:ZKTranscriptLib",
    {
      id: "WithdrawVerifierLib",
    },
  );

  const withdrawVerifier = m.contract("WithdrawVerifier", [], {
    libraries: {
      ZKTranscriptLib: withdrawVerifierZKTL,
    },
  });

  return {
    withdrawVerifier,
    withdrawVerifierZKTL,
  };
});

export default WithdrawVerifierModule;
