import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

// Constants for bit sizes
const BITS_1024 = 1024;
const BITS_2048 = 2048;
const LIMB_SIZE_BITS = 120;

/**
 * Split a BigInt into limbs of specified bit size
 */
function splitIntoBitLimbs(
  num: bigint,
  bitSize: number,
  limbSize: number = LIMB_SIZE_BITS,
): bigint[] {
  const limbs: bigint[] = [];
  const limbMask = (1n << BigInt(limbSize)) - 1n;
  const numLimbs = Math.ceil(bitSize / limbSize);

  let remaining = num;
  for (let i = 0; i < numLimbs; i++) {
    limbs.push(remaining & limbMask);
    remaining = remaining >> BigInt(limbSize);
  }

  return limbs;
}

/**
 * Create Barrett reduction parameter for modular operations
 */
function computeBarrettReductionParameter(
  modulus: bigint,
  bitSize: number,
): bigint {
  // Barrett reduction parameter is floor(4^k / modulus)
  // where k is the number of bits in the modulus
  const k = BigInt(bitSize);
  return (1n << (2n * k)) / modulus;
}

/**
 * Format limbs as hex strings
 */
function formatLimbsAsHex(limbs: bigint[]): string {
  return limbs.map((limb) => `0x${limb.toString(16)}`).join(", ");
}

/**
 * Format limbs as TOML value strings
 */
function formatLimbsAsTomlValue(limbs: bigint[]): string[] {
  return limbs.map((limb) => `"0x${limb.toString(16)}"`);
}

/**
 * Format limbs in "bn_limbs" format
 */
function bnLimbs(num: bigint, bitSize: number): string {
  const limbSize = LIMB_SIZE_BITS;
  const limbs = splitIntoBitLimbs(num, bitSize, limbSize);
  return `[${formatLimbsAsHex(limbs)}]`;
}

/**
 * Generate 2048-bit signature parameters
 */
function generate2048BitSignatureParameters(
  msg: string,
  asToml: boolean,
): void {
  // Read the keys from files
  const privateKeyPem = fs.readFileSync(
    path.resolve("./private_key.pem"),
    "utf8",
  );
  const publicKeyPem = fs.readFileSync(
    path.resolve("./public_key.pem"),
    "utf8",
  );

  // Create a hash of the message
  const hash = crypto.createHash("sha256").update(msg).digest();
  const hashedAsBytes = Array.from(hash).join(", ");

  // Sign the message
  const signer = crypto.createSign("SHA256");
  signer.update(msg);
  const signature = signer.sign(privateKeyPem);

  // Convert the signature to a BigInt
  const sigUint = BigInt("0x" + signature.toString("hex"));

  // Extract the modulus from the public key
  const publicKey = crypto.createPublicKey(publicKeyPem);
  const keyDetails = publicKey.export({ format: "jwk" }) as any;
  const modulus = BigInt(
    "0x" + Buffer.from(keyDetails.n, "base64url").toString("hex"),
  );

  // Generate the required parameters
  const modulusLimbs = splitIntoBitLimbs(modulus, 2048);
  const redcLimbs = splitIntoBitLimbs(
    computeBarrettReductionParameter(modulus, 2048),
    2048,
  );

  if (asToml) {
    const sigLimbs = splitIntoBitLimbs(sigUint, 2048);

    console.log(`hash = [${hashedAsBytes}]`);
    console.log(
      `modulus_limbs = [${formatLimbsAsTomlValue(modulusLimbs).join(", ")}]`,
    );
    console.log(
      `redc_limbs = [${formatLimbsAsTomlValue(redcLimbs).join(", ")}]`,
    );
    console.log(
      `signature_limbs = [${formatLimbsAsTomlValue(sigLimbs).join(", ")}]`,
    );
  } else {
    const sigStr = bnLimbs(sigUint, 2048);

    console.log(`let hash: [u8; 32] = [${hashedAsBytes}];`);
    console.log(
      `let params: BigNumParams<18, 2048> = BigNumParams::new(\n\tfalse,\n\t[${formatLimbsAsHex(
        modulusLimbs,
      )}],\n\t[${formatLimbsAsHex(redcLimbs)}]\n);`,
    );
    console.log(
      `let signature: RuntimeBigNum<18, 2048> = RuntimeBigNum::from_array(\n\tparams,\n\tlimbs: ${sigStr}\n);`,
    );
  }
}

/**
 * Generate 1024-bit signature parameters
 */
function generate1024BitSignatureParameters(
  msg: string,
  asToml: boolean,
): void {
  // Read the keys from files
  const privateKeyPem = fs.readFileSync(
    path.resolve("./private_key.pem"),
    "utf8",
  );
  const publicKeyPem = fs.readFileSync(
    path.resolve("./public_key.pem"),
    "utf8",
  );

  // Create a hash of the message
  const hash = crypto.createHash("sha256").update(msg).digest();
  const hashedAsBytes = Array.from(hash).join(", ");

  // Sign the message
  const signer = crypto.createSign("SHA256");
  signer.update(msg);
  const signature = signer.sign(privateKeyPem);

  // Convert the signature to a BigInt
  const sigUint = BigInt("0x" + signature.toString("hex"));

  // Extract the modulus from the public key
  const publicKey = crypto.createPublicKey(publicKeyPem);
  const keyDetails = publicKey.export({ format: "jwk" }) as any;
  const modulus = BigInt(
    "0x" + Buffer.from(keyDetails.n, "base64url").toString("hex"),
  );

  // Generate the required parameters
  const modulusLimbs = splitIntoBitLimbs(modulus, 1024);
  const redcLimbs = splitIntoBitLimbs(
    computeBarrettReductionParameter(modulus, 1024),
    1024,
  );

  if (asToml) {
    const sigLimbs = splitIntoBitLimbs(sigUint, 1024);

    console.log(`hash = [${hashedAsBytes}]`);
    console.log(
      `modulus_limbs = [${formatLimbsAsTomlValue(modulusLimbs).join(", ")}]`,
    );
    console.log(
      `redc_limbs = [${formatLimbsAsTomlValue(redcLimbs).join(", ")}]`,
    );
    console.log(
      `signature_limbs = [${formatLimbsAsTomlValue(sigLimbs).join(", ")}]`,
    );
  } else {
    const sigStr = bnLimbs(sigUint, 1024);

    console.log(
      `let params: BigNumParams<9, 1024> = BigNumParams::new(\n\tfalse,\n\t[${formatLimbsAsHex(
        modulusLimbs,
      )}],\n\t[${formatLimbsAsHex(redcLimbs)}]\n);`,
    );
    console.log(
      `let signature: RuntimeBigNum<9, 1024> = RuntimeBigNum::from_array(\n\tparams,\n\tlimbs: ${sigStr}\n);`,
    );
  }
}

/**
 * Main function to parse command line arguments and invoke the appropriate generator
 */
function main(): void {
  const args = process.argv.slice(2);
  let msg = "";
  let asToml = false;
  let exponent = 65537;
  let bits = 2048;

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "-m" || args[i] === "--msg") {
      msg = args[i + 1];
      i++;
    } else if (args[i] === "-t" || args[i] === "--toml") {
      asToml = true;
    } else if (args[i] === "-e" || args[i] === "--exponent") {
      exponent = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === "-b" || args[i] === "--bits") {
      bits = parseInt(args[i + 1]);
      i++;
    }
  }

  if (!msg) {
    console.error("Error: Message is required. Use -m or --msg to specify it.");
    process.exit(1);
  }

  if (bits !== 1024 && bits !== 2048) {
    console.error(
      "Error: Number of bits of RSA signature can only be 1024 or 2048",
    );
    process.exit(1);
  }

  if (bits === 1024) {
    generate1024BitSignatureParameters(msg, asToml);
  } else {
    generate2048BitSignatureParameters(msg, asToml);
  }
}

// Execute main if this file is run directly
if (require.main === module) {
  main();
}

// Export functions for testing
export {
  splitIntoBitLimbs,
  computeBarrettReductionParameter,
  formatLimbsAsHex,
  formatLimbsAsTomlValue,
  bnLimbs,
  generate1024BitSignatureParameters,
  generate2048BitSignatureParameters,
};
