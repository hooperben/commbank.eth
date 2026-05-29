import { Barretenberg } from "@aztec/bb.js";

let _api: Barretenberg | undefined;

export const getBbApi = async () => {
  if (!_api) _api = await Barretenberg.new();
  return _api;
};

// Tear down the bb.js WASM worker so the host process can exit. Safe to
// call multiple times. After this the next backend init will spin up a
// fresh Barretenberg instance.
export const destroyBbApi = async () => {
  if (!_api) return;
  await _api.destroy();
  _api = undefined;
};
