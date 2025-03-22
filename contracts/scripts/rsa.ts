import * as crypto from "crypto";
import * as bigintCryptoUtils from "bigint-crypto-utils"; // You may need to install this

// Calculate Barrett reduction parameter: μ = ⌊2^(2k) / n⌋
function computeBarrettReductionParameter(n: bigint, bits: number): bigint {
  // 2^(2*bits)
  const divisor = 1n << BigInt(2 * bits);
  // Integer division
  return divisor / n;
}

// Split a big integer into limbs of 120 bits
function splitInto120BitLimbs(value: bigint, totalBits: number): bigint[] {
  const limbCount = Math.ceil(totalBits / 120);
  const limbs: bigint[] = [];
  const mask = (1n << 120n) - 1n;

  for (let i = 0; i < limbCount; i++) {
    const limb = (value >> BigInt(i * 120)) & mask;
    limbs.push(limb);
  }

  return limbs;
}

// Format limbs as hex strings
function formatLimbsAsHex(limbs: bigint[]): string {
  return limbs.map((limb) => `0x${limb.toString(16)}`).join(", ");
}

async function generateRsaTestCase(keySize: number = 2048) {
  // Generate RSA key pair
  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: keySize,
    publicExponent: 65537,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  // Message and hash
  const message = "Hello, this is a test message for Noir RSA verification";
  const hash = crypto.createHash("sha256").update(message).digest();

  // Sign the message
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(message);
  const signature = sign.sign(privateKey);

  // Extract the modulus
  const publicKeyObj = crypto.createPublicKey(publicKey);
  const keyData = publicKeyObj.export({ format: "jwk" });
  const modulusBase64 = keyData.n as string;
  const modulusBuffer = Buffer.from(modulusBase64, "base64url");
  const modulusBigInt = BigInt("0x" + modulusBuffer.toString("hex"));

  // Calculate Barrett reduction parameter
  const barrett = computeBarrettReductionParameter(modulusBigInt, keySize);

  // Calculate signature as bigint (convert from big-endian to little-endian)
  const sigBigInt = BigInt("0x" + signature.toString("hex"));

  // Split into limbs
  const limbCount = keySize === 1024 ? 9 : 18;
  const modulusLimbs = splitInto120BitLimbs(modulusBigInt, keySize);
  const barrettLimbs = splitInto120BitLimbs(barrett, keySize);
  const signatureLimbs = splitInto120BitLimbs(sigBigInt, keySize);

  // Format the test case
  const testId = Date.now().toString().slice(-5);

  return `
#[test]
fn test_verify_sha256_pkcs1v15_${keySize}_${testId}() {
    // Message: "${message}"
    let hash: [u8; 32] = [
        ${Array.from(hash).join(", ")}
    ];

    let params: BigNumParams<${limbCount}, ${keySize}> = BigNumParams::new(
        false,
        [${formatLimbsAsHex(modulusLimbs)}],
        [${formatLimbsAsHex(barrettLimbs)}]
    );

    let signature: RuntimeBigNum<${limbCount}, ${keySize}> = RuntimeBigNum {
        params,
        limbs: [${formatLimbsAsHex(signatureLimbs)}]
    };

    assert(noir_rsa::rsa::verify_sha256_pkcs1v15(hash, signature, 65537));
}`;
}

// Generate test cases
async function main() {
  console.log("// Generated RSA test cases");
  console.log(await generateRsaTestCase(2048));
  console.log(await generateRsaTestCase(1024));
}

main().catch(console.error);
