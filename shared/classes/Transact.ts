import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";

import transferCircuit from "../../circuits/transfer/target/transfer.json";

export class Transact {
  public transactNoir: Noir;
  public transactBackend: UltraHonkBackend;

  constructor() {
    // @ts-expect-error - not sure
    this.transactNoir = new Noir(transferCircuit);
    this.transactBackend = new UltraHonkBackend(transferCircuit.bytecode);
  }
}
