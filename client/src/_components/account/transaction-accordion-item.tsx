import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/_components/ui/accordion";
import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import type { Transaction, TransactionStatus, TransactionType } from "@/_types";
import {
  getAssetAddress,
  getAssetAmount,
  getTransactionVerb,
} from "@/lib/formatting/transactions";
import { formatUnits } from "ethers/utils";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Loader2,
  Lock,
  Send,
  Unlock,
} from "lucide-react";
import {
  defaultNetwork,
  defaultNetworkAssetByAddress,
} from "shared/constants/token";

interface TransactionAccordionItemProps {
  transaction: Transaction;
}

// Get icon and color for each transaction type
function getTransactionIcon(type: TransactionType) {
  switch (type) {
    case "Deposit":
      return { icon: Lock };
    case "Deposit-Pending":
      return { icon: Clock };
    case "Withdraw":
      return { icon: Unlock };
    case "Transfer":
      return { icon: Send };
    case "PrivateTransfer":
      return { icon: ArrowUpRight };
    case "Approval":
      return { icon: CheckCircle };
    default:
      return { icon: ArrowDownLeft };
  }
}

// Get badge variant based on transaction type
function getBadgeVariant(
  type: TransactionType,
): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "Deposit":
    case "Deposit-Pending":
      return "default";
    case "Withdraw":
      return "default";
    case "Transfer":
    case "PrivateTransfer":
      return "default";
    case "Approval":
      return "default";
    default:
      return "default";
  }
}

// Get status badge element
function getStatusBadge(status: TransactionStatus | undefined) {
  switch (status) {
    case "pending":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30"
        >
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Pending
        </Badge>
      );
    case "confirmed":
      return (
        <Badge
          variant="outline"
          className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30"
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Confirmed
        </Badge>
      );
    case "failed":
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    case "replaced":
      return (
        <Badge variant="secondary">
          <ArrowUpRight className="h-3 w-3 mr-1" />
          Replaced
        </Badge>
      );
    default:
      // Backward compatibility: no status means confirmed (old transactions)
      return null;
  }
}

// Get recipient display string
function getRecipientDisplay(tx: Transaction): string | null {
  if (!tx.recipient) return null;

  if (tx.recipient.nickname) {
    return tx.recipient.nickname;
  }

  if (tx.recipient.evmAddress) {
    return `${tx.recipient.evmAddress.slice(0, 6)}...${tx.recipient.evmAddress.slice(-4)}`;
  }

  if (tx.recipient.privateAddress) {
    return `${tx.recipient.privateAddress.slice(0, 10)}...`;
  }

  return null;
}

export const TransactionAccordionItem = ({
  transaction: tx,
}: TransactionAccordionItemProps) => {
  // Use enhanced asset details if available, otherwise fall back to legacy parsing
  const hasEnhancedAsset = tx.asset && tx.asset.symbol;
  const legacyAsset = defaultNetworkAssetByAddress[getAssetAddress(tx)];

  const assetSymbol = hasEnhancedAsset
    ? tx.asset!.symbol
    : (legacyAsset?.symbol ?? "ETH");

  const assetDecimals = hasEnhancedAsset
    ? tx.asset!.decimals
    : (legacyAsset?.decimals ?? 18);

  // Get amount to display
  const displayAmount = hasEnhancedAsset
    ? tx.asset!.formattedAmount
    : tx.value
      ? (parseFloat(tx.value) / 1e18).toFixed(4)
      : legacyAsset
        ? formatUnits(getAssetAmount(tx), legacyAsset.decimals)
        : null;

  const etherscanUrl = tx.transactionHash
    ? `https://${defaultNetwork !== 1 ? "sepolia." : ""}etherscan.io/tx/${tx.transactionHash}`
    : null;

  const hasEthValue = tx.value && Number(tx.value) > 0;
  const hasAssetValue =
    (tx.type === "Deposit" || tx.type === "Deposit-Pending") &&
    !tx.value &&
    legacyAsset;

  const { icon: Icon } = getTransactionIcon(tx.type);
  const badgeVariant = getBadgeVariant(tx.type);
  const recipientDisplay = getRecipientDisplay(tx);

  // Render type-specific details in expanded view
  const renderTypeSpecificDetails = () => {
    // Show enhanced details if available
    if (hasEnhancedAsset) {
      return (
        <>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Amount</p>
            <p className="text-sm font-medium">
              {tx.asset!.formattedAmount} {tx.asset!.symbol}
            </p>
          </div>

          {tx.type === "Transfer" && recipientDisplay && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Recipient</p>
              <p className="text-sm">{recipientDisplay}</p>
            </div>
          )}

          {tx.type === "Withdraw" && tx.recipient?.evmAddress && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Withdrawn To</p>
              <p className="font-mono text-xs break-all">
                {tx.recipient.evmAddress}
              </p>
            </div>
          )}
        </>
      );
    }

    // Legacy details rendering
    switch (tx.type) {
      case "Deposit":
      case "Deposit-Pending":
        return (
          <>
            {hasAssetValue && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Amount Encrypted
                </p>
                <p className="text-sm font-medium">
                  {formatUnits(getAssetAmount(tx), assetDecimals)} {assetSymbol}
                </p>
              </div>
            )}
          </>
        );

      case "Withdraw":
        return (
          <>
            {hasEthValue && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Amount Withdrawn
                </p>
                <p className="text-sm font-medium">
                  {(parseFloat(tx.value!) / 1e18).toFixed(6)} ETH
                </p>
              </div>
            )}
          </>
        );

      case "Transfer":
      case "PrivateTransfer":
        return (
          <>
            {hasAssetValue && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Amount Transferred
                </p>
                <p className="text-sm font-medium">
                  {formatUnits(getAssetAmount(tx), assetDecimals)} {assetSymbol}
                </p>
              </div>
            )}
          </>
        );

      case "Approval":
        return <div />;

      default:
        return null;
    }
  };

  return (
    <AccordionItem value={tx.id}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full pr-2">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <Badge variant={badgeVariant}>{getTransactionVerb(tx.type)}</Badge>
            <span className="font-semibold">{assetSymbol}</span>
            {tx.status === "pending" && (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-3">
            {displayAmount && (
              <span className="text-sm font-medium">
                {displayAmount} {assetSymbol}
              </span>
            )}
            {/* Legacy display for old transactions without enhanced asset */}
            {!displayAmount && hasEthValue && (
              <span className="text-sm font-medium">
                {(parseFloat(tx.value!) / 1e18).toFixed(4)} ETH
              </span>
            )}
            {!displayAmount && hasAssetValue && (
              <span className="text-sm font-medium">
                {formatUnits(getAssetAmount(tx), assetDecimals)} {assetSymbol}
              </span>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3 pt-2">
          {/* Status badge */}
          {tx.status && (
            <div className="flex items-center gap-2">
              {getStatusBadge(tx.status)}
            </div>
          )}

          {/* Transaction hash (may be missing for pending transactions) */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Transaction Hash
            </p>
            {tx.transactionHash ? (
              <p className="font-mono text-xs break-all">
                {tx.transactionHash}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Awaiting submission...
              </p>
            )}
          </div>

          {/* Timestamps */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">Date & Time</p>
            <p className="text-sm">
              {new Date(tx.createdAt || tx.timestamp).toLocaleString()}
            </p>
          </div>

          {tx.confirmedAt && tx.confirmedAt !== tx.createdAt && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Confirmed At</p>
              <p className="text-sm">
                {new Date(tx.confirmedAt).toLocaleString()}
              </p>
            </div>
          )}

          {/* Type-specific details */}
          {renderTypeSpecificDetails()}

          {/* Error message for failed transactions */}
          {tx.status === "failed" && tx.errorMessage && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3">
              <p className="text-xs text-destructive font-medium mb-1">Error</p>
              <p className="text-sm text-destructive">{tx.errorMessage}</p>
            </div>
          )}

          {/* Gas used (for confirmed transactions) */}
          {tx.gasUsed && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Gas Used</p>
              <p className="text-sm font-mono">{tx.gasUsed}</p>
            </div>
          )}

          {/* Etherscan link (only if we have a hash) */}
          {etherscanUrl && (
            <div className="pt-2">
              <Button variant="outline" size="sm" asChild>
                <a
                  href={etherscanUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on Etherscan →
                </a>
              </Button>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
