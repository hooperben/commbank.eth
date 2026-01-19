import type { EncryptionStep } from "@/_components/PUM/step";
import { Alert, AlertDescription } from "@/_components/ui/alert";
import { Button } from "@/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/_components/ui/card";
import { CircularProgress } from "@/_components/ui/circular-progress";
import { Input } from "@/_components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/_components/ui/select";
import { useCanEncrypt } from "@/_hooks/use-can-encrypt";
import { useEncryptMutation } from "@/_hooks/use-encrypt";
import { useERC20Balance } from "@/_hooks/use-erc20-balance";
import { usePrivateBalance } from "@/_hooks/use-private-balance";
import { useUserAssetNotes } from "@/_hooks/use-user-asset-notes";
import PageContainer from "@/_providers/page-container";
import { ethers } from "ethers";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { DEFAULT_ASSETS, type SupportedAsset } from "shared/constants/token";

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

type Step = {
  id: number;
  name: string;
  description: string;
};

const encryptSteps: Step[] = [
  { id: 1, name: "Approving Token", description: "Approving ERC20 token" },
  {
    id: 2,
    name: "Generate ZK Proof",
    description: "Generating ZK",
  },
  {
    id: 3,
    name: "Calling Deposit",
    description: "Calling deposit on contract",
  },
];

export default function EncryptPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Asset selection
  const assetParam = searchParams.get("asset");
  const initialAsset =
    DEFAULT_ASSETS.find(
      (a) => a.address.toLowerCase() === assetParam?.toLowerCase(),
    ) || DEFAULT_ASSETS[0];
  const [selectedAsset, setSelectedAsset] =
    useState<SupportedAsset>(initialAsset);

  // Update URL when asset changes
  const handleAssetChange = (address: string) => {
    const asset = DEFAULT_ASSETS.find(
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

  const { canEncrypt, isLoading: isLoadingCanEncrypt } = useCanEncrypt();

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
      const asset = DEFAULT_ASSETS.find(
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

  // Map encryptionStep to current step index for progress
  const getCurrentStepIndex = (): number => {
    if (!encryptionStep) return 0;
    switch (encryptionStep) {
      case "approval":
        return 1;
      case "proof-generation":
        return 2;
      case "deposit":
        return 3;
      case "complete":
        return encryptSteps.length;
      default:
        return 0;
    }
  };

  const currentStepIndex = getCurrentStepIndex();
  const isProcessing =
    encryptionStep !== undefined &&
    encryptionStep !== "complete" &&
    encryptionStep !== "review";
  const isComplete = encryptionStep === "complete";

  return (
    <PageContainer
      title="commbank.eth | Encrypt"
      description="Encrypt your assets for private transactions"
    >
      <div className="container mx-auto max-w-6xl space-y-6 text-left">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={isComplete ? handleReset : undefined}
            asChild={!isComplete}
            className="flex items-center gap-2"
          >
            {isComplete ? (
              <>
                <ArrowLeft className="h-4 w-4" />
                Back
              </>
            ) : (
              <Link to="/account" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Account
              </Link>
            )}
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

          <CardContent className="space-y-4 md:space-y-6">
            {!isProcessing && !isComplete && (
              <>
                {/* Asset Selector */}
                <div className="space-y-1.5 md:space-y-2">
                  <label className="text-sm font-medium">Select Asset</label>
                  <Select
                    value={selectedAsset.address}
                    onValueChange={handleAssetChange}
                    disabled={isPending || isComplete}
                  >
                    <SelectTrigger className="bg-background/50">
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
                      {DEFAULT_ASSETS.map((asset) => (
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
                  <div className="space-y-1.5 md:space-y-2">
                    <label htmlFor="amount" className="text-sm font-medium">
                      Amount
                    </label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      disabled={isPending || isComplete}
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

                {/* Transaction Summary Card */}
                {encryptionStep === "review" && amountNum > 0 && (
                  <Card className="border-border/30 bg-muted/30">
                    <CardContent className="flex flex-col gap-3 p-4 md:grid md:grid-cols-2 md:gap-6 md:p-6">
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium text-muted-foreground">
                          Once this transaction is complete:
                        </p>
                        <div className="space-y-0.5">
                          <p className="text-sm">
                            <span className="text-muted-foreground">
                              Public:
                            </span>{" "}
                            <span className="font-medium">
                              {(formattedBalance - amountNum).toFixed(
                                selectedAsset.roundTo ?? 2,
                              )}{" "}
                              {selectedAsset.symbol}
                            </span>
                          </p>
                          <p className="text-sm">
                            <span className="text-muted-foreground">
                              Private:
                            </span>{" "}
                            <span className="font-medium">
                              {formattedPrivateBalance + amountNum}{" "}
                              {selectedAsset.symbol}
                            </span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Error Display */}
                {error && (
                  <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-md break-words overflow-hidden">
                    Error: {getSimplifiedErrorMessage(error)}
                  </div>
                )}

                {/* Success Message */}
                {isComplete && (
                  <div className="text-sm text-green-500 bg-green-500/10 p-3 rounded-md">
                    Funds encrypted! You can view all encrypted funds in your
                    transaction history.
                  </div>
                )}

                {/* Authorization Alert */}
                {!canEncrypt && !isLoadingCanEncrypt && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      You are currently not authorised to encrypt funds.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 md:pt-4">
                  {isComplete ? (
                    <Button
                      onClick={handleConfirm}
                      className="flex-1"
                      disabled={true}
                    >
                      Complete
                    </Button>
                  ) : !encryptionStep ? (
                    <Button
                      onClick={handleNext}
                      className="flex-1"
                      disabled={
                        hasError || amount === "" || isPending || !canEncrypt
                      }
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleConfirm}
                      className="flex-1"
                      disabled={
                        hasError || amount === "" || isPending || !canEncrypt
                      }
                    >
                      {isPending ? "Processing..." : "Confirm"}
                    </Button>
                  )}
                </div>
              </>
            )}

            {(isProcessing || isComplete) && (
              <div className="flex flex-col items-center justify-center py-12">
                <CircularProgress
                  progress={(currentStepIndex / encryptSteps.length) * 100}
                  isComplete={isComplete}
                  currentStep={
                    currentStepIndex > 0 &&
                    currentStepIndex <= encryptSteps.length
                      ? encryptSteps[currentStepIndex - 1].name
                      : ""
                  }
                />

                {currentStepIndex > 0 &&
                  currentStepIndex <= encryptSteps.length &&
                  !isComplete && (
                    <div className="mt-8 text-center">
                      <p className="text-sm font-medium">
                        Step {currentStepIndex} of {encryptSteps.length}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {encryptSteps[currentStepIndex - 1].description}
                      </p>
                    </div>
                  )}

                {isComplete && (
                  <>
                    <p className="mt-8 text-sm font-medium text-green-500">
                      Transaction Complete!
                    </p>
                    <Button
                      onClick={() => navigate("/account")}
                      variant="outline"
                      className="mt-4"
                    >
                      Back to Account Page
                    </Button>
                  </>
                )}

                {/* Error Display */}
                {error && (
                  <div className="mt-4 text-sm text-red-500 bg-red-500/10 p-3 rounded-md break-words overflow-hidden max-w-md">
                    Error: {getSimplifiedErrorMessage(error)}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
