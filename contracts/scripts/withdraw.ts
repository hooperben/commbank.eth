import { InputMap } from "@noir-lang/noir_js";
import { keccak256 } from "ethers";
import { ethers } from "hardhat";
import { convertFromHexToArray } from "../helpers/formatter";
import { getNoir } from "../helpers/get-noir";
import { getEmptyTree } from "../helpers/merkle-tree";
import RSA from "../helpers/rsa";
import { formatUint8Array, numberToUint8Array } from "../helpers/testing-api";
import {
  CommBankDotEth,
  CommBankDotEth__factory,
  ERC20__factory,
} from "../typechain-types";
import { aliceOutput2NoteSecret } from "./secrets";

const rsa = RSA();

async function main() {
  const [Alice] = await ethers.getSigners();

  const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

  const CommBankDotEth = "0x31219c05c3556BA1dD301F5e62312A240dfE532B";

  const bobRSA = rsa.create_key_pair(
    process.env.DEMO_MNEMONIC_BOB!,
    2048,
    65537,
  );

  const commbankDotEth = new ethers.Contract(
    CommBankDotEth,
    CommBankDotEth__factory.abi,
    Alice,
  ) as unknown as CommBankDotEth;

  const { noir: withdrawNoir, backend: withdrawBackend } = await getNoir(
    "../keccak-circuits/withdraw/target/withdraw.json",
  );

  // previous tree history:
  const depositLeafHash =
    "0x8ddbc096f6b664b4112cd1f19f2be1dcf7df7bdc594eb1baeba384570b3dfe16";
  const aliceNoteChangeNote =
    "0xa940c0a67ae782c42fab3fa32b89e6297509bd3561150d15a8824be44c32cf68";
  const bobFundsNote =
    "0x3660c1269e7cb1e2de530abe335aee3465ce8b1d7eaa71db2bc143fda5b1be90";

  const tree = getEmptyTree();
  tree.updateLeaf(0, depositLeafHash);
  tree.updateLeaf(1, aliceNoteChangeNote);
  tree.updateLeaf(2, bobFundsNote);

  const bobMerklePath = tree.getProof(bobFundsNote).map((step) => {
    return {
      path: step.position === "right" ? 1 : 0,
      value: convertFromHexToArray(step.data.toString("hex")),
    };
  });

  console.log("bobMerklePath: ", bobMerklePath);

  const bobPaths = bobMerklePath.map((x) => x.path);
  const bobValues = bobMerklePath.map((x) => x.value);

  const emptyNullifier = formatUint8Array(numberToUint8Array(0n));
  const emptyNote = {
    owner: formatUint8Array(new Uint8Array(32)),
    owner_secret: formatUint8Array(new Uint8Array(32)),
    note_secret: formatUint8Array(new Uint8Array(32)),
    asset_id: formatUint8Array(new Uint8Array(20)),
    amount_array: formatUint8Array(new Uint8Array(32)),
    amount: 0,
    leaf_index: formatUint8Array(numberToUint8Array(0n)),
    path: bobPaths,
    path_data: bobValues.map((value) => formatUint8Array(value)),
  };

  const bobPubKey = convertFromHexToArray(
    keccak256(keccak256(bobRSA.private_key)),
  );

  const assetId = convertFromHexToArray(USDC);

  const bobInputNote = {
    owner: formatUint8Array(bobPubKey),
    owner_secret: formatUint8Array(
      convertFromHexToArray(keccak256(bobRSA.private_key)),
    ),
    note_secret: formatUint8Array(aliceOutput2NoteSecret),
    asset_id: formatUint8Array(assetId),
    amount_array: formatUint8Array(numberToUint8Array(2n)),
    amount: 2,
    leaf_index: formatUint8Array(numberToUint8Array(2n)),
    path: bobPaths,
    path_data: bobValues.map((item) => formatUint8Array(item)),
  };

  const bobInputNoteNullifier = keccak256(
    Uint8Array.from([
      ...bobInputNote.leaf_index,
      ...bobInputNote.note_secret,
      ...bobInputNote.amount_array,
      ...bobInputNote.asset_id,
    ]),
  );

  const withdrawInput = {
    root: formatUint8Array(
      convertFromHexToArray("0x" + tree.getRoot().toString("hex")),
    ),
    input_notes: [bobInputNote, emptyNote],
    nullifiers: [
      formatUint8Array(convertFromHexToArray(bobInputNoteNullifier)),
      emptyNullifier,
    ],
    exit_assets: [bobInputNote.asset_id, emptyNote.asset_id],
    exit_amounts: [2, 0],
  };

  const { witness: withdrawWitness } = await withdrawNoir.execute(
    withdrawInput as unknown as InputMap,
  );

  const { proof: withdrawProof, publicInputs: withdrawPublicInputs } =
    await withdrawBackend.generateProof(withdrawWitness, {
      keccak: true,
    });

  console.log("proof: ", withdrawProof);
  console.log("publicInputs: ", withdrawPublicInputs);

  const bobEVM = ethers.Wallet.fromPhrase(process.env.DEMO_MNEMONIC_BOB!);

  const tx = await commbankDotEth.withdraw(
    withdrawProof.slice(4),
    withdrawPublicInputs,
    bobEVM.address,
  );

  console.log("WITHDRAW: ", tx);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
