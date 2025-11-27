import { SUPPORTED_NETWORKS } from "@/lib/networks";
import { useMutation } from "@tanstack/react-query";
import { Deposit } from "shared/classes/Deposit";
import { PoseidonMerkleTree } from "shared/classes/PoseidonMerkleTree";
import { NoteEncryption } from "shared/classes/Note";
import { poseidon2Hash } from "@zkpassport/poseidon2";
import { ethers } from "ethers";
import { useAuth } from "@/lib/auth-context";

interface EncryptedNote {
  encryptedSecret: string;
  owner: string;
  asset_id: string;
  asset_amount: string;
}

async function encodeEncryptedPayload(
  encryptedNotes: (EncryptedNote | "0x")[],
): Promise<string[]> {
  const payload: string[] = [];

  for (const note of encryptedNotes) {
    if (note === "0x" || !note) {
      payload.push("0x");
    } else {
      const encodedNote = ethers.AbiCoder.defaultAbiCoder().encode(
        ["string", "string", "string", "string"],
        [note.encryptedSecret, note.owner, note.asset_id, note.asset_amount],
      );
      payload.push(encodedNote);
    }
  }

  return payload;
}

async function createDepositPayload(
  outputNote: {
    secret: string | bigint;
    owner: string;
    asset_id: string;
    asset_amount: string;
  },
  recipientSigner: ethers.Signer,
): Promise<string[]> {
  const encryptedNote = await NoteEncryption.createEncryptedNote(
    outputNote,
    recipientSigner,
  );

  return await encodeEncryptedPayload([encryptedNote, "0x", "0x"]);
}

export const useEncryptMutation = () => {
  const { getMnemonic, privateAddress } = useAuth();

  const mutationFn = useMutation({
    mutationFn: async ({
      assetId,
      chainId,
      amount,
      decimals = 6,
    }: {
      assetId: string;
      chainId: number;
      amount: number;
      decimals?: number;
    }) => {
      const chain = SUPPORTED_NETWORKS[chainId];
      if (!chain) throw new Error("Misconfigured");

      // Get wallet from auth (getMnemonic is from useAuth hook)
      const mnemonic = await getMnemonic();
      if (!mnemonic) throw new Error("Not authenticated");
      const wallet = ethers.Wallet.fromPhrase(mnemonic);

      // Connect to provider
      const provider = new ethers.JsonRpcProvider(chain.rpc);
      const signer = wallet.connect(provider);

      // Fetch and load tree data
      const treeResponse = await fetch("/full-tree.json");
      if (!treeResponse.ok) {
        throw new Error("Failed to fetch tree data");
      }
      const treeJson = await treeResponse.text();
      const tree = await PoseidonMerkleTree.fromJSON(treeJson);

      // Initialize deposit circuit
      const deposit = new Deposit();
      await deposit.depositNoir.init();

      // Generate secret for note (within bounds)
      const secret =
        BigInt(ethers.hexlify(ethers.randomBytes(32))) %
        BigInt(
          "0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001",
        );

      // Convert amount to proper units (with decimals)
      const assetAmount = ethers.parseUnits(amount.toString(), decimals);

      if (!privateAddress) throw new Error("Missing auth");

      // Generate deposit proof
      const noteHash = poseidon2Hash([
        BigInt(assetId),
        BigInt(assetAmount),
        BigInt(privateAddress),
        secret,
      ]);

      const noteHashN = BigInt(noteHash.toString());

      const { witness } = await deposit.depositNoir.execute({
        hash: noteHashN.toString(),
        asset_id: BigInt(assetId).toString(),
        asset_amount: assetAmount.toString(),
        owner: privateAddress,
        secret: secret.toString(),
      });

      const proof = await deposit.depositBackend.generateProof(witness, {
        keccakZK: true,
      });

      // Create encrypted payload
      const depositPayload = await createDepositPayload(
        {
          secret: secret.toString(),
          owner: privateAddress,
          asset_id: assetId,
          asset_amount: assetAmount.toString(),
        },
        signer,
      );

      // Approve ERC20 token (only if needed)
      const erc20Abi = [
        {
          constant: true,
          inputs: [
            { name: "_owner", type: "address" },
            { name: "_spender", type: "address" },
          ],
          name: "allowance",
          outputs: [{ name: "", type: "uint256" }],
          payable: false,
          stateMutability: "view",
          type: "function",
        },
        {
          constant: false,
          inputs: [
            { name: "_spender", type: "address" },
            { name: "_value", type: "uint256" },
          ],
          name: "approve",
          outputs: [{ name: "", type: "bool" }],
          payable: false,
          stateMutability: "nonpayable",
          type: "function",
        },
      ];

      const erc20 = new ethers.Contract(assetId, erc20Abi, signer);

      // Check current allowance
      const currentAllowance = await erc20.allowance(
        await signer.getAddress(),
        chain.CommBankDotEth,
      );

      // Only approve if current allowance is less than needed
      if (currentAllowance < assetAmount) {
        console.log("approving");
        const approveTx = await erc20.approve(
          chain.CommBankDotEth,
          assetAmount,
        );
        await approveTx.wait();
      }

      // Call deposit on contract
      const commbankAbi = [
        {
          inputs: [
            { name: "_erc20", type: "address" },
            { name: "_amount", type: "uint64" },
            { name: "_proof", type: "bytes" },
            { name: "_publicInputs", type: "bytes32[]" },
            { name: "_payload", type: "bytes[]" },
          ],
          name: "deposit",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ];

      const commbankDotEthContract = new ethers.Contract(
        chain.CommBankDotEth,
        commbankAbi,
        signer,
      );

      // Convert publicInputs to bytes32[]
      const publicInputsBytes32 = proof.publicInputs.map((input: string) => {
        // Ensure it's a bytes32 (pad if needed)
        return ethers.zeroPadValue(ethers.getBytes(input), 32);
      });

      const depositTx = await commbankDotEthContract.deposit(
        assetId,
        assetAmount,
        proof.proof,
        publicInputsBytes32,
        depositPayload,
      );

      console.log(depositTx);

      return {
        txHash: depositTx.hash,
        proof,
        tree,
      };
    },
  });

  return mutationFn;
};
