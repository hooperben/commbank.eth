import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const handleCopy = async (text: string, isPublic: boolean) => {
    const success = await copyToClipboard(text);
    if (success) {
      if (isPublic) {
        setCopiedPublic(true);
        setTimeout(() => setCopiedPublic(false), 2000);
      } else {
        setCopiedPrivate(true);
        setTimeout(() => setCopiedPrivate(false), 2000);
      }
      toast.success("Address copied to clipboard");
    } else {
      toast.error("Failed to copy address");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-left text-2xl">My Addresses</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Public Address */}
        {publicAddress && (
          <div className="flex flex-col gap-2 text-left">
            <div className="flex justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">
                  Ethereum Address
                </p>
                <p className="font-mono text-sm break-all">{publicAddress}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-8 w-8 p-0"
                onClick={() => handleCopy(publicAddress, true)}
              >
                {copiedPublic ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Private Address */}
        {privateAddress && signingKey && (
          <div className="flex flex-col gap-2 pt-2 border-t text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">
                  Private Addresses
                </p>
                <div className="space-y-4 font-mono text-sm break-all">
                  <div className="flex flex-row items-center gap-2">
                    <p className="font-mono text-xs break-all">
                      {privateAddress}
                    </p>
                    <Badge
                      variant="secondary"
                      className="bg-blue-500 text-xs font-semibold text-white"
                    >
                      Owner Address
                    </Badge>
                  </div>

                  <div className="flex flex-row items-start gap-2">
                    <p className="font-mono text-xs break-all">{signingKey}</p>

                    <Badge
                      variant="secondary"
                      className="bg-green-500 text-xs font-semibold text-primary-foreground"
                    >
                      Envelope Address
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-8 w-8 p-0"
                onClick={() =>
                  handleCopy(`${privateAddress}:${signingKey}`, false)
                }
              >
                {copiedPrivate ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {/* TODO add links when this is real */}
            {/* <p className="w-full text-right text-xs">
              You can read more about the commbank.eth account architecture in
              our documentation.
            </p> */}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
