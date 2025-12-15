import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import { useEncryptMutation } from "@/_hooks/use-encrypt";
import { useERC20Balance } from "@/_hooks/use-erc20-balance";
import { useUserAssetNotes } from "@/_hooks/use-user-asset-notes";
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
  | "review"
  | "approval"
  | "proof-generation"
  | "deposit"
  | "complete";

export function InlineEncryptConfirmation({
  asset,
  onCancel,
  // onSuccess,
}: InlineEncryptConfirmationProps) {
  const [amount, setAmount] = useState<string>("");
  const { data: balanceData } = useERC20Balance(asset);

  const [encryptionStep, setEncryptionStep] = useState<EncryptionStep>();
  const { refetch: retchUserAssetNotes } = useUserAssetNotes(asset.address);

  const onTxSuccess = () => {
    retchUserAssetNotes();
    setEncryptionStep("complete");
  };

  const {
    mutate: encrypt,
    isPending,
    error,
  } = useEncryptMutation({
    onApprovalSuccess: () => setEncryptionStep("proof-generation"),
    onZkProofSuccess: () => setEncryptionStep("deposit"),
    onTxSuccess: onTxSuccess,
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

  const handleNext = () => {
    setEncryptionStep("review");
  };

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
          // onSuccess();
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
      <div className="flex gap-2 text-sm">
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

  return (
    <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-4">
      {!encryptionStep && (
        <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-4 text-left">
          <div className="space-y-2">
            <p className="text-sm font-semibold">Encrypt {asset.symbol}</p>
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
        </div>
      )}

      {encryptionStep !== undefined &&
        amount !== "" &&
        !hasError &&
        amountNum > 0 && (
          <div className="bg-background/50 p-4 rounded">
            <div className="grid grid-cols-2 gap-8 relative">
              {/* Left column - Transaction summary */}
              <div className="space-y-2 text-left flex flex-col justify-center text-sm">
                <p className="font-medium text-center">
                  Once this transaction is complete:
                </p>
                <p className="text-muted-foreground text-center">
                  Public: {(balance - amountNum).toFixed(asset.roundTo ?? 2)}{" "}
                  {asset.symbol}
                </p>
                <p className="text-muted-foreground text-center">
                  Private: {amountNum} {asset.symbol}
                </p>
              </div>

              {/* Vertical divider */}
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -ml-4" />

              {/* Right column - Steps */}
              <div className="space-y-2 text-left text-xs">
                <StepIndicator
                  label={`1. Token Approval (if ERC20 token)`}
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
            </div>
          </div>
        )}

      <div className="flex gap-2">
        <Button
          onClick={onCancel}
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={isPending && encryptionStep !== "complete"}
        >
          {encryptionStep === "complete" ? "Close" : "Cancel"}
        </Button>
        {!encryptionStep && (
          <Button
            onClick={handleNext}
            size="sm"
            className="flex-1"
            disabled={hasError || amount === "" || isPending}
          >
            Next
          </Button>
        )}
        {encryptionStep && (
          <Button
            onClick={handleConfirm}
            size="sm"
            className="flex-1"
            disabled={
              hasError ||
              amount === "" ||
              isPending ||
              encryptionStep === "complete"
            }
          >
            Confirm
          </Button>
        )}
      </div>

      {error && (
        <div className="text-xs text-red-500 bg-red-500/10 p-2 rounded">
          Error: {error.message}
        </div>
      )}

      {encryptionStep === "complete" && (
        <div className="text-xs text-green-500 bg-green-500/10 p-2 rounded">
          Funds encrypted! You can view all encrypted funds in your transaction
          history.
        </div>
      )}
    </div>
  );
}
