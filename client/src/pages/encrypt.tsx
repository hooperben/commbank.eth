import { Button } from "@/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/_components/ui/select";
import { Encrypt } from "@/_components/PUM/encrpyt";
import type { EncryptionStep } from "@/_components/PUM/step";
import { useEncryptMutation } from "@/_hooks/use-encrypt";
import { useERC20Balance } from "@/_hooks/use-erc20-balance";
import { usePrivateBalance } from "@/_hooks/use-private-balance";
import { useUserAssetNotes } from "@/_hooks/use-user-asset-notes";
import PageContainer from "@/_providers/page-container";
import { ethers } from "ethers";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

// Helper to extract a user-friendly error message
function getSimplifiedErrorMessage(error: Error): string {
  const message = error.message;

  // Common error patterns
  if (message.includes("user rejected") || message.includes("User rejected")) {
    return "Transaction was rejected by user";
  }
  if (message.includes("insufficient funds")) {
    return "Insufficient funds for transaction";
  }
  if (message.includes("CALL_EXCEPTION")) {
    return "Transaction failed - the contract call was reverted";
  }
  if (message.includes("network") || message.includes("Network")) {
    return "Network error - please check your connection";
  }
  if (message.includes("timeout")) {
    return "Request timed out - please try again";
  }

  // If the message is very long, truncate it
  if (message.length > 100) {
    // Try to extract just the error reason
    const reasonMatch = message.match(/reason[=:]\s*["']?([^"',}]+)/i);
    if (reasonMatch) {
      return reasonMatch[1].trim();
    }
    return message.substring(0, 100) + "...";
  }

  return message;
}
import {
  defaultNetwork,
  mainnetAssets,
  sepoliaAssets,
  type SupportedAsset,
} from "shared/constants/token";

const assets: SupportedAsset[] =
  defaultNetwork === 1 ? mainnetAssets : sepoliaAssets;

export default function EncryptPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Asset selection
  const assetParam = searchParams.get("asset");
  const initialAsset =
    assets.find((a) => a.address.toLowerCase() === assetParam?.toLowerCase()) ||
    assets[0];
  const [selectedAsset, setSelectedAsset] =
    useState<SupportedAsset>(initialAsset);

  // Update URL when asset changes
  const handleAssetChange = (address: string) => {
    const asset = assets.find(
      (a) => a.address.toLowerCase() === address.toLowerCase(),
    );
    if (asset) {
      setSelectedAsset(asset);
      setSearchParams({ asset: asset.address });
      // Reset form state when asset changes
      setAmount("");
      setEncryptionStep(undefined);
    }
  };

  // Form state
  const [amount, setAmount] = useState<string>("");
  const [encryptionStep, setEncryptionStep] = useState<EncryptionStep>();

  const { refetch: refetchUserAssetNotes } = useUserAssetNotes(
    selectedAsset.address,
  );

  const { refetch: refetchERC20Balance } = useERC20Balance(selectedAsset);

  const onTxSuccess = async () => {
    await refetchERC20Balance();
    await refetchUserAssetNotes();
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

  // Public balance data
  const { data: balanceData } = useERC20Balance(selectedAsset);
  const formattedBalance = balanceData
    ? parseFloat(ethers.formatUnits(balanceData, selectedAsset.decimals))
    : 0;

  // Private balance data
  const { assetTotal: privateBalance } = usePrivateBalance(selectedAsset);
  const formattedPrivateBalance = privateBalance
    ? parseFloat(ethers.formatUnits(privateBalance, selectedAsset.decimals))
    : 0;

  // Update selected asset from URL param on mount
  useEffect(() => {
    if (assetParam) {
      const asset = assets.find(
        (a) => a.address.toLowerCase() === assetParam.toLowerCase(),
      );
      if (asset) {
        setSelectedAsset(asset);
      }
    }
  }, [assetParam]);

  const amountNum = parseFloat(amount) || 0;
  const hasError = amountNum > formattedBalance || amountNum <= 0;
  const errorMessage =
    amountNum <= 0
      ? "Amount must be greater than 0"
      : amountNum > formattedBalance
        ? `Insufficient balance. You have ${formattedBalance} ${selectedAsset.symbol}`
        : "";

  const handleNext = () => {
    setEncryptionStep("review");
  };

  const handleConfirm = async () => {
    if (hasError) return;
    setEncryptionStep("approval");

    encrypt(
      {
        assetId: selectedAsset.address,
        chainId: selectedAsset.chainId,
        amount: amountNum,
        decimals: selectedAsset.decimals,
      },
      {
        onError: (e) => {
          console.error(e);
          setEncryptionStep(undefined);
        },
      },
    );
  };

  const handleReset = () => {
    setAmount("");
    setEncryptionStep(undefined);
  };

  return (
    <PageContainer
      title="commbank.eth | Encrypt"
      description="Encrypt your assets for private transactions"
    >
      <div className="container mx-auto p-6 max-w-6xl space-y-6 text-left">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link to="/account" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Account
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Encrypt {selectedAsset.symbol}
            </CardTitle>
            <CardDescription>
              Convert your public balance to private balance for anonymous
              transactions
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Asset Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Asset</label>
              <Select
                value={selectedAsset.address}
                onValueChange={handleAssetChange}
                disabled={isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <img
                        src={selectedAsset.logo}
                        alt={selectedAsset.symbol}
                        className={`h-5 w-5 ${selectedAsset.symbol === "AUDD" && "invert dark:invert-0"}`}
                      />
                      <span className="font-medium">
                        {selectedAsset.symbol}
                      </span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.address} value={asset.address}>
                      <div className="flex items-center gap-2">
                        <img
                          src={asset.logo}
                          alt={asset.symbol}
                          className={`h-5 w-5 ${asset.symbol === "AUDD" && "invert dark:invert-0"}`}
                        />
                        <span className="font-medium">{asset.symbol}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount Input (only show when not in progress) */}
            {!encryptionStep && (
              <div className="space-y-2">
                <label htmlFor="amount" className="text-sm font-medium">
                  Amount
                </label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isPending}
                  aria-invalid={amount !== "" && hasError}
                />
                {amount !== "" && hasError && (
                  <p className="text-sm text-destructive">{errorMessage}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Public Balance:{" "}
                  {formattedBalance.toFixed(selectedAsset.roundTo ?? 2)}{" "}
                  {selectedAsset.symbol}
                </p>
              </div>
            )}

            {/* Encryption Progress */}
            {encryptionStep !== undefined &&
              amount !== "" &&
              !hasError &&
              amountNum > 0 && (
                <Encrypt
                  asset={selectedAsset}
                  formattedBalance={formattedBalance}
                  formattedPrivateBalance={formattedPrivateBalance}
                  amount={amountNum}
                  encryptionStep={encryptionStep}
                  error={error}
                />
              )}

            {/* Error Display */}
            {error && (
              <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-md break-words overflow-hidden">
                Error: {getSimplifiedErrorMessage(error)}
              </div>
            )}

            {/* Success Message */}
            {encryptionStep === "complete" && (
              <div className="text-sm text-green-500 bg-green-500/10 p-3 rounded-md">
                Funds encrypted! You can view all encrypted funds in your
                transaction history.
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              {encryptionStep === "complete" ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    className="flex-1"
                  >
                    Encrypt More
                  </Button>
                  <Button asChild className="flex-1">
                    <Link to="/account">Back to Account</Link>
                  </Button>
                </>
              ) : !encryptionStep ? (
                <Button
                  onClick={handleNext}
                  className="flex-1"
                  disabled={hasError || amount === "" || isPending}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleConfirm}
                  className="flex-1"
                  disabled={hasError || amount === "" || isPending}
                >
                  {isPending ? "Processing..." : "Confirm"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
