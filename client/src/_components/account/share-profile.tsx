import { Checkbox } from "@/_components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/_components/ui/dialog";
import { Input } from "@/_components/ui/input";
import { Label } from "@/_components/ui/label";
import { useAuth } from "@/_providers/auth-provider";
import { addNicknameHash } from "@/lib/formatting/nickname-hash";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Info, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";

const NICKNAME_STORAGE_KEY = "shareProfileNickname";

interface AddressFieldProps {
  label: string;
  value: string | null;
}

function AddressField({ label, value }: AddressFieldProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy");
    }
  };

  if (!value) return null;

  return (
    <div className="flex items-start gap-2 mt-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground mb-1">
          {label}:
        </p>
        <p className="text-xs font-mono break-all leading-relaxed line-clamp-2 sm:line-clamp-none">
          {value}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 shrink-0"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
}

export const ShareProfile = ({
  isShareDialogOpen,
  setIsShareDialogOpen,
}: {
  isShareDialogOpen: boolean;
  setIsShareDialogOpen: () => void;
}) => {
  const { address, signingKey, privateAddress } = useAuth();

  const [sharePublic, setSharePublic] = useState(true);
  const [sharePrivate, setSharePrivate] = useState(true);
  const [showQR, setShowQR] = useState(false);
  const [nickname, setNickname] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(NICKNAME_STORAGE_KEY) || "";
  });
  const [isInputReadOnly, setIsInputReadOnly] = useState(true);

  // Save nickname to localStorage when it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (nickname.trim()) {
      localStorage.setItem(NICKNAME_STORAGE_KEY, nickname.trim());
    }
  }, [nickname]);

  // Reset input readOnly state when dialog closes
  useEffect(() => {
    if (!isShareDialogOpen) {
      setIsInputReadOnly(true);
    }
  }, [isShareDialogOpen]);

  // Generate the profile URL
  const profileUrl = useMemo(() => {
    const params = new URLSearchParams();

    // Add address if sharing public
    if (sharePublic && address) {
      params.append("address", address);
    }

    // Add private addresses if sharing private
    if (sharePrivate) {
      if (privateAddress) {
        params.append("privateAddress", privateAddress);
      }
      if (signingKey) {
        params.append("envelope", signingKey);
      }
    }

    // Add nickname with hash if provided
    if (nickname.trim()) {
      const nicknameWithHash = addNicknameHash(nickname.trim());
      params.append("nickname", nicknameWithHash);
    }

    const baseUrl = import.meta.env.VITE_DOMAIN || "http://localhost:5173";
    return `${baseUrl}/#/share?${params.toString()}`;
  }, [
    sharePublic,
    sharePrivate,
    address,
    privateAddress,
    signingKey,
    nickname,
  ]);

  const handleCopyProfileURL = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success("Profile URL copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy URL");
    }
  };

  return (
    <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
      <DialogContent className="sm:max-w-md p-4">
        <DialogHeader className="text-left">
          <DialogTitle>Share your commbank.eth details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nickname" className="text-sm font-medium">
              My Contact Name (optional)
            </Label>
            <Input
              id="nickname"
              placeholder="Enter a nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              readOnly={isInputReadOnly}
              onFocus={() => setIsInputReadOnly(false)}
            />
            <div className="flex items-start gap-2 rounded-md bg-muted p-1 border border-border">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Anyone you share your details with will see this name.
              </p>
            </div>
          </div>
          <div className="min-h-[200px] sm:min-h-[260px]">
            <AnimatePresence mode="wait">
              {!showQR ? (
                <motion.div
                  key="addresses"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-3"
                >
                  <Label
                    className="hover:bg-accent/50 flex items-start gap-3 rounded-md border border-input p-3 transition-colors data-[state=checked]:border-blue-600"
                    data-state={sharePublic ? "checked" : "unchecked"}
                  >
                    <Checkbox
                      id="toggle-1"
                      checked={sharePublic}
                      onCheckedChange={(checked) =>
                        setSharePublic(checked as boolean)
                      }
                      className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm leading-none font-medium">
                        Public Addresses
                      </p>
                      <AddressField label="Ethereum" value={address} />
                    </div>
                  </Label>

                  <Label
                    className="hover:bg-accent/50 flex items-start gap-3 rounded-md border border-input p-3 transition-colors data-[state=checked]:border-blue-600"
                    data-state={sharePrivate ? "checked" : "unchecked"}
                  >
                    <Checkbox
                      id="toggle-2"
                      checked={sharePrivate}
                      onCheckedChange={(checked) =>
                        setSharePrivate(checked as boolean)
                      }
                      className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm leading-none font-medium">
                        Private Addresses
                      </p>
                      <AddressField
                        label="Poseidon Address"
                        value={privateAddress}
                      />
                      <AddressField label="Envelope" value={signingKey} />
                    </div>
                  </Label>
                </motion.div>
              ) : (
                <motion.div
                  key="qrcode"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center justify-center gap-3 p-4 rounded-lg min-h-[200px] sm:min-h-[260px]"
                >
                  <div className="p-3 rounded-md bg-white">
                    <QRCodeSVG
                      value={profileUrl}
                      size={180}
                      level="M"
                      bgColor="white"
                      fgColor="black"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCopyProfileURL}
              className="flex-1"
              variant="outline"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy URL
            </Button>
            <Button
              onClick={() => setShowQR(!showQR)}
              variant="outline"
              className="flex-1"
            >
              <QrCode className="h-4 w-4 mr-2" />
              {showQR ? "Hide QR" : "Show QR"}
            </Button>
          </div>
          <Button
            onClick={() => setIsShareDialogOpen()}
            className="w-full"
            variant="ghost"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
