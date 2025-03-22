import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import {
  splitIntoBitLimbs,
  computeBarrettReductionParameter,
  formatLimbsAsHex,
  formatLimbsAsTomlValue,
  bnLimbs,
  generate2048BitSignatureParameters,
} from "./rsa";
import { expect } from "chai";

// Generate test keys if they don't exist
function ensureTestKeysExist() {
  if (
    !fs.existsSync("./private_key.pem") ||
    !fs.existsSync("./public_key.pem")
  ) {
    console.log("Generating test RSA keys...");
    // Generate 2048-bit RSA key pair for testing
    execSync("openssl genrsa -out private_key.pem 2048");
    execSync("openssl rsa -in private_key.pem -pubout -out public_key.pem");
  }
}

describe("RSA Signature Generator", () => {
  before(() => {
    ensureTestKeysExist();
  });

  it("Split BigInt into limbs", () => {
    const num = 123456789n;
    const limbs = splitIntoBitLimbs(num, 64, 32);

    // Expected: [123456789n, 0n] since 123456789 fits in first 32-bit limb
    expect(limbs.length).to.equal(2);
    expect(limbs[0]).to.equal(123456789n);
    expect(limbs[1]).to.equal(0n);
  });

  it("Format limbs as hex", () => {
    const limbs = [15n, 16n, 255n];
    const hex = formatLimbsAsHex(limbs);

    expect(hex).to.equal("0xf, 0x10, 0xff");
  });

  it("Format limbs as TOML", () => {
    const limbs = [15n, 16n, 255n];
    const toml = formatLimbsAsTomlValue(limbs);

    expect(toml).to.deep.equal(['"0xf"', '"0x10"', '"0xff"']);
  });

  it("Signature generation and verification", () => {
    // Read the keys from files
    const privateKeyPem = fs.readFileSync("./private_key.pem", "utf8");
    const publicKeyPem = fs.readFileSync("./public_key.pem", "utf8");

    const message = "test message";

    // Sign the message
    const signer = crypto.createSign("SHA256");
    signer.update(message);
    const signature = signer.sign(privateKeyPem);

    // Verify the signature
    const verifier = crypto.createVerify("SHA256");
    verifier.update(message);
    const isValid = verifier.verify(publicKeyPem, signature);

    expect(isValid).to.equal(true);
  });

  it("Barrett reduction parameter computation", () => {
    const modulus = 65537n;
    const bitSize = 17; // Just above 65537
    const barrett = computeBarrettReductionParameter(modulus, bitSize);

    // Expected: floor(2^(2*17) / 65537)
    const expected = (1n << 34n) / 65537n;
    expect(barrett).to.equal(expected);
  });

  it("bn_limbs formatting", () => {
    const num = 257n; // 0x101
    const result = bnLimbs(num, 16);

    // Expected: num in hex format with limbs
    expect(result).to.equal("[0x101]");
  });

  it("generates 2048-bit signature parameters", () => {
    const message = "heyyyy";

    console.log(
      "2048-bit RSA signature parameters for message: '" + message + "'",
    );
    console.log("=".repeat(80));

    // Log the output in standard format
    console.log("\nStandard format:");
    generate2048BitSignatureParameters(message, false);

    // Log the output in TOML format
    console.log("\nTOML format:");
    generate2048BitSignatureParameters(message, true);

    // No assertions needed as this is just to display the output
    expect(true).to.equal(true);
  });
});
