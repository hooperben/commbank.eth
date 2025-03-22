import * as path from "path";
import { SignatureResult, type KeyPair } from "../web/signature_gen";
import { performance } from "perf_hooks";

async function main() {
  try {
    // Import the Node.js-compatible bindings
    const wasmBindingsPath = path.resolve(__dirname, "../web/signature_gen.js");
    const wasmModule = require(wasmBindingsPath);

    // Time key pair creation
    const startKeyPair = performance.now();
    const keyPair: KeyPair = wasmModule.create_key_pair(
      "test secret",
      2048,
      65537,
    );
    const endKeyPair = performance.now();
    const keyPairTimeSeconds = (endKeyPair - startKeyPair) / 1000;

    // Time signature generation
    const startSignature = performance.now();
    const result: SignatureResult = wasmModule.generate_signature_from_key(
      "custom signed and saved",
      keyPair.private_key,
    );
    const endSignature = performance.now();
    const signatureTimeSeconds = (endSignature - startSignature) / 1000;

    // Calculate total time
    const totalTimeSeconds = keyPairTimeSeconds + signatureTimeSeconds;

    console.log(
      `Key pair creation took: ${keyPairTimeSeconds.toFixed(3)} seconds`,
    );
    console.log(
      `Signature generation took: ${signatureTimeSeconds.toFixed(3)} seconds`,
    );
    console.log(`Total time: ${totalTimeSeconds.toFixed(3)} seconds`);

    console.log("let hash: [u8; 32] = [", result.hash, "];");
    console.log(
      `let params: BigNumParams<18, 2048> = BigNumParams::new(\n\tfalse,\n\t[${result.modulus_limbs}],\n\t[${result.redc_limbs}]\n);`,
    );
    console.log(
      `let signature: RuntimeBigNum<18, 2048> = RuntimeBigNum { \n\tparams,\n\tlimbs: [${result.signature_limbs}], };`,
    );
    console.log(
      `assert(noir_rsa::rsa::verify_sha256_pkcs1v15(hash, signature, 65537));`,
    );
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
