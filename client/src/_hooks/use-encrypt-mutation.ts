import { useAuth } from "@/_providers/auth-provider";
import { addNote, addTransaction, updateTransaction } from "@/lib/db";
import { SUPPORTED_NETWORKS } from "@/_constants/networks";
import { useMutation } from "@tanstack/react-query";
import { poseidon2Hash } from "@zkpassport/poseidon2";
import { ethers } from "ethers";
import { Deposit } from "shared/classes/Deposit";
import { NoteEncryption } from "shared/classes/Note";
import { commbankDotEthAbi } from "shared/constants/abi/commbankdoteth";
import { erc20Abi } from "shared/constants/abi/erc20abi";
import { defaultNetwork, ETH_ADDRESS } from "shared/constants/token";
import { getRandomInPoseidonField } from "shared/constants/zk";
import { useCanEncrypt } from "./use-can-encrypt";
import { useTransactionsByChainId } from "./use-transactions";

async function createDepositPayload(
  outputNote: {
    secret: string | bigint;
    owner: string | bigint;
    asset_id: string | bigint;
    asset_amount: string | bigint;
  },
  recipientSigner: ethers.Signer,
): Promise<string[]> {
  const encryptedNote = await NoteEncryption.createEncryptedNote(
    outputNote,
    recipientSigner,
  );

  return [encryptedNote, "0x", "0x"];
}

export const useEncryptMutation = ({
  onApprovalSuccess,
  onZkProofSuccess,
  onTxSuccess,
  onTxReceiptSuccess,
}: {
  onApprovalSuccess?: () => void;
  onZkProofSuccess?: () => void;
  onTxSuccess?: () => void;
  onTxReceiptSuccess?: () => void;
}) => {
  const { getMnemonic, privateAddress } = useAuth();

  const { refetch: refetchTransactions } =
    useTransactionsByChainId(defaultNetwork);

  const canEncrypt = useCanEncrypt();

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
      if (!canEncrypt) throw new Error("Not allowed to encrypt.");

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

      // Get current gas price from RPC
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice;

      // Initialize deposit circuit
      const deposit = new Deposit();
      await deposit.depositNoir.init();

      // Generate secret for note (within bounds)
      const secret = getRandomInPoseidonField();

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
            { gasPrice },
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
            { value: assetAmount, gasPrice },
          );
        } else {
          // Call deposit for ERC20 tokens
          depositTx = await commbankDotEthContract.deposit(
            assetId,
            assetAmount,
            proof.proof,
            publicInputsBytes32,
            depositPayload,
            { gasPrice },
          );
        }

        // set tx submitted success before getting receipt
        if (onTxSuccess) {
          onTxSuccess();
        }

        const txSubmittedAt = Date.now();

        await addTransaction({
          id: depositTx.hash,
          chainId,
          transactionHash: depositTx.hash,
          type: "Deposit-Pending",
          to: chain.CommBankDotEth,
          data: depositTx.data,
          value: isNativeDeposit ? assetAmount.toString() : undefined,
          timestamp: txSubmittedAt,
        });
        await refetchTransactions();

        // Wait for deposit transaction to be mined
        const depositReceipt = await depositTx.wait();

        if (onTxReceiptSuccess) {
          onTxReceiptSuccess();
        }

        // Log deposit transaction to IndexedDB
        if (depositReceipt) {
          try {
            await updateTransaction({
              id: depositReceipt.hash,
              chainId,
              transactionHash: depositReceipt.hash,
              type: "Deposit",
              to: chain.CommBankDotEth,
              data: depositTx.data,
              value: isNativeDeposit ? assetAmount.toString() : undefined,
              timestamp: txSubmittedAt,
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
          // TODO make this real
          // if (onConfirmationSuccess) {
          //   onConfirmationSuccess();
          // }
        }

        return {
          txHash: depositTx.hash,
          proof,
        };
      } catch (err) {
        console.log("Error Encrypting:", err);
        throw err;
      }
    },
  });

  return mutationFn;
};
