import type { SupportedAsset } from "shared/constants/token";
import StepIndicator, { type EncryptionStep } from "./step";

export const Encrypt = ({
  asset,
  formattedBalance,
  formattedPrivateBalance,
  amount,
  encryptionStep,
  error,
}: {
  asset: SupportedAsset;
  formattedBalance: number;
  formattedPrivateBalance: number;
  amount: number;
  encryptionStep: EncryptionStep;
  error: Error | null;
}) => {
  return (
    <div className="bg-background/50 p-4 rounded">
      <div className="grid grid-cols-2 gap-8 relative">
        {/* Left column - Transaction summary */}
        <div className="space-y-2 text-left flex flex-col justify-center text-sm">
          <p className="font-medium text-center">
            Once this transaction is complete:
          </p>
          <p className="text-muted-foreground text-center">
            Public: {(formattedBalance - amount).toFixed(asset.roundTo ?? 2)}{" "}
            {asset.symbol}
          </p>

          <p className="text-muted-foreground text-center">
            Private: {formattedPrivateBalance + amount} {asset.symbol}
          </p>
        </div>

        {/* Vertical divider */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -ml-4" />

        {/* Right column - Steps */}
        <div className="space-y-2 text-left text-xs">
          <StepIndicator
            label={`1. Token Approval (if ERC20 token)`}
            step="approval"
            currentStep={encryptionStep}
            error={error}
          />
          <StepIndicator
            label="2. Generate Zero Knowledge proof of deposit details"
            step="proof-generation"
            currentStep={encryptionStep}
            error={error}
          />
          <StepIndicator
            label="3. Call deposit() on commbank.eth's PrivateUnstoppableMoney contract"
            step="deposit"
            currentStep={encryptionStep}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};
