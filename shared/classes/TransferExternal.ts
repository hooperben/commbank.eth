import { UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";

import transferExternalCircuit from "../../circuits/transfer_external/target/transfer_external.json";

export class TransferExternal {
  public transferExternalNoir: Noir;
  public transferExternalBackend: UltraHonkBackend;

  constructor() {
    // @ts-expect-error - not sure
    this.transferExternalNoir = new Noir(transferExternalCircuit);
    this.transferExternalBackend = new UltraHonkBackend(
      transferExternalCircuit.bytecode,
    );
  }
}
