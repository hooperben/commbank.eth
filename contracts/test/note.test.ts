import RSA, { SignatureGenModule } from "../helpers/rsa";
import { KeyPair } from "../web/signature_gen";

import fs from "fs";

describe("Note creation and flow testing", () => {
  let rsa: typeof SignatureGenModule;

  before(() => {
    rsa = RSA();
  });

  it.only("should let me create a key pair", async () => {
    // const aliceRSA = rsa.create_key_pair("alice", 2048, 65537);

    // // Convert to JSON string
    // const jsonKeyPair = JSON.stringify({
    //   private_key: Array.from(aliceRSA.private_key).map((item) =>
    //     item.toString(),
    //   ),
    //   public_key: Array.from(aliceRSA.public_key).map((item) =>
    //     item.toString(),
    //   ),
    // });

    // fs.writeFileSync("./alice.json", jsonKeyPair);
    const content = await fs.readFileSync("./alice.json");

    // Parse the JSON content
    const parsedJson = JSON.parse(content.toString());

    // Convert string arrays back to Uint8Array
    const aliceRSAFormed = {
      private_key: new Uint8Array(parsedJson.private_key.map(Number)),
      public_key: new Uint8Array(parsedJson.public_key.map(Number)),
    };

    console.log(aliceRSAFormed);

    // const aliceRSA = new rsa.KeyPair(

    // )

    // console.log("Serialized key pair:", jsonKeyPair);

    const restoredKeyPair = new rsa.KeyPair(
      aliceRSAFormed.private_key,
      aliceRSAFormed.public_key,
    );

    console.log(restoredKeyPair);

    const messageToEncrypt = "hello! this is super secret";

    // You can then use the restored key pair for signatures
    const encryptedMessage = rsa.encrypt(
      messageToEncrypt,
      restoredKeyPair.public_key,
    );

    console.log(encryptedMessage);

    const decryptedMessage = rsa.decrypt(
      encryptedMessage,
      restoredKeyPair.private_key,
    );

    console.log(decryptedMessage);
  });
});
