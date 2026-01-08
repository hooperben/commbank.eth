import { X, Check, Loader2 } from "lucide-react";

export type EncryptionStep =
  | "review"
  | "approval"
  | "proof-generation"
  | "deposit"
  | "complete";

const StepIndicator = ({
  label,
  step,
  currentStep,
  error: stepError,
}: {
  label: string;
  step: EncryptionStep;
  currentStep?: EncryptionStep;
  error?: Error | null;
}) => {
  const isComplete = step === "complete";
  const isCurrent = currentStep === step && !isComplete;
  const hasError = stepError && isCurrent;

  return (
    <div className="flex gap-2 text-sm">
      <span className="w-4 min-w-4">
        {hasError ? (
          <X className="h-4 w-4 text-red-500" />
        ) : isComplete ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : isCurrent ? (
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        ) : null}
      </span>
      <span className={hasError ? "text-red-500" : ""}>{label}</span>
    </div>
  );
};

export default StepIndicator;
