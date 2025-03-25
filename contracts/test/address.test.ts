import { ethers } from "hardhat";
import { convertFromHexToArray } from "../helpers/formatter";
import { keccak256 } from "ethers";
import RSA, { SignatureGenModule } from "../helpers/rsa";

describe("Testing address derivation", () => {
  let rsa: typeof SignatureGenModule;

  before(async () => {
    rsa = RSA();
  });

  it.only("should create the correct details for a given mnemonic", async () => {
    const mnemonic = process.env.MNEMONIC;
    console.log(mnemonic);

    const wallet = ethers.Wallet.fromPhrase(mnemonic!);

    console.log(wallet);

    console.log("expected: ", "0x800A6FC6cfCd48A0330d352B7e3aA777750eaC3e");
    console.log("created: ", wallet.address);

    const rsaAccount = rsa.create_key_pair(wallet.privateKey, 2048, 65537);

    const publicKey = convertFromHexToArray(
      keccak256(keccak256(rsaAccount.private_key)),
    );

    console.log(rsaAccount.public_key);

    console.log(publicKey);

    console.log([
      63, 204, 130, 143, 184, 109, 163, 90, 225, 159, 197, 244, 173, 116, 11,
      170, 236, 64, 77, 226, 121, 244, 180, 211, 190, 53, 35, 78, 111, 112, 249,
      158,
    ]);
  });
});
