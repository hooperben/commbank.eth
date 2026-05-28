import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir, type CompiledCircuit } from "@noir-lang/noir_js";

import depositCircuit from "../../circuits/deposit/target/deposit.json";
import { getBbApi } from "./bb-api.js";

export class Deposit {
  public depositNoir: Noir;
  private _backend: UltraHonkBackend | undefined;

  constructor() {
    this.depositNoir = new Noir(depositCircuit as CompiledCircuit);
  }

  async init() {
    const api = await getBbApi();
    this._backend = new UltraHonkBackend(depositCircuit.bytecode, api);
  }

  get depositBackend(): UltraHonkBackend {
    if (!this._backend)
      throw new Error("Deposit not initialized — call await deposit.init()");
    return this._backend;
  }
}
