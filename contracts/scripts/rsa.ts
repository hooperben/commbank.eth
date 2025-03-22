import * as crypto from "crypto";
import * as fs from "fs";
import * as commander from "commander";

// Function to read and parse private key
function loadPrivateKey(keyPath: string): string {
  try {
    return fs.readFileSync(keyPath, "utf8");
  } catch (error) {
    console.error(`Error reading private key file: ${error.message}`);
    process.exit(1);
  }
}

// Function to read and parse public key
function loadPublicKey(keyPath: string): string {
  try {
    return fs.readFileSync(keyPath, "utf8");
  } catch (error) {
    console.error(`Error reading public key file: ${error}`);
    process.exit(1);
  }
}

// Function to format limbs as hex strings
function formatLimbsAsHex(limbs: bigint[]): string {
  return limbs.map((a) => `0x${a.toString(16)}`).join(", ");
}

// Function to format limbs as TOML values
function formatLimbsAsTomlValue(limbs: bigint[]): string[] {
  return limbs.map((a) => `"0x${a.toString(16)}"`);
}

// Split a big integer into 120-bit limbs
function splitInto120BitLimbs(num: bigint, totalBits: number): bigint[] {
  const limbs: bigint[] = [];
  const limbSize = 120n;
  const mask = (1n << 120n) - 1n;
  let remaining = num;

  const limbCount = Math.ceil(totalBits / 120);

  for (let i = 0; i < limbCount; i++) {
    limbs.push(remaining & mask);
    remaining = remaining >> 120n;
  }

  return limbs;
}

// Compute Barrett reduction parameter
function computeBarrettReductionParameter(modulus: bigint): bigint {
  // Barrett reduction parameter is 2^(2*bitLength) / modulus
  const bitLength = modulus.toString(2).length;
  return (1n << BigInt(2 * bitLength)) / modulus;
}

// Format big integer as limbs string
function bnLimbs(num: bigint, totalBits: number): string {
  const limbs = splitInto120BitLimbs(num, totalBits);
  return `[${formatLimbsAsHex(limbs)}]`;
}

// Helper function to convert base64url to BigInt
function base64urlToBigInt(base64url: string): bigint {
  const buffer = Buffer.from(base64url, "base64url");
  let hex = "0x";
  for (const byte of buffer) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return BigInt(hex);
}

// Generate 2048-bit signature parameters
function generate2048BitSignatureParameters(
  msg: string,
  asToml: boolean,
  exponent: number,
  privateKeyPath?: string,
  publicKeyPath?: string,
): void {
  // Hash the message
  const hash = crypto.createHash("sha256").update(msg).digest();
  const hashedAsBytes = Array.from(hash).join(", ");

  let privateKey: string;
  let publicKey: string;

  // Use existing keys if provided, otherwise generate new keys
  if (privateKeyPath && publicKeyPath) {
    privateKey = loadPrivateKey(privateKeyPath);
    publicKey = loadPublicKey(publicKeyPath);
  } else {
    const keyPair = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicExponent: exponent,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    privateKey = keyPair.privateKey;
    publicKey = keyPair.publicKey;
  }

  // Sign the message
  const signer = crypto.createSign("SHA256");
  signer.update(msg);
  signer.end();
  const signature = signer.sign(privateKey);

  // Extract modulus from public key
  const publicKeyObj = crypto.createPublicKey(publicKey);
  const publicKeyData = publicKeyObj.export({ format: "jwk" }) as any;
  const modulus = base64urlToBigInt(publicKeyData.n);

  // Convert signature to BigInt
  const sigHex = "0x" + signature.toString("hex");
  const sigUint = BigInt(sigHex);

  // Generate limbs
  const modulusLimbs = splitInto120BitLimbs(modulus, 2048);
  const redcLimbs = splitInto120BitLimbs(
    computeBarrettReductionParameter(modulus),
    2048,
  );
  const sigStr = bnLimbs(sigUint, 2048);

  if (asToml) {
    const sigLimbs = splitInto120BitLimbs(sigUint, 2048);

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

// Generate 1024-bit signature parameters
function generate1024BitSignatureParameters(
  msg: string,
  asToml: boolean,
  exponent: number,
  privateKeyPath?: string,
  publicKeyPath?: string,
): void {
  // Hash the message
  const hash = crypto.createHash("sha256").update(msg).digest();
  const hashedAsBytes = Array.from(hash).join(", ");

  let privateKey: string;
  let publicKey: string;

  // Use existing keys if provided, otherwise generate new keys
  if (privateKeyPath && publicKeyPath) {
    privateKey = loadPrivateKey(privateKeyPath);
    publicKey = loadPublicKey(publicKeyPath);
  } else {
    const keyPair = crypto.generateKeyPairSync("rsa", {
      modulusLength: 1024,
      publicExponent: exponent,
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });
    privateKey = keyPair.privateKey;
    publicKey = keyPair.publicKey;
  }

  // Sign the message
  const signer = crypto.createSign("SHA256");
  signer.update(msg);
  signer.end();
  const signature = signer.sign(privateKey);

  // Extract modulus from public key
  const publicKeyObj = crypto.createPublicKey(publicKey);
  const publicKeyData = publicKeyObj.export({ format: "jwk" }) as any;
  const modulus = base64urlToBigInt(publicKeyData.n);

  // Convert signature to BigInt
  const sigHex = "0x" + signature.toString("hex");
  const sigUint = BigInt(sigHex);

  // Generate limbs
  const modulusLimbs = splitInto120BitLimbs(modulus, 1024);
  const redcLimbs = splitInto120BitLimbs(
    computeBarrettReductionParameter(modulus),
    1024,
  );
  const sigStr = bnLimbs(sigUint, 1024);

  if (asToml) {
    const sigLimbs = splitInto120BitLimbs(sigUint, 1024);

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

// Main function
function main() {
  const program = new commander.Command();

  program
    .option("-m, --msg <message>", "Message to sign", "heyyyyy")
    .option("-t, --toml", "Print output in TOML format")
    .option("-e, --exponent <number>", "Exponent to use for the key", "65537")
    .option(
      "-b, --bits <number>",
      "Number of bits of RSA signature (1024 or 2048)",
      "2048",
    )
    .option(
      "--private-key <path>",
      "Path to private key file (PEM format)",
      "./private_key.pem",
    )
    .option(
      "--public-key <path>",
      "Path to public key file (PEM format)",
      "./public_key.pem",
    )
    .parse(process.argv);

  const options = program.opts();
  const msg = options.msg;
  const asToml = options.toml || false;
  const e = parseInt(options.exponent, 10);
  const b = parseInt(options.bits, 10);
  const privateKeyPath = options.privateKey;
  const publicKeyPath = options.publicKey;

  // Validate key options
  if (
    (privateKeyPath && !publicKeyPath) ||
    (!privateKeyPath && publicKeyPath)
  ) {
    console.error(
      "Both --private-key and --public-key must be provided together",
    );
    process.exit(1);
  }

  if (b !== 1024 && b !== 2048) {
    console.error("Number of bits of RSA signature can only be 1024 or 2048");
    process.exit(1);
  }

  if (privateKeyPath && publicKeyPath) {
    // Make sure the key files exist
    if (!fs.existsSync(privateKeyPath)) {
      console.error(`Private key file not found: ${privateKeyPath}`);
      process.exit(1);
    }
    if (!fs.existsSync(publicKeyPath)) {
      console.error(`Public key file not found: ${publicKeyPath}`);
      process.exit(1);
    }
  }

  if (b === 1024) {
    generate1024BitSignatureParameters(
      msg,
      asToml,
      e,
      privateKeyPath,
      publicKeyPath,
    );
  } else {
    generate2048BitSignatureParameters(
      msg,
      asToml,
      e,
      privateKeyPath,
      publicKeyPath,
    );
  }
}

// Run the main function
main();
