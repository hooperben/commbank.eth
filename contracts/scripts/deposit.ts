import { InputMap } from "@noir-lang/noir_js";
import { keccak256 } from "ethers";
import { ethers } from "hardhat";
import { convertFromHexToArray } from "../helpers/formatter";
import { getNoir } from "../helpers/get-noir";
import RSA, { getPayload } from "../helpers/rsa";
import { numberToUint8Array } from "../helpers/testing-api";
import {
  CommBankDotEth,
  CommBankDotEth__factory,
  ERC20__factory,
} from "../typechain-types";
import { aliceSecret } from "./secrets";

const rsa = RSA();

const getRSA = async (secret: string) => {
  const keypair = await rsa.create_key_pair(secret, 2048, 65537);

  return keypair;
};

async function main() {
  const [Alice] = await ethers.getSigners();

  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const usdcContract = new ethers.Contract(USDC, ERC20__factory.abi, Alice);

  const usdcBalance = await usdcContract.balanceOf(Alice.address);
  console.log("usdc balance: ", ethers.formatUnits(usdcBalance, 6));

  const CommBankDotEth = "0x31219c05c3556BA1dD301F5e62312A240dfE532B";

  const aliceRSA = await getRSA(process.env.DEMO_MNEMONIC_ALICE!);

  const commbankDotEth = new ethers.Contract(
    CommBankDotEth,
    CommBankDotEth__factory.abi,
    Alice,
  ) as unknown as CommBankDotEth;

  // approval
  const depositAmount = 5n;
  // const tokenAmount = ethers.parseUnits(amount.toString(), 6);
  // const approval = await usdcContract.approve(CommBankDotEth, tokenAmount);
  // await approval.wait(2);
  // console.log(approval);
  const amount = numberToUint8Array(depositAmount);
  const assetId = convertFromHexToArray(USDC);

  const noteSecret = aliceSecret;

  const alicePubKey = convertFromHexToArray(
    keccak256(keccak256(aliceRSA.private_key)),
  );

  const noteHash = keccak256(
    Uint8Array.from([...alicePubKey, ...amount, ...assetId, ...noteSecret]),
  );

  const input = {
    note_secret: Array.from(noteSecret).map((item) => item.toString()),
    hash: Array.from(convertFromHexToArray(noteHash)).map((item) =>
      item.toString(),
    ),
    amount: depositAmount.toString(),
    amount_array: Array.from(amount).map((item) => item.toString()),
    pub_key: Array.from(alicePubKey).map((item) => item.toString()),
    asset_id: Array.from(assetId).map((item) => item.toString()),
  };

  const { noir, backend } = await getNoir(
    "../keccak-circuits/deposit/target/circuits.json",
  );

  const { witness } = await noir.execute(input as unknown as InputMap);
  const { proof, publicInputs } = await backend.generateProof(witness, {
    keccak: true,
  });

  console.log("proof: ", proof);
  console.log("publicInputs: ", publicInputs);

  const payload = getPayload(noteSecret, assetId, amount);
  const encryptedMessage = rsa.encrypt(payload, aliceRSA.public_key);

  const tx = await commbankDotEth.deposit(
    USDC,
    depositAmount,
    proof.slice(4),
    publicInputs,
    encryptedMessage.data,
  );

  console.log("deposit tx: ", tx);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
