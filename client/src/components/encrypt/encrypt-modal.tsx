import { useState } from "react";
import type { SupportedAsset } from "shared/constants/token";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EncryptStep } from "./encrypt-step";
import { ConfirmEncryptStep } from "./confirm-encryption-step";
import { SuccessStep } from "./success-step";

export type ModalStep = "select" | "confirm" | "success";

export interface EncryptData {
  asset: SupportedAsset;
  amount: number;
}

export function EncryptModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [step, setStep] = useState<ModalStep>("select");
  const [encryptData, setEncryptData] = useState<EncryptData | null>(null);
  const [txHash, setTxHash] = useState<string>("");
  const [explorerUrl, setExplorerUrl] = useState<string>("");

  const handleSelectAsset = (data: EncryptData) => {
    setEncryptData(data);
    setStep("confirm");
  };

  const handleConfirmSuccess = (txHash: string) => {
    setTxHash(txHash);
    // TODO ENVise
    setExplorerUrl(`https://sepolia.etherscan.io/tx/${txHash}`);
    setStep("success");
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after modal closes
    setTimeout(() => {
      setStep("select");
      setEncryptData(null);
      setTxHash("");
      setExplorerUrl("");
    }, 300);
  };

  const handleBack = () => {
    if (step === "confirm") {
      setStep("select");
      setEncryptData(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {step === "select" && <EncryptStep onSelectAsset={handleSelectAsset} />}
        {step === "confirm" && encryptData && (
          <ConfirmEncryptStep
            data={encryptData}
            onBack={handleBack}
            onSuccess={handleConfirmSuccess}
          />
        )}
        {step === "success" && encryptData && (
          <SuccessStep
            data={encryptData}
            txHash={txHash}
            explorerUrl={explorerUrl}
            onClose={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
