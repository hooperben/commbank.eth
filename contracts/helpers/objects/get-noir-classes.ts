import { Barretenberg, UltraHonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";

import depositCircuit from "../../../circuits/deposit/target/deposit.json";
import transferCircuit from "../../../circuits/transfer/target/transfer.json";
import withdrawCircuit from "../../../circuits/withdraw/target/withdraw.json";
import transferExternalCircuit from "../../../circuits/transfer_external/target/transfer_external.json";

let _api: Barretenberg | undefined;
const getApi = async () => {
  if (!_api) _api = await Barretenberg.new();
  return _api;
};

// Tear down the bb.js WASM worker started by the helpers in this file so the
// host process can exit. Safe to call multiple times. Hardhat tests should
// invoke this in a global `after()` hook; the run script invokes it after
// the harness drains.
export const destroyNoirApi = async () => {
  if (!_api) return;
  await _api.destroy();
  _api = undefined;
};

export const getNoirClasses = async () => {
  const api = await getApi();

  // @ts-expect-error noir_js circuit JSON typing
  const depositNoir = new Noir(depositCircuit);
  const depositBackend = new UltraHonkBackend(depositCircuit.bytecode, api);

  // @ts-expect-error noir_js circuit JSON typing
  const transferNoir = new Noir(transferCircuit);
  const transferBackend = new UltraHonkBackend(transferCircuit.bytecode, api);

  // @ts-expect-error noir_js circuit JSON typing
  const withdrawNoir = new Noir(withdrawCircuit);
  const withdrawBackend = new UltraHonkBackend(withdrawCircuit.bytecode, api);

  // @ts-expect-error noir_js circuit JSON typing
  const transferExternalNoir = new Noir(transferExternalCircuit);
  const transferExternalBackend = new UltraHonkBackend(
    transferExternalCircuit.bytecode,
    api,
  );

  return {
    depositNoir,
    depositBackend,
    transferNoir,
    transferBackend,
    withdrawNoir,
    withdrawBackend,
    transferExternalNoir,
    transferExternalBackend,
  };
};
