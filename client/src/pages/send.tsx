import { BalanceRow, PrivateBalanceRow } from "@/_components/account/balance";
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
import { Separator } from "@/_components/ui/separator";
import { useContacts } from "@/_hooks/use-contacts";
import { useERC20Balance } from "@/_hooks/use-erc20-balance";
import { useMerkleTree } from "@/_hooks/use-merkle-tree";
import { usePrivateTransfer } from "@/_hooks/use-private-transfer";
import { useUserAssetNotes } from "@/_hooks/use-user-asset-notes";
import PageContainer from "@/_providers/page-container";
import { ethers, parseUnits } from "ethers";
import { ArrowLeft, ArrowUpRight, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  defaultNetwork,
  mainnetAssets,
  sepoliaAssets,
  type SupportedAsset,
} from "shared/constants/token";

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

type TransferType = "public" | "private" | null;
type Step = "select-type" | "enter-details" | "confirm";

const assets: SupportedAsset[] =
  defaultNetwork === 1 ? mainnetAssets : sepoliaAssets;

export default function SendPage() {
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
      setStep("select-type");
      setTransferType(null);
      setSelectedContactId("");
      setAmount("");
      setTransferStatus("");
    }
  };

  // Form state
  const [step, setStep] = useState<Step>("select-type");
  const [transferType, setTransferType] = useState<TransferType>(null);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [transferStatus, setTransferStatus] = useState<string>("");

  const { data: contacts } = useContacts();
  const { data: publicBalance } = useERC20Balance(selectedAsset);
  const { data: assetNotes } = useUserAssetNotes(selectedAsset?.address);
  const { tree } = useMerkleTree();
  const { data: sendingNotes } = useUserAssetNotes(selectedAsset?.address);
  const { refetch: refetchUserAssets } = useUserAssetNotes(
    selectedAsset?.address,
  );

  // Calculate private balance
  const privateBalance = assetNotes
    ? assetNotes.reduce((acc, curr) => {
        return acc + BigInt(curr.assetAmount);
      }, 0n)
    : 0n;

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

  // When the user selects public or private transfer
  const handleSelectType = (type: TransferType) => {
    setTransferType(type);
    setStep("enter-details");
  };

  // When the user goes back a step
  const handleBack = () => {
    if (step === "enter-details") {
      setTransferType(null);
      setStep("select-type");
    } else if (step === "confirm") {
      setStep("enter-details");
    }
  };

  // Max balance for current transfer type
  const maxBalance =
    transferType === "public"
      ? publicBalance
        ? parseFloat(
            ethers.formatUnits(publicBalance, selectedAsset?.decimals || 6),
          )
        : 0
      : parseFloat(
          ethers.formatUnits(privateBalance, selectedAsset?.decimals || 6),
        );

  // Validation
  const amountNum = parseFloat(amount);
  const hasAmountError = amount && amountNum > maxBalance;
  const hasValidationError =
    !selectedContactId || !amount || parseFloat(amount) <= 0 || hasAmountError;

  const getAmountError = () => {
    if (!amount) return "";
    if (parseFloat(amount) <= 0) return "Please enter a valid amount";
    if (hasAmountError) {
      return `Amount exceeds available balance (${maxBalance.toFixed(2)} ${selectedAsset?.symbol})`;
    }
    return "";
  };

  const handleNext = () => {
    if (hasValidationError) return;
    setStep("confirm");
  };

  const privateTransferMutation = usePrivateTransfer({
    onProofSuccess: () => {
      setTransferStatus("(2/4) Submitting Transaction");
    },
    onTxSuccess: () => {
      setTransferStatus("(3/4) Submitted, Awaiting Confirmation");
    },
    onReceiptSuccess: async () => {
      await refetchUserAssets();
      setTransferStatus("(4/4) Transfer complete");
    },
  });

  const handleConfirm = async () => {
    const contact = contacts?.find((c) => c.id === selectedContactId);
    const transaction = {
      type: transferType,
      asset: selectedAsset?.symbol,
      amount: parseUnits(amount.toString(), selectedAsset.decimals),
      recipient: contact,
      timestamp: new Date().toISOString(),
    };

    console.log("Transaction to send:", transaction);

    if (
      transferType === "private" &&
      tree &&
      sendingNotes &&
      selectedAsset &&
      contact
    ) {
      setTransferStatus("(1/4) Generating proof");
      privateTransferMutation.mutate({
        amount: transaction.amount,
        asset: selectedAsset,
        recipient: contact,
        sendingNotes,
        tree,
      });
    }
  };

  // Filter contacts based on transfer type
  const availableContacts = contacts?.filter((contact) => {
    if (transferType === "public") {
      return !!contact.evmAddress;
    } else if (transferType === "private") {
      return !!contact.privateAddress;
    }
    return false;
  });

  const selectedContact = contacts?.find((c) => c.id === selectedContactId);

  const formatAddress = (address?: string) => {
    if (!address) return "—";
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <PageContainer
      title="commbank.eth | Send"
      description="Send assets privately or publicly"
    >
      <div className="container max-w-full space-y-6 text-left">
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
              Send{" "}
              {transferType &&
                transferType.charAt(0).toUpperCase() +
                  transferType.slice(1)}{" "}
              {selectedAsset?.symbol}
            </CardTitle>
            <CardDescription>
              {!transferType &&
                "Send assets to a contact publicly or privately"}
              {transferType && transferType == "private"
                ? "Send assets privately to one of your contacts"
                : "Send assets publicly to one of your contacts"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Asset Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Asset</label>
              <Select
                value={selectedAsset.address}
                onValueChange={handleAssetChange}
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

            {/* Step 1: Select Transfer Type */}
            {step === "select-type" && (
              <div className="grid grid-cols-2 gap-3 w-full">
                <Button
                  variant="outline"
                  className="h-16 text-lg font-semibold flex-col gap-1"
                  onClick={() => handleSelectType("public")}
                >
                  <ArrowUpRight className="h-5 w-5" />
                  <span className="text-sm">Public Transfer</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-16 text-lg font-semibold flex-col gap-1"
                  onClick={() => handleSelectType("private")}
                >
                  <ArrowUpRight className="h-5 w-5" />
                  <span className="text-sm">Private Transfer</span>
                </Button>
              </div>
            )}

            {/* Step 2: Enter Details */}
            {step === "enter-details" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Contact</label>
                  <Select
                    value={selectedContactId}
                    onValueChange={setSelectedContactId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a contact">
                        {selectedContact && (
                          <span className="font-medium">
                            {selectedContact.nickname || "No Contact Name"}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableContacts?.map((contact) => (
                        <SelectItem key={contact.id} value={contact.id}>
                          <div className="flex flex-col items-start gap-1 py-1">
                            <span className="font-medium">
                              {contact.nickname || "No Contact Name"}
                            </span>
                            {transferType === "public" ? (
                              <span className="text-xs text-muted-foreground font-mono">
                                {formatAddress(contact.evmAddress)}
                              </span>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs text-muted-foreground font-mono">
                                  Private:{" "}
                                  {formatAddress(contact.privateAddress)}
                                </span>
                                {contact.envelopeAddress && (
                                  <span className="text-xs text-muted-foreground font-mono">
                                    Signing:{" "}
                                    {formatAddress(contact.envelopeAddress)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    You can add new contacts on the{" "}
                    <Link
                      to="/contacts"
                      className="underline hover:text-foreground"
                    >
                      Contacts
                    </Link>{" "}
                    page.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Amount</label>
                    <span className="text-xs text-muted-foreground">
                      {transferType === "public" ? (
                        <BalanceRow
                          asset={selectedAsset}
                          description={` ${selectedAsset.symbol} available`}
                        />
                      ) : (
                        <PrivateBalanceRow
                          asset={selectedAsset}
                          description={` ${selectedAsset.symbol} available`}
                        />
                      )}
                    </span>
                  </div>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>

                {getAmountError() && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    {getAmountError()}
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="flex-1"
                    disabled={!!hasValidationError}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === "confirm" && selectedContact && (
              <div className="space-y-4">
                <div className="space-y-3 p-4 bg-muted rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Sending
                    </span>
                    <span className="text-sm font-medium">
                      {selectedAsset?.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Amount
                    </span>
                    <span className="text-sm font-medium">
                      {amount} {selectedAsset?.symbol}
                    </span>
                  </div>

                  <Separator className="w-full" />

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">To</span>
                    <span className="text-sm font-medium">
                      {selectedContact.nickname || "Anonymous"}
                    </span>
                  </div>
                  {transferType === "public" ? (
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">
                        Address
                      </span>
                      <span className="text-sm font-medium font-mono text-right break-all">
                        {formatAddress(selectedContact.evmAddress)}
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start">
                        <span className="text-sm text-muted-foreground">
                          Private Address
                        </span>
                        <span className="text-sm font-medium font-mono text-right break-all">
                          {formatAddress(selectedContact.privateAddress)}
                        </span>
                      </div>
                      {selectedContact.envelopeAddress && (
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-muted-foreground">
                            Signing Key
                          </span>
                          <span className="text-sm font-medium font-mono text-right break-all">
                            {formatAddress(selectedContact.envelopeAddress)}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {transferStatus && (
                  <div className="text-sm text-primary bg-primary/10 p-3 rounded-md flex items-center gap-2">
                    {privateTransferMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                    )}
                    {transferStatus}
                  </div>
                )}

                {privateTransferMutation.error && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md break-words overflow-hidden">
                    Error:{" "}
                    {getSimplifiedErrorMessage(privateTransferMutation.error)}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1"
                    disabled={privateTransferMutation.isPending}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className="flex-1"
                    disabled={
                      privateTransferMutation.isPending ||
                      privateTransferMutation.isSuccess
                    }
                  >
                    {!privateTransferMutation.isPending &&
                      !privateTransferMutation.isSuccess &&
                      "Confirm"}
                    {privateTransferMutation.isPending && "Submitting..."}
                    {!privateTransferMutation.isPending &&
                      privateTransferMutation.isSuccess &&
                      "Complete"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
