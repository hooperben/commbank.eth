import { InputMap } from "@noir-lang/noir_js";
import { keccak256 } from "ethers";
import { ethers } from "hardhat";
import { convertFromHexToArray } from "../helpers/formatter";
import { getNoir } from "../helpers/get-noir";
import { getEmptyTree } from "../helpers/merkle-tree";
import RSA, { getPayload } from "../helpers/rsa";
import { formatUint8Array, numberToUint8Array } from "../helpers/testing-api";
import { CommBankDotEth, CommBankDotEth__factory } from "../typechain-types";
import {
  aliceOutput1NoteSecret,
  aliceOutput2NoteSecret,
  aliceSecret,
} from "./secrets";

const rsa = RSA();

// in this script, ALICE will send BOB 2 USDC private
export const depositLeafHash =
  "0x8ddbc096f6b664b4112cd1f19f2be1dcf7df7bdc594eb1baeba384570b3dfe16";

async function main() {
  const [Alice] = await ethers.getSigners();

  const aliceRSA = rsa.create_key_pair(
    process.env.DEMO_MNEMONIC_ALICE!,
    2048,
    65537,
  );
  const bobRSA = rsa.create_key_pair(
    process.env.DEMO_MNEMONIC_BOB!,
    2048,
    65537,
  );
  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
  const CommBankDotEth = "0x31219c05c3556BA1dD301F5e62312A240dfE532B";

  const tree = getEmptyTree();

  tree.updateLeaf(0, depositLeafHash);

  const { noir: transactNoir, backend: transactBackend } = await getNoir(
    "../keccak-circuits/transact/target/transact.json",
  );

  const merklePath = tree.getProof(depositLeafHash).map((step) => {
    return {
      path: step.position === "right" ? 1 : 0,
      value: convertFromHexToArray(step.data.toString("hex")),
    };
  });

  const commbankDotEth = new ethers.Contract(
    CommBankDotEth,
    CommBankDotEth__factory.abi,
    Alice,
  ) as unknown as CommBankDotEth;

  const contractMerkle = await commbankDotEth.getLastRoot();

  const paths = merklePath.map((x) => x.path);
  const values = merklePath.map((x) => x.value);

  const alicePubKey = convertFromHexToArray(
    keccak256(keccak256(aliceRSA.private_key)),
  );
  const depositAmount = 5n;
  const amount = numberToUint8Array(depositAmount);
  const assetId = convertFromHexToArray(USDC);

  const inputNote = {
    owner: formatUint8Array(alicePubKey),
    owner_secret: formatUint8Array(
      convertFromHexToArray(keccak256(aliceRSA.private_key)),
    ),
    note_secret: formatUint8Array(aliceSecret),
    asset_id: formatUint8Array(assetId),
    amount_array: formatUint8Array(amount),
    amount: depositAmount.toString(),
    leaf_index: formatUint8Array(numberToUint8Array(0n)),
    path: paths,
    path_data: values.map((item) => formatUint8Array(item)),
  };

  const inputNoteNullifier = keccak256(
    Uint8Array.from([
      ...inputNote.leaf_index,
      ...inputNote.note_secret,
      ...inputNote.amount_array,
      ...inputNote.asset_id,
    ]),
  );

  const aliceOutputNote = {
    owner: formatUint8Array(alicePubKey),
    note_secret: formatUint8Array(aliceOutput1NoteSecret),
    asset_id: formatUint8Array(assetId),
    amount_array: formatUint8Array(numberToUint8Array(3n)),
    amount: 3,
  };

  const aliceOutputNoteHash = formatUint8Array(
    convertFromHexToArray(
      keccak256(
        Uint8Array.from([
          ...alicePubKey,
          ...aliceOutputNote.amount_array,
          ...assetId,
          ...aliceOutputNote.note_secret,
        ]),
      ),
    ),
  );

  const bobPubKey = convertFromHexToArray(
    keccak256(keccak256(bobRSA.private_key)),
  );

  const bobOutputNote = {
    owner: formatUint8Array(bobPubKey),
    note_secret: formatUint8Array(aliceOutput2NoteSecret),
    asset_id: formatUint8Array(assetId),
    amount_array: formatUint8Array(numberToUint8Array(2n)),
    amount: 2,
  };

  const bobOutputNoteHash = formatUint8Array(
    convertFromHexToArray(
      keccak256(
        Uint8Array.from([
          ...bobPubKey,
          ...bobOutputNote.amount_array,
          ...assetId,
          ...bobOutputNote.note_secret,
        ]),
      ),
    ),
  );

  const emptyNullifier = formatUint8Array(numberToUint8Array(0n));
  const emptyNote = {
    owner: formatUint8Array(new Uint8Array(32)),
    owner_secret: formatUint8Array(new Uint8Array(32)),
    note_secret: formatUint8Array(new Uint8Array(32)),
    asset_id: formatUint8Array(new Uint8Array(20)),
    amount_array: formatUint8Array(new Uint8Array(32)),
    amount: 0,
    leaf_index: formatUint8Array(numberToUint8Array(0n)),
    path: paths,
    path_data: values.map((value) => formatUint8Array(value)),
  };

  console.log("contract merkle: ", contractMerkle);
  console.log("local merkle root: ", tree.getRoot().toString("hex"));

  const transactInput = {
    root: formatUint8Array(
      convertFromHexToArray("0x" + tree.getRoot().toString("hex")),
    ),
    input_notes: [inputNote, emptyNote],
    output_notes: [aliceOutputNote, bobOutputNote],
    nullifiers: [
      formatUint8Array(convertFromHexToArray(inputNoteNullifier)),
      emptyNullifier,
    ],
    output_hashes: [aliceOutputNoteHash, bobOutputNoteHash],
  };

  const { witness: transactWitness } = await transactNoir.execute(
    transactInput as unknown as InputMap,
  );

  const { proof: transactProof, publicInputs: transactPublicInputs } =
    await transactBackend.generateProof(transactWitness, {
      keccak: true,
    });

  console.log("proof: ", transactProof);
  console.log("publicInputs: ", transactPublicInputs);

  const transactPayloads = [
    rsa.encrypt(
      getPayload(new Uint8Array(aliceOutputNote.note_secret), assetId, amount),
      aliceRSA.public_key,
    ).data,
    rsa.encrypt(
      getPayload(new Uint8Array(bobOutputNote.note_secret), assetId, amount),
      bobRSA.public_key,
    ).data,
  ];

  const transactTx = await commbankDotEth.transfer(
    transactProof.slice(4),
    transactPublicInputs,
    transactPayloads,
  );

  console.log("transact tx: ", transactTx);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
