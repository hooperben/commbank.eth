import type { BackupFile, DerivedAddresses } from "@/_types";
import { Button } from "@/_components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/_components/ui/dialog";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { Textarea } from "@/_components/ui/textarea";
import {
  deriveAddressesFromMnemonic,
  isValidMnemonic,
} from "@/lib/formatting/mnemonic-helpers";
import { Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AddressPreview } from "./address-preview";

interface RestoreAccountProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (mnemonic: string) => Promise<void>;
}

type RestoreStep = "upload" | "decrypt" | "preview";

export function RestoreAccount({
  isOpen,
  onClose,
  onComplete,
}: RestoreAccountProps) {
  const [step, setStep] = useState<RestoreStep>("upload");
  const [mnemonicInput, setMnemonicInput] = useState("");
  const [mnemonic, setMnemonic] = useState("");
  const [addresses, setAddresses] = useState<DerivedAddresses | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string) as BackupFile;

        // Check if it's an encrypted file
        if ("encryptedMnemonic" in json) {
          setStep("decrypt");
        } else if ("mnemonic" in json) {
          // Plain mnemonic file
          if (isValidMnemonic(json.mnemonic)) {
            setMnemonic(json.mnemonic);
            handlePreview(json.mnemonic);
          } else {
            toast.error("Invalid mnemonic in file");
          }
        } else {
          toast.error("Invalid file format");
        }
      } catch (error) {
        console.error("File parse error:", error);
        toast.error("Failed to parse file");
      }
    };
    reader.readAsText(file);
  };

  const handleMnemonicPaste = () => {
    const trimmed = mnemonicInput.trim();
    if (isValidMnemonic(trimmed)) {
      setMnemonic(trimmed);
      handlePreview(trimmed);
    } else {
      toast.error("Invalid 12 word mnemonic phrase");
    }
  };

  const handlePreview = async (mnemonicToPreview: string) => {
    try {
      const derived = await deriveAddressesFromMnemonic(mnemonicToPreview);
      setAddresses(derived);
      setStep("preview");
    } catch (error) {
      console.error("Failed to derive addresses:", error);
      toast.error("Failed to derive addresses");
    }
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    try {
      await onComplete(mnemonic);
    } catch (error) {
      console.error("Import failed:", error);
      setIsImporting(false);
    }
  };

  const renderUploadStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Restore Account</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload" className="text-sm font-medium">
            Upload commbank.eth.json file
          </Label>
          <Label
            htmlFor="file-upload"
            className="text-xs font-medium text-primary/80"
          >
            This is the file that you should have generated when you backed up
            your commbank.eth account.
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="file-upload"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => document.getElementById("file-upload")?.click()}
              variant="outline"
              className="w-full gap-2"
            >
              <Upload className="h-4 w-4" />
              Choose File
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mnemonic" className="text-sm font-medium">
            Paste mnemonic here
          </Label>
          <Label
            htmlFor="file-upload"
            className="text-xs font-medium text-primary/80"
          >
            Paste any 12 word mnemonic phrase here and that will work too.
          </Label>
          <Textarea
            id="mnemonic"
            placeholder="word1 word2 word3 ..."
            value={mnemonicInput}
            onChange={(e) => setMnemonicInput(e.target.value)}
            rows={4}
          />
          <Button
            onClick={handleMnemonicPaste}
            className="w-full"
            disabled={!mnemonicInput.trim()}
          >
            Continue
          </Button>
        </div>
      </div>
    </>
  );

  const renderPreviewStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Confirm Import</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        {addresses && <AddressPreview addresses={addresses} />}

        <Button
          onClick={handleConfirmImport}
          className="w-full"
          size="lg"
          disabled={isImporting}
        >
          {isImporting ? "Importing..." : "Confirm Import"}
        </Button>
      </div>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {step === "upload" && renderUploadStep()}
        {step === "preview" && renderPreviewStep()}
      </DialogContent>
    </Dialog>
  );
}
