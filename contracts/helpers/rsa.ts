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

export const getPayload = (
  noteSecret: Uint8Array,
  assetId: Uint8Array,
  amount: Uint8Array,
) => {
  // Convert note_secret to hex string
  const noteSecretHex =
    "0x" +
    Array.from(noteSecret)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

  // Convert asset_id to hex string
  const assetIdHex =
    "0x" +
    Array.from(assetId)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

  // Convert amount to hex string
  const amountHex =
    "0x" +
    Array.from(amount)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

  console.log("Note Secret (hex):", noteSecretHex);
  console.log("Asset ID (hex):", assetIdHex);
  console.log("Amount (hex):", amountHex);

  return `0x${noteSecretHex}${assetIdHex}${amountHex}`;
};
