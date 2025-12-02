import { useAuth } from "@/lib/auth-context";
import { addNote, addTransaction } from "@/lib/db";
import { SUPPORTED_NETWORKS } from "@/lib/networks";
import { useMutation } from "@tanstack/react-query";
import { poseidon2Hash } from "@zkpassport/poseidon2";
import { ethers } from "ethers";
import { Deposit } from "shared/classes/Deposit";
import { NoteEncryption } from "shared/classes/Note";
import { commbankDotEthAbi } from "shared/constants/abi/commbankdoteth";
import { erc20Abi } from "shared/constants/abi/erc20abi";
import { defaultNetwork } from "shared/constants/token";
import { useTransactionsByChainId } from "./use-transactions";

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

export const useEncryptMutation = ({
  onApprovalSuccess,
  onZkProofSuccess,
  onTxSuccess,
}: {
  onApprovalSuccess?: () => void;
  onZkProofSuccess?: () => void;
  onTxSuccess?: () => void;
}) => {
  const { getMnemonic, privateAddress, address } = useAuth();

  const { refetch: refetchTransactions } =
    useTransactionsByChainId(defaultNetwork);

  // TODO make this programmatic
  const canEncrypt = ["0x6e400024D346e8874080438756027001896937E3"];
  const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

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
      if (!canEncrypt.includes(address!))
        throw new Error("Not allowed to encrypt.");

      const chain = SUPPORTED_NETWORKS[chainId];
      if (!chain) throw new Error("Misconfigured");

      // Check if this is a native ETH deposit
      const isNativeDeposit =
        assetId.toLowerCase() === ETH_ADDRESS.toLowerCase();

      // Get wallet from auth (getMnemonic is from useAuth hook)
      const mnemonic = await getMnemonic();
      if (!mnemonic) throw new Error("Not authenticated");
      const wallet = ethers.Wallet.fromPhrase(mnemonic);

      // Connect to provider
      const provider = new ethers.JsonRpcProvider(chain.rpc);
      const signer = wallet.connect(provider);

      // // Fetch and load tree data
      // const treeResponse = await fetch("/full-tree.json");
      // if (!treeResponse.ok) {
      //   throw new Error("Failed to fetch tree data");
      // }
      // const treeJson = await treeResponse.text();
      // const tree = await PoseidonMerkleTree.fromJSON(treeJson);

      // Initialize deposit circuit
      const deposit = new Deposit();
      await deposit.depositNoir.init();

      // Generate secret for note (within bounds)
      // TODO move to dedicated helper
      const secret =
        BigInt(ethers.hexlify(ethers.randomBytes(32))) %
        BigInt(
          "0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001",
        );

      // Convert amount to proper units (with decimals)
      const assetAmount = ethers.parseUnits(amount.toString(), decimals);

      if (!privateAddress) throw new Error("Missing auth");

      // Approve ERC20 token (only if needed and not native ETH)
      if (!isNativeDeposit) {
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
          const approvalReceipt = await approveTx.wait();

          // Log approval transaction to IndexedDB
          if (approvalReceipt) {
            try {
              await addTransaction({
                id: approvalReceipt.hash,
                chainId,
                transactionHash: approvalReceipt.hash,
                type: "Approval",
                to: assetId,
                data: approveTx.data,
                value: "0",
                timestamp: Date.now(),
              });
              await refetchTransactions();
            } catch (dbError) {
              console.error("Failed to log approval transaction:", dbError);
            }
          }
        }
        if (onApprovalSuccess) {
          onApprovalSuccess();
        }
      }

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

      if (onZkProofSuccess) {
        onZkProofSuccess();
      }

      const commbankDotEthContract = new ethers.Contract(
        chain.CommBankDotEth,
        commbankDotEthAbi,
        signer,
      );

      // Convert publicInputs to bytes32[]
      const publicInputsBytes32 = proof.publicInputs.map((input: string) => {
        // Ensure it's a bytes32 (pad if needed)
        return ethers.zeroPadValue(ethers.getBytes(input), 32);
      });

      try {
        let depositTx;

        if (isNativeDeposit) {
          // Call depositNative with ETH value
          depositTx = await commbankDotEthContract.depositNative(
            proof.proof,
            publicInputsBytes32,
            depositPayload,
            { value: assetAmount },
          );
        } else {
          // Call deposit for ERC20 tokens
          depositTx = await commbankDotEthContract.deposit(
            assetId,
            assetAmount,
            proof.proof,
            publicInputsBytes32,
            depositPayload,
          );
        }

        // Wait for deposit transaction to be mined
        const depositReceipt = await depositTx.wait();

        // Log deposit transaction to IndexedDB
        if (depositReceipt) {
          try {
            await addTransaction({
              id: depositReceipt.hash,
              chainId,
              transactionHash: depositReceipt.hash,
              type: "Deposit",
              to: chain.CommBankDotEth,
              data: depositTx.data,
              value: isNativeDeposit ? assetAmount.toString() : undefined,
              timestamp: Date.now(),
            });
            await refetchTransactions();

            await addNote({
              id: publicInputsBytes32[0],
              assetId,
              assetAmount: assetAmount.toString(),
              nullifier: publicInputsBytes32[0],
              secret: secret.toString(),
              entity_id: privateAddress, // TODO entity_id is a typo, should be privateAddress
              isUsed: false,
            });
          } catch (dbError) {
            console.error("Failed to log deposit transaction:", dbError);
          }
        }

        if (onTxSuccess) {
          onTxSuccess();
        }

        return {
          txHash: depositTx.hash,
          proof,
        };
      } catch (err) {
        console.log("EEERRR:", err);
        throw err;
      }
    },
  });

  return mutationFn;
};
