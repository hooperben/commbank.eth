import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  isValidMnemonic,
  deriveAddressesFromMnemonic,
  decryptMnemonic,
} from "@/lib/mnemonic-helpers";
import type { BackupFile, DerivedAddresses } from "@/_types";
import { Upload, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AddressPreview } from "./address-preview";

interface RestoreAccountProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (mnemonic: string) => void;
}

type RestoreStep = "upload" | "decrypt" | "preview";

export function RestoreAccount({
  isOpen,
  onClose,
  onComplete,
}: RestoreAccountProps) {
  const [step, setStep] = useState<RestoreStep>("upload");
  const [mnemonicInput, setMnemonicInput] = useState("");
  const [uploadedFile, setUploadedFile] = useState<BackupFile | null>(null);
  const [decryptionPin, setDecryptionPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [mnemonic, setMnemonic] = useState("");
  const [addresses, setAddresses] = useState<DerivedAddresses | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string) as BackupFile;
        setUploadedFile(json);

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
      toast.error("Invalid 24-word mnemonic phrase");
    }
  };

  const handleDecrypt = () => {
    if (!uploadedFile || !("encryptedMnemonic" in uploadedFile)) return;

    const decrypted = decryptMnemonic(
      uploadedFile.encryptedMnemonic,
      decryptionPin,
    );

    if (!decrypted) {
      setPinError(true);
      return;
    }

    if (isValidMnemonic(decrypted)) {
      setMnemonic(decrypted);
      setPinError(false);
      handlePreview(decrypted);
    } else {
      toast.error("Decrypted mnemonic is invalid");
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

  const handleConfirmImport = () => {
    onComplete(mnemonic);
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
            Paste 24-word mnemonic
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

  const renderDecryptStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Enter Decryption PIN</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="pin" className="text-sm font-medium">
            Decryption PIN
          </Label>
          <Input
            id="pin"
            type="password"
            placeholder="Enter your PIN"
            value={decryptionPin}
            onChange={(e) => {
              setDecryptionPin(e.target.value);
              setPinError(false);
            }}
          />
          {pinError && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>Invalid key</span>
            </div>
          )}
        </div>

        <Button
          onClick={handleDecrypt}
          className="w-full"
          disabled={!decryptionPin || pinError}
        >
          Next
        </Button>
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

        <Button onClick={handleConfirmImport} className="w-full" size="lg">
          Confirm Import
        </Button>
      </div>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {step === "upload" && renderUploadStep()}
        {step === "decrypt" && renderDecryptStep()}
        {step === "preview" && renderPreviewStep()}
      </DialogContent>
    </Dialog>
  );
}
