// Tear down the Barretenberg singleton shared by every class in this
// directory. Call once on shutdown so the bb.js WASM worker thread
// releases and the Node process can exit. Idempotent.

export { destroyBbApi as destroyAllBb } from "./bb-api.js";
