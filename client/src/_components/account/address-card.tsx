import { Button } from "@/_components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/_components/ui/card";
import { copyToClipboard } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AddressCardProps {
  publicAddress: string | null;
  privateAddress: string | null;
  signingKey: string | null;
}

export function AddressCard({
  publicAddress,
  privateAddress,
  signingKey,
}: AddressCardProps) {
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const [copiedSigning, setCopiedSigning] = useState(false);

  const handleCopy = async (
    text: string,
    type: "EVM" | "Private" | "Signing",
  ) => {
    if (!text) return;

    const success = await copyToClipboard(text);
    if (success) {
      if (type === "EVM") {
        setCopiedPublic(true);
        setTimeout(() => setCopiedPublic(false), 2000);
      } else if (type === "Private") {
        setCopiedPrivate(true);
        setTimeout(() => setCopiedPrivate(false), 2000);
      } else {
        setCopiedSigning(true);
        setTimeout(() => setCopiedSigning(false), 2000);
      }
      toast.success("Address copied to clipboard");
    } else {
      toast.error("Failed to copy address");
    }
  };

  const Address = ({
    address,
    type,
  }: {
    address: string | null;
    type: "Private" | "Signing" | "EVM";
  }) => {
    if (!address) return null;

    const isCopied =
      (type === "EVM" && copiedPublic) ||
      (type === "Private" && copiedPrivate) ||
      (type === "Signing" && copiedSigning);

    const label =
      type === "EVM"
        ? "Ethereum Address"
        : type === "Private"
          ? "Poseidon"
          : "Signing Key";

    return (
      <div className="flex flex-col gap-2 text-left">
        <div className="flex justify-between items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-sm font-mono break-all">{address}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 h-8 w-8 p-0"
            onClick={() => handleCopy(address, type)}
          >
            {isCopied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-left text-2xl">My Addresses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Address type="EVM" address={publicAddress} />
        <Address type="Private" address={privateAddress} />
        <Address type="Signing" address={signingKey} />
      </CardContent>
    </Card>
  );
}
