import RSA, { SignatureGenModule } from "../helpers/rsa";
import { KeyPair } from "../web/signature_gen";

import { getTestingAPI } from "../helpers/testing-api";
import { InputMap, Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend } from "@aztec/bb.js";
import { Wallet, keccak256 } from "ethers";

describe("Note creation and flow testing", () => {
  let rsa: typeof SignatureGenModule;

  let backend: UltraHonkBackend;
  let noir: Noir;
  let circuit: Noir;
  let alice: Wallet;
  let bob: Wallet;
  let aliceRSA: KeyPair;
  let bobRSA: KeyPair;

  before(async () => {
    rsa = RSA();
    ({ circuit, noir, backend, alice, bob, aliceRSA, bobRSA } =
      await getTestingAPI());
  });

  it.only("should let me create a key pair", async () => {
    // Convert public key to hex string
    const publicKeyBytes = Array.from(Object.values(aliceRSA.public_key));
    const publicKeyHex =
      "0x" +
      publicKeyBytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");

    const note = {
      secret:
        "0xc0160463fbe2d99a4f7f9ffd93a0789132980899da181cc42021488404fa7c31",
      asset: "0xF0bAfD58E23726785A1681e1DEa0da15cB038C61",
      amount: "18446744073709551615", // Maximum value for u64 in Rust (2^64 - 1)
    };

    const encryptedMessage = rsa.encrypt(
      `${note.secret}${note.asset}${note.amount}`,
      aliceRSA.public_key,
    );
    console.log(encryptedMessage);

    const decryptedMessage = rsa.decrypt(
      encryptedMessage,
      aliceRSA.private_key,
    );

    console.log(decryptedMessage);
  });
});
