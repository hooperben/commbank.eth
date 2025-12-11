import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useContacts } from "@/_hooks/use-contacts";
import { useERC20Balance } from "@/_hooks/use-erc20-balance";
import { useMerkleTree } from "@/_hooks/use-merkle-tree";
import { usePrivateTransfer } from "@/_hooks/use-private-transfer";
import { useUserAssetNotes } from "@/_hooks/use-user-asset-notes";
import { ethers } from "ethers";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { defaultNetwork, type SupportedAsset } from "shared/constants/token";
import { BalanceRow, PrivateBalanceRow } from "../token/balance";

type TransferType = "public" | "private" | null;
type Step = "select-type" | "enter-details" | "confirm";

export function SendModal({
  open,
  onOpenChange,
  asset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: SupportedAsset;
}) {
  const [step, setStep] = useState<Step>("select-type");
  const [transferType, setTransferType] = useState<TransferType>(null);
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  const { data: contacts } = useContacts();
  const { data: publicBalance } = useERC20Balance(asset);
  const { data: assetNotes } = useUserAssetNotes(asset?.address);

  // Calculate private balance
  const privateBalance = assetNotes
    ? assetNotes.reduce((acc, curr) => {
        return acc + BigInt(curr.assetAmount);
      }, 0n)
    : 0n;

  // Reset state when modal closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep("select-type");
      setTransferType(null);
      setSelectedContactId("");
      setAmount("");
    }
    onOpenChange(newOpen);
  };

  // when the user selects public or private transfer
  const handleSelectType = (type: TransferType) => {
    setTransferType(type);
    setStep("enter-details");
  };

  // when the user goes back a step
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
        ? parseFloat(ethers.formatUnits(publicBalance, asset?.decimals || 6))
        : 0
      : parseFloat(ethers.formatUnits(privateBalance, asset?.decimals || 6));

  // Validation of user input (balances as no contact input yet)
  const amountNum = parseFloat(amount);
  const hasAmountError = amount && amountNum > maxBalance;
  const hasValidationError =
    !selectedContactId || !amount || parseFloat(amount) <= 0 || hasAmountError;

  // Update error message based on amount
  const getAmountError = () => {
    if (!amount) return "";
    if (parseFloat(amount) <= 0) return "Please enter a valid amount";
    if (hasAmountError) {
      return `Amount exceeds available balance (${maxBalance.toFixed(2)} ${asset?.symbol})`;
    }
    return "";
  };

  const handleNext = () => {
    if (hasValidationError) return;
    setStep("confirm");
  };

  const { tree } = useMerkleTree();
  const { data: sendingNotes } = useUserAssetNotes(asset?.address);
  const [transferStatus, setTransferStatus] = useState<string>("");
  const { refetch: refetchUserAssets } = useUserAssetNotes(asset?.address);

  const privateTransferMutation = usePrivateTransfer({
    onProofSuccess: () => {
      setTransferStatus("(2/4) Submitting Transaction");
    },
    onTxSuccess: () => {
      setTransferStatus("(3/4) Submitted, Awaiting Confirmation");
    },
    onReceiptSuccess: () => {
      refetchUserAssets();
      setTransferStatus("(4/4) Transfer complete");
    },
  });

  const handleConfirm = async () => {
    const contact = contacts?.find((c) => c.id === selectedContactId);
    const transaction = {
      type: transferType,
      asset: asset?.symbol,
      amount,
      recipient: contact,
      timestamp: new Date().toISOString(),
    };

    console.log("Transaction to send:", transaction);

    if (
      transferType === "private" &&
      tree &&
      sendingNotes &&
      asset &&
      contact
    ) {
      setTransferStatus("(1/4) Generating proof");
      privateTransferMutation.mutate({
        amount,
        asset,
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Send{" "}
            {transferType &&
              transferType.charAt(0).toUpperCase() + transferType.slice(1)}{" "}
            {asset?.symbol}{" "}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Select Transfer Type */}
        {step === "select-type" && (
          <div className="space-y-3 py-6">
            <Button
              variant="outline"
              className="w-full h-16 text-lg font-semibold flex-col gap-1"
              onClick={() => handleSelectType("public")}
            >
              <ArrowUpRight className="h-5 w-5" />
              <span className="text-sm">Send Public Balance</span>
              {asset && <BalanceRow asset={asset} description=" available" />}
            </Button>
            <Button
              variant="outline"
              className="w-full h-16 text-lg font-semibold flex-col gap-1"
              onClick={() => handleSelectType("private")}
            >
              <ArrowUpRight className="h-5 w-5" />
              <span className="text-sm">Send Private Balance</span>
              {asset && (
                <PrivateBalanceRow asset={asset} description=" available" />
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Enter Details */}
        {step === "enter-details" && (
          <div className="space-y-3 py-6">
            <div className="flex items-center p-3 bg-muted rounded-md">
              <span className="text-sm font-medium capitalize">
                {defaultNetwork === 1 ? "Ethereum Mainnet" : "Ethereum Sepolia"}
              </span>
            </div>

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
                              Private: {formatAddress(contact.privateAddress)}
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
                  onClick={() => handleOpenChange(false)}
                >
                  Contacts page
                </Link>
                .
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Amount</label>
                <span className="text-xs text-muted-foreground">
                  {transferType === "public"
                    ? asset && (
                        <BalanceRow asset={asset} description=" available" />
                      )
                    : asset && (
                        <PrivateBalanceRow
                          asset={asset}
                          description=" available"
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
              <Button variant="outline" onClick={handleBack} className="flex-1">
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
          <div className="space-y-4 py-6">
            <div className="space-y-3 p-4 bg-muted rounded-lg">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <span className="text-sm font-medium capitalize">
                  {transferType} Transfer
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Asset</span>
                <span className="text-sm font-medium">{asset?.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="text-sm font-medium">
                  {amount} {asset?.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">To</span>
                <span className="text-sm font-medium">
                  {selectedContact.nickname || "Anonymous"}
                </span>
              </div>
              {transferType === "public" ? (
                <div className="flex justify-between items-start">
                  <span className="text-sm text-muted-foreground">Address</span>
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
              <div className="text-sm text-primary bg-primary/10 p-3 rounded-md">
                {transferStatus}
              </div>
            )}

            {privateTransferMutation.error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                Error: {privateTransferMutation.error.message}
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
                disabled={privateTransferMutation.isPending}
              >
                {privateTransferMutation.isPending
                  ? transferStatus.split(" ")[1] || "Processing..."
                  : "Confirm"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
