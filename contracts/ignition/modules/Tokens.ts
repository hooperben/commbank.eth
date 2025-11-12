/// <reference types="hardhat" />

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TokensModule = buildModule("tokens", (m) => {
  const usdcDeployment = m.contract("USDC");
  const fourDecDeployment = m.contract("FourDEC");

  return {
    usdcDeployment,
    fourDecDeployment,
  };
});

export default TokensModule;
