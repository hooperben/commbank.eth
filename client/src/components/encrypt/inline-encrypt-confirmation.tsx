import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEncryptMutation } from "@/hooks/use-encrypt-mutation";
import { useERC20Balance } from "@/hooks/use-erc20-balance";
import { ethers } from "ethers";
import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import type { SupportedAsset } from "shared/constants/token";

interface InlineEncryptConfirmationProps {
  asset: SupportedAsset;
  onCancel: () => void;
  onSuccess: () => void;
}

export type EncryptionStep =
  | "approval"
  | "proof-generation"
  | "deposit"
  | "complete";

export function InlineEncryptConfirmation({
  asset,
  onCancel,
  onSuccess,
}: InlineEncryptConfirmationProps) {
  const [amount, setAmount] = useState<string>("");
  const { data: balanceData } = useERC20Balance(asset);

  const [encryptionStep, setEncryptionStep] = useState<EncryptionStep>();

  const {
    mutate: encrypt,
    isPending,
    error,
  } = useEncryptMutation({
    onApprovalSuccess: () => setEncryptionStep("proof-generation"),
    onZkProofSuccess: () => setEncryptionStep("deposit"),
    onTxSuccess: () => setEncryptionStep("complete"),
  });

  const balance = balanceData
    ? parseFloat(ethers.formatUnits(balanceData, asset.decimals))
    : 0;

  const amountNum = parseFloat(amount) || 0;
  const hasError = amountNum > balance || amountNum <= 0;
  const errorMessage =
    amountNum <= 0
      ? "Amount must be greater than 0"
      : amountNum > balance
        ? `Insufficient balance. You have ${balance} ${asset.symbol}`
        : "";

  const handleConfirm = async () => {
    if (hasError) return;
    setEncryptionStep("approval");

    encrypt(
      {
        assetId: asset.address,
        chainId: asset.chainId,
        amount: amountNum,
        decimals: asset.decimals,
      },
      {
        onSuccess: () => {
          onSuccess();
        },
        onError: (e) => {
          console.error(e);
          setEncryptionStep(undefined);
        },
      },
    );
  };

  const StepIndicator = ({
    label,
    step,
  }: {
    label: string;
    step: EncryptionStep;
  }) => {
    const isComplete = step === "complete";
    const isCurrent = encryptionStep === step && !isComplete;
    const hasError = error && isCurrent;

    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="w-4 min-w-[1rem]">
          {hasError ? (
            <X className="h-4 w-4 text-red-500" />
          ) : isComplete ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : isCurrent ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          ) : null}
        </span>
        <span className={hasError ? "text-red-500" : ""}>{label}</span>
      </div>
    );
  };

  if (!encryptionStep) {
    return (
      <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-semibold">Confirm Encryption</p>
          <p className="text-xs text-muted-foreground">
            You're encrypting {asset.symbol}
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="amount" className="text-xs font-medium">
            Amount
          </label>
          <Input
            id="amount"
            type="number"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-sm"
            disabled={isPending}
            aria-invalid={amount !== "" && hasError}
          />
          {amount !== "" && hasError && (
            <p className="text-xs text-destructive">{errorMessage}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Available: {balance} {asset.symbol}
          </p>
        </div>

        {amount !== "" && !hasError && amountNum > 0 && (
          <div className="bg-background/50 p-3 rounded space-y-1 text-xs">
            <p className="font-medium">Once this transaction is complete:</p>
            <p className="text-muted-foreground">
              Public: {(balance - amountNum).toFixed(asset.roundTo ?? 2)}{" "}
              {asset.symbol}
            </p>
            <p className="text-muted-foreground">
              Private: {amountNum} {asset.symbol}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={onCancel}
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            size="sm"
            className="flex-1"
            disabled={hasError || amount === "" || isPending}
          >
            Confirm
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-semibold">Encryption Steps</p>
      </div>

      <div className="space-y-2">
        <StepIndicator
          label={`1. Token Approval Tx (if ERC20)`}
          step="approval"
        />
        <StepIndicator
          label="2. Generate Zero Knowledge proof of deposit details"
          step="proof-generation"
        />
        <StepIndicator
          label="3. Call deposit() on commbank.eth's PrivateUnstoppableMoney contract"
          step="deposit"
        />
      </div>

      {error && (
        <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded">
          Error: {error.message}
        </div>
      )}

      {encryptionStep === "complete" && (
        <div className="text-xs text-green-500 bg-green-500/10 p-2 rounded">
          Encryption complete!
        </div>
      )}
    </div>
  );
}
