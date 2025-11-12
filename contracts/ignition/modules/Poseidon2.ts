/// <reference types="hardhat" />

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const Poseidon2Module = buildModule("poseidon2", (m) => {
  const poseidon2 = m.contract("Poseidon2Yul");

  return {
    poseidon2,
  };
});

export default Poseidon2Module;
