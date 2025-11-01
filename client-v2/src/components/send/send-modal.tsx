import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SendForm } from "./send-form";
import { SendConfirmation } from "./send-confirmation";
import { SendSuccess } from "./send-success";

export interface SendFormData {
  token: string;
  amount: string;
  recipient: string;
  chainId: number;
}

interface SendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SendStep = "form" | "confirmation" | "success";

export function SendModal({ open, onOpenChange }: SendModalProps) {
  const [step, setStep] = useState<SendStep>("form");
  const [formData, setFormData] = useState<SendFormData | null>(null);
  const [txHash, setTxHash] = useState<string>("");

  const handleFormSubmit = (data: SendFormData) => {
    setFormData(data);
    setStep("confirmation");
  };

  const handleConfirm = async () => {
    // TODO: Execute blockchain transaction
    console.log("Sending transaction:", formData);

    // Simulate transaction
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // TODO: Replace with real transaction hash
    setTxHash(
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    );
    setStep("success");
  };

  const handleBack = () => {
    if (step === "confirmation") {
      setStep("form");
    }
  };

  const handleClose = () => {
    setStep("form");
    setFormData(null);
    setTxHash("");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md px-5">
        <SheetHeader>
          <SheetTitle>
            {step === "form" && "Send"}
            {step === "confirmation" && "Confirm Transaction"}
            {step === "success" && "Transaction Sent"}
          </SheetTitle>
          <SheetDescription>
            {step === "form" && "Enter transaction details"}
            {step === "confirmation" && "Review and confirm your transaction"}
            {step === "success" && "Your transaction has been submitted"}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 px-5">
          {step === "form" && <SendForm onSubmit={handleFormSubmit} />}
          {step === "confirmation" && formData && (
            <SendConfirmation
              data={formData}
              onConfirm={handleConfirm}
              onBack={handleBack}
            />
          )}
          {step === "success" && (
            <SendSuccess txHash={txHash} onClose={handleClose} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
