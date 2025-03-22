import * as path from "path";

async function main() {
  try {
    // Import the Node.js-compatible bindings
    const wasmBindingsPath = path.resolve(__dirname, "../web/signature_gen.js");
    const wasmModule = require(wasmBindingsPath);

    // Call your Rust function
    const result = wasmModule.generate_signature(
      "Hello, TypeScript!",
      2048,
      65537,
    );
    console.log("Result obtained successfully!");
    console.log("Hash:", result.hash);
    console.log("Modulus limbs:", result.modulus_limbs);
    console.log("REDC limbs:", result.redc_limbs);
    console.log("Signature limbs:", result.signature_limbs);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
