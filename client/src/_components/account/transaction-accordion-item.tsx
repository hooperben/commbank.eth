import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/_components/ui/accordion";
import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import type { Transaction, TransactionType } from "@/_types";
import {
  getAssetAddress,
  getAssetAmount,
  getTransactionVerb,
} from "@/lib/formatting/transactions";
import { formatUnits } from "ethers/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
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

export const TransactionAccordionItem = ({
  transaction: tx,
}: TransactionAccordionItemProps) => {
  const asset = defaultNetworkAssetByAddress[getAssetAddress(tx)];
  const assetSymbol = asset?.symbol ?? "ETH";
  const etherscanUrl = `https://${defaultNetwork !== 1 ? "sepolia." : ""}etherscan.io/tx/${tx.transactionHash}`;

  const hasEthValue = tx.value && Number(tx.value) > 0;
  const hasAssetValue =
    (tx.type === "Deposit" || tx.type === "Deposit-Pending") &&
    !tx.value &&
    asset;

  const { icon: Icon } = getTransactionIcon(tx.type);
  const badgeVariant = getBadgeVariant(tx.type);

  // Render type-specific details in expanded view
  const renderTypeSpecificDetails = () => {
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
                  {formatUnits(getAssetAmount(tx), asset.decimals)}{" "}
                  {asset.symbol}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Contract</p>
              <p className="font-mono text-xs break-all">{tx.to}</p>
            </div>
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
            <div>
              <p className="text-xs text-muted-foreground mb-1">Withdrawn To</p>
              <p className="font-mono text-xs break-all">{tx.to}</p>
            </div>
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
                  {formatUnits(getAssetAmount(tx), asset.decimals)}{" "}
                  {asset.symbol}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Contract</p>
              <p className="font-mono text-xs break-all">{tx.to}</p>
            </div>
          </>
        );

      case "Approval":
        return (
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Approved Spender
            </p>
            <p className="font-mono text-xs break-all">{tx.to}</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AccordionItem value={tx.id}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full pr-2">
          <div className="flex items-center gap-2">
            <Icon className={`h-4 w-4`} />
            <Badge variant={badgeVariant}>{getTransactionVerb(tx.type)}</Badge>
            <span className="font-semibold">{assetSymbol}</span>
          </div>
          <div className="flex items-center gap-3">
            {hasEthValue && (
              <span className="text-sm font-medium">
                {(parseFloat(tx.value!) / 1e18).toFixed(4)} ETH
              </span>
            )}
            {hasAssetValue && (
              <span className="text-sm font-medium">
                {formatUnits(getAssetAmount(tx), asset.decimals)} {asset.symbol}
              </span>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-3 pt-2">
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              Transaction Hash
            </p>
            <p className="font-mono text-xs break-all">{tx.transactionHash}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Date & Time</p>
            <p className="text-sm">{new Date(tx.timestamp).toLocaleString()}</p>
          </div>

          {/* Type-specific details */}
          {renderTypeSpecificDetails()}

          <div className="pt-2">
            <Button variant="outline" size="sm" asChild>
              <a href={etherscanUrl} target="_blank" rel="noopener noreferrer">
                View on Etherscan →
              </a>
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};
