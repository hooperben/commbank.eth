import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir, CompiledCircuit } from "@noir-lang/noir_js";

import depositCircuit from "../../circuits/deposit/target/deposit.json";

export class Deposit {
  public depositNoir: Noir;
  public depositBackend: UltraHonkBackend;

  constructor() {
    this.depositNoir = new Noir(depositCircuit as CompiledCircuit);
    this.depositBackend = new UltraHonkBackend(depositCircuit.bytecode);
  }
}
