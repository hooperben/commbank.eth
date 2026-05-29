import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";

import withdrawCircuit from "../../circuits/withdraw/target/withdraw.json";
import { getBbApi } from "./bb-api.js";

export class Withdraw {
  public withdrawNoir: Noir;
  private _backend: UltraHonkBackend | undefined;

  constructor() {
    // @ts-expect-error - not sure
    this.withdrawNoir = new Noir(withdrawCircuit);
  }

  async init() {
    const api = await getBbApi();
    this._backend = new UltraHonkBackend(withdrawCircuit.bytecode, api);
  }

  get withdrawBackend(): UltraHonkBackend {
    if (!this._backend)
      throw new Error("Withdraw not initialized — call await withdraw.init()");
    return this._backend;
  }
}
