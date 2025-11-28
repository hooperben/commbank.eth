import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth-context";
import { addNicknameHash } from "@/lib/nickname-hash";
import { Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";

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
        <p className="text-xs font-mono break-all leading-relaxed">{value}</p>
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
  const { isSignedIn, address, signingKey, privateAddress } = useAuth();

  const [sharePublic, setSharePublic] = useState(false);
  const [sharePrivate, setSharePrivate] = useState(true);
  const [nickname, setNickname] = useState("");

  const handleCopyProfileURL = async () => {
    try {
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

      const url = `https://localhost:5173/#/share?${params.toString()}`;
      await navigator.clipboard.writeText(url);
      toast.success("Profile URL copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy URL");
    }
  };

  return (
    <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!isSignedIn}
        >
          share
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share your commbank.eth details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-3">
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
                <AddressField label="EVM" value={address} />
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
                <AddressField label="Owner Address" value={privateAddress} />
                <AddressField label="Envelope" value={signingKey} />
              </div>
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname" className="text-sm font-medium">
              Nickname (optional)
            </Label>
            <Input
              id="nickname"
              placeholder="Enter a nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          <Button
            onClick={handleCopyProfileURL}
            className="w-full"
            variant="outline"
          >
            Copy Profile URL
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
