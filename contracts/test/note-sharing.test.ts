import { NoteEncryption } from "@/helpers/note-sharing";
import { Wallet } from "ethers";
import { expect } from "chai";

describe("Testing Note Sharing functionality", () => {
  it("should let me encrypt and decrypt", async () => {
    const alicePK =
      "0x1234567890123456789012345678901234567890123456789012345678901234";
    // Create wallets (signers)
    const alice = new Wallet(alicePK);

    const bobPk =
      "0x9876543210987654321098765432109876543210987654321098765432109876";
    const bob = new Wallet(bobPk);

    // Create a note with secret
    const originalNote = {
      secret:
        "2389312107716289199307843900794656424062350252250388738019021107824217896920",
      owner: await alice.getAddress(),
      asset_id: "0x1234567890123456789012345678901234567890",
      asset_amount: "5",
    };

    // Alice encrypts a note for Bob
    const encryptedNote = await NoteEncryption.createEncryptedNote(
      originalNote,
      bob,
    );

    // Bob decrypts the note
    const decryptedNote = await NoteEncryption.decryptNote(encryptedNote, bob);

    // Verify the secret matches
    expect(originalNote.secret).equal(decryptedNote.secret);
  });
});
