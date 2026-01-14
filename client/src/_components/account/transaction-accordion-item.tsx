import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/_components/ui/accordion";
import { Badge } from "@/_components/ui/badge";
import { Button } from "@/_components/ui/button";
import type { Transaction } from "@/_types";
import {
  getAssetAddress,
  getAssetAmount,
  getTransactionVerb,
} from "@/lib/formatting/transactions";
import { formatUnits } from "ethers/utils";
import {
  defaultNetwork,
  defaultNetworkAssetByAddress,
} from "shared/constants/token";

interface TransactionAccordionItemProps {
  transaction: Transaction;
}

export const TransactionAccordionItem = ({
  transaction: tx,
}: TransactionAccordionItemProps) => {
  const asset = defaultNetworkAssetByAddress[getAssetAddress(tx)];
  const assetSymbol = asset?.symbol ?? "ETH";
  const etherscanUrl = `https://${defaultNetwork !== 1 ? "sepolia." : ""}etherscan.io/tx/${tx.transactionHash}`;

  const hasEthValue = tx.value && Number(tx.value) > 0;
  const hasAssetValue = tx.type === "Deposit" && !tx.value && asset;

  return (
    <AccordionItem value={tx.id}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center justify-between w-full pr-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{getTransactionVerb(tx.type)}</Badge>
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
            <p className="font-mono text-sm break-all">{tx.transactionHash}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Date & Time</p>
            <p className="text-sm">{new Date(tx.timestamp).toLocaleString()}</p>
          </div>
          {hasEthValue && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Amount</p>
              <p className="text-sm font-medium">
                {(parseFloat(tx.value!) / 1e18).toFixed(6)} ETH
              </p>
            </div>
          )}
          {hasAssetValue && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Amount</p>
              <p className="text-sm font-medium">
                {formatUnits(getAssetAmount(tx), asset.decimals)} {asset.symbol}
              </p>
            </div>
          )}
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
