import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";

import depositCircuit from "../../circuits/deposit/target/deposit.json";

export class Deposit {
  public depositNoir: Noir;
  public depositBackend: UltraHonkBackend;

  constructor() {
    // @ts-expect-error - not sure
    this.depositNoir = new Noir(depositCircuit);
    this.depositBackend = new UltraHonkBackend(depositCircuit.bytecode);
  }
}
