import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";

import withdrawCircuit from "../../circuits/withdraw/target/withdraw.json";

export class Withdraw {
  public withdrawNoir: Noir;
  public withdrawBackend: UltraHonkBackend;

  constructor() {
    // @ts-expect-error - not sure
    this.withdrawNoir = new Noir(withdrawCircuit);
    this.withdrawBackend = new UltraHonkBackend(withdrawCircuit.bytecode);
  }
}
