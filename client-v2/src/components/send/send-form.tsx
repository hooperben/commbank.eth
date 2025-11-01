import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SendFormData } from "./send-modal";
import { supportedAssets } from "shared/constants/token";
import { useState } from "react";

interface SendFormProps {
  onSubmit: (data: SendFormData) => void;
}

export function SendForm({ onSubmit }: SendFormProps) {
  const [selectedToken, setSelectedToken] = useState(supportedAssets[0]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SendFormData>({
    defaultValues: {
      token: supportedAssets[0].symbol,
      amount: "",
      recipient: "",
      chainId: supportedAssets[0].chainId,
    },
  });

  const amount = watch("amount");

  // TODO: Replace with real balance from wallet
  const mockBalance = "10.00";

  const handleTokenChange = (symbol: string) => {
    const token = supportedAssets.find((t) => t.symbol === symbol);
    if (token) {
      setSelectedToken(token);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Token Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Token</label>
        <select
          {...register("token", { required: "Token is required" })}
          onChange={(e) => handleTokenChange(e.target.value)}
          className="w-full h-12 px-4 rounded-xl backdrop-blur-xl bg-background/40 border border-border/50 focus:border-border/80 focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
        >
          {supportedAssets.map((asset) => (
            <option
              key={`${asset.chainId}-${asset.symbol}`}
              value={asset.symbol}
            >
              {asset.symbol} ({asset.name}) - {getChainName(asset.chainId)}
            </option>
          ))}
        </select>
        {errors.token && (
          <p className="text-sm text-destructive">{errors.token.message}</p>
        )}
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <label className="text-sm font-medium">Amount</label>
          <span className="text-sm text-muted-foreground">
            Balance: {mockBalance} {selectedToken.symbol}
          </span>
        </div>
        <div className="relative">
          <Input
            {...register("amount", {
              required: "Amount is required",
              pattern: {
                value: /^\d+\.?\d*$/,
                message: "Invalid amount",
              },
              validate: (value) => {
                const num = parseFloat(value);
                if (isNaN(num) || num <= 0) {
                  return "Amount must be greater than 0";
                }
                // TODO: Add real balance validation
                if (num > parseFloat(mockBalance)) {
                  return "Insufficient balance";
                }
                return true;
              },
            })}
            placeholder="0.00"
            className="h-12 text-lg rounded-xl backdrop-blur-xl bg-background/40 border-border/50 focus:border-border/80"
          />
          <button
            type="button"
            onClick={() => {
              // TODO: Set max balance
              console.log("Set max amount");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary hover:text-primary/80 font-medium"
          >
            MAX
          </button>
        </div>
        {errors.amount && (
          <p className="text-sm text-destructive">{errors.amount.message}</p>
        )}
        {amount && (
          <p className="text-sm text-muted-foreground">
            {/* TODO: Add real USD conversion */}≈ $
            {(parseFloat(amount) * 1).toFixed(2)} USD
          </p>
        )}
      </div>

      {/* Recipient Address */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Recipient Address</label>
        <Input
          {...register("recipient", {
            required: "Recipient address is required",
            pattern: {
              value: /^0x[a-fA-F0-9]{40}$/,
              message: "Invalid Ethereum address",
            },
          })}
          placeholder="0x..."
          className="h-12 rounded-xl backdrop-blur-xl bg-background/40 border-border/50 focus:border-border/80 font-mono text-sm"
        />
        {errors.recipient && (
          <p className="text-sm text-destructive">{errors.recipient.message}</p>
        )}
      </div>

      {/* Network Info */}
      <div className="p-4 rounded-lg bg-muted/50 border border-border/30">
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network</span>
            <span className="font-medium">
              {getChainName(selectedToken.chainId)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Est. Gas Fee</span>
            <span className="font-medium">
              {/* TODO: Calculate real gas fee */}
              ~$0.50
            </span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full h-12 text-lg font-semibold rounded-xl backdrop-blur-xl bg-primary hover:bg-primary/90 transition-all"
      >
        Review Transaction
      </Button>
    </form>
  );
}

function getChainName(chainId: number): string {
  const chainNames: Record<number, string> = {
    1: "Ethereum",
    8453: "Base",
    10: "Optimism",
    137: "Polygon",
  };
  return chainNames[chainId] || `Chain ${chainId}`;
}
