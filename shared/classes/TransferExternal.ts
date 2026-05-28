import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";

import transferExternalCircuit from "../../circuits/transfer_external/target/transfer_external.json";
import { getBbApi } from "./bb-api.js";

export class TransferExternal {
  public transferExternalNoir: Noir;
  private _backend: UltraHonkBackend | undefined;

  constructor() {
    // @ts-expect-error - not sure
    this.transferExternalNoir = new Noir(transferExternalCircuit);
  }

  async init() {
    const api = await getBbApi();
    this._backend = new UltraHonkBackend(
      transferExternalCircuit.bytecode,
      api,
    );
  }

  get transferExternalBackend(): UltraHonkBackend {
    if (!this._backend)
      throw new Error(
        "TransferExternal not initialized — call await transferExternal.init()",
      );
    return this._backend;
  }
}
