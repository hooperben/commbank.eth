import { Button } from "@/_components/ui/button";
import { Input } from "@/_components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/_components/ui/tabs";
import { useEncryptMutation } from "@/_hooks/use-encrypt";
import { useERC20Balance } from "@/_hooks/use-erc20-balance";
import { usePrivateBalance } from "@/_hooks/use-private-balance";
import { useUserAssetNotes } from "@/_hooks/use-user-asset-notes";
import { ethers } from "ethers";
import { useState } from "react";
import type { SupportedAsset } from "shared/constants/token";
import { Decrypt } from "./decrypt";
import { Encrypt } from "./encrpyt";
import type { EncryptionStep } from "./step";

interface InlineEncryptConfirmationProps {
  asset: SupportedAsset;
  onCancel: () => void;
  onSuccess: () => void;
}

export function InlineEncryptConfirmation({
  asset,
  onCancel,
  // onSuccess,
}: InlineEncryptConfirmationProps) {
  const [activeTab, setActiveTab] = useState<"encrypt" | "decrypt">("encrypt");
  const [amount, setAmount] = useState<string>("");
  const [decryptAmount, setDecryptAmount] = useState<string>("");

  const [encryptionStep, setEncryptionStep] = useState<EncryptionStep>();
  const [decryptionStep, setDecryptionStep] = useState<EncryptionStep>();
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

  // public balance data
  const { data: balanceData } = useERC20Balance(asset);
  const formattedBalance = balanceData
    ? parseFloat(ethers.formatUnits(balanceData, asset.decimals))
    : 0;

  // private balance data
  const { assetTotal: privateBalance } = usePrivateBalance(asset);
  const formattedPrivateBalance = privateBalance
    ? parseFloat(ethers.formatUnits(privateBalance, asset.decimals))
    : 0;

  const amountNum = parseFloat(amount) || 0;
  const hasError = amountNum > formattedBalance || amountNum <= 0;
  const errorMessage =
    amountNum <= 0
      ? "Amount must be greater than 0"
      : amountNum > formattedBalance
        ? `Insufficient balance. You have ${formattedBalance} ${asset.symbol}`
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

  // TODO: Implement decrypt mutation hook
  const handleDecrypt = async () => {
    if (decryptHasError) return;
    setDecryptionStep("review");

    // TODO: Implement actual decrypt logic
    console.log("Decrypt functionality to be implemented", {
      assetId: asset.address,
      chainId: asset.chainId,
      amount: decryptAmountNum,
      decimals: asset.decimals,
    });
  };

  const handleDecryptConfirm = async () => {
    if (decryptHasError) return;
    setDecryptionStep("approval");

    // TODO: Call decrypt mutation when implemented
    console.log("Decrypt confirm - to be implemented");
  };

  const decryptAmountNum = parseFloat(decryptAmount) || 0;
  const decryptHasError =
    decryptAmountNum > (privateBalance ?? 0n) || decryptAmountNum <= 0;
  const decryptErrorMessage =
    decryptAmountNum <= 0
      ? "Amount must be greater than 0"
      : decryptAmountNum > (privateBalance ?? 0n)
        ? `Insufficient private balance. You have ${privateBalance} ${asset.symbol}`
        : "";

  return (
    <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-4">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "encrypt" | "decrypt")}
      >
        <TabsList className="w-full">
          <TabsTrigger value="encrypt" className="flex-1">
            Encrypt
          </TabsTrigger>
          <TabsTrigger value="decrypt" className="flex-1">
            Decrypt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="encrypt" className="space-y-4">
          {!encryptionStep && (
            <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-4 text-left">
              <div className="space-y-2">
                <p className="text-md font-semibold">Encrypt {asset.symbol}</p>
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
                  Public Balance: {formattedBalance.toFixed(asset.roundTo)}{" "}
                  {asset.symbol}
                </p>
              </div>
            </div>
          )}

          {encryptionStep !== undefined &&
            amount !== "" &&
            !hasError &&
            amountNum > 0 && (
              <Encrypt
                asset={asset}
                formattedBalance={formattedBalance}
                formattedPrivateBalance={formattedPrivateBalance}
                amount={amountNum}
                encryptionStep={encryptionStep}
                error={error}
              />
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

          {/* TODO make this prettier */}
          {encryptionStep === "complete" && (
            <div className="text-xs text-green-500 bg-green-500/10 p-2 rounded">
              Funds encrypted! You can view all encrypted funds in your
              transaction history.
            </div>
          )}
        </TabsContent>

        <TabsContent value="decrypt" className="space-y-4">
          {!decryptionStep && (
            <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-4 text-left">
              <div className="space-y-2">
                <p className="text-md font-semibold">Decrypt {asset.symbol}</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="decrypt-amount" className="text-xs font-medium">
                  Amount
                </label>
                <Input
                  id="decrypt-amount"
                  type="number"
                  placeholder="0"
                  value={decryptAmount}
                  onChange={(e) => setDecryptAmount(e.target.value)}
                  className="text-sm"
                  aria-invalid={decryptAmount !== "" && decryptHasError}
                />
                {decryptAmount !== "" && decryptHasError && (
                  <p className="text-xs text-destructive">
                    {decryptErrorMessage}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Private Balance:{" "}
                  {formattedPrivateBalance.toFixed(asset.roundTo)}{" "}
                  {asset.symbol}
                </p>
              </div>
            </div>
          )}

          {decryptionStep !== undefined &&
            decryptAmount !== "" &&
            !decryptHasError &&
            decryptAmountNum > 0 && (
              <Decrypt
                asset={asset}
                formattedBalance={formattedBalance}
                formattedPrivateBalance={formattedPrivateBalance}
                decryptAmountNum={amountNum}
                decryptionStep={decryptionStep}
                error={error}
              />
            )}

          <div className="flex gap-2">
            <Button
              onClick={onCancel}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {decryptionStep === "complete" ? "Close" : "Cancel"}
            </Button>
            {!decryptionStep && (
              <Button
                onClick={handleDecrypt}
                size="sm"
                className="flex-1"
                disabled={decryptHasError || decryptAmount === ""}
              >
                Next
              </Button>
            )}
            {decryptionStep && (
              <Button
                onClick={handleDecryptConfirm}
                size="sm"
                className="flex-1"
                disabled={
                  decryptHasError ||
                  decryptAmount === "" ||
                  decryptionStep === "complete"
                }
              >
                Confirm
              </Button>
            )}
          </div>

          {/* TODO make this prettier */}
          {decryptionStep === "complete" && (
            <div className="text-xs text-green-500 bg-green-500/10 p-2 rounded">
              Funds decrypted! You can view your updated balance above.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
