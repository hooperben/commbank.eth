import RSA, { SignatureGenModule } from "../helpers/rsa";
import { KeyPair } from "../web/signature_gen";

describe("Note creation and flow testing", () => {
  let rsa: typeof SignatureGenModule;

  before(() => {
    rsa = RSA();
  });

  it.only("should let me create a key pair", async () => {
    const aliceRSA = rsa.create_key_pair("alice", 2048, 65537);
    console.log(aliceRSA.private_key);
    console.log(aliceRSA.private_key);

    // Convert to JSON string
    const jsonKeyPair = JSON.stringify(aliceRSA);

    console.log("Serialized key pair:", jsonKeyPair);

    const restoredKeyPair = new rsa.KeyPair(
      aliceRSA.private_key,
      aliceRSA.public_key,
    );

    // You can then use the restored key pair for signatures
    const signature = rsa.generate_signature_from_key(
      "test message",
      restoredKeyPair.private_key,
    );

    console.log(signature);
  });
});
