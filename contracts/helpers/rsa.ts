import * as path from "path";

import * as SignatureGenModule from "../web/signature_gen";
export { SignatureGenModule };

const RSA = (): typeof SignatureGenModule => {
  // Import the Node.js-compatible bindings
  const wasmBindingsPath = path.resolve(__dirname, "../web/signature_gen.js");
  const wasmModule = require(wasmBindingsPath) as typeof SignatureGenModule;

  return wasmModule;
};

export default RSA;
