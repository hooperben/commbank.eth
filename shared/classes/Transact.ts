import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";

import transferCircuit from "../../circuits/transfer/target/transfer.json";
import { getBbApi } from "./bb-api.js";

export class Transact {
  public transactNoir: Noir;
  private _backend: UltraHonkBackend | undefined;

  constructor() {
    // @ts-expect-error - not sure
    this.transactNoir = new Noir(transferCircuit);
  }

  async init() {
    const api = await getBbApi();
    this._backend = new UltraHonkBackend(transferCircuit.bytecode, api);
  }

  get transactBackend(): UltraHonkBackend {
    if (!this._backend)
      throw new Error("Transact not initialized — call await transact.init()");
    return this._backend;
  }
}
