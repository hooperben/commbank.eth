/// <reference types="hardhat" />

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TransferExternalVerifierModule = buildModule(
  "transferExternalVerifier",
  (m) => {
    const transferExternalVerifierZKTL = m.library(
      "contracts/verifiers/TransferExternalVerifier.sol:ZKTranscriptLib",
      {
        id: "TransferVerifierLib",
      },
    );

    const transferExternalVerifier = m.contract(
      "TransferExternalVerifier",
      [],
      {
        libraries: {
          ZKTranscriptLib: transferExternalVerifierZKTL,
        },
      },
    );

    return {
      transferExternalVerifier,
      transferExternalVerifierZKTL,
    };
  },
);

export default TransferExternalVerifierModule;
