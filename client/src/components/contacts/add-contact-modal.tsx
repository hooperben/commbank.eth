import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAddContact } from "@/_hooks/use-contacts";
import { isValidEthereumAddress } from "@/lib/utils";
import { Info, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AddContactModalProps {
  children?: React.ReactNode;
}

export function AddContactModal({ children }: AddContactModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [nickname, setNickname] = useState("");
  const [evmAddress, setEvmAddress] = useState("");
  const [privateAddress, setPrivateAddress] = useState("");
  const [envelopeAddress, setEnvelopeAddress] = useState("");
  const [includePublic, setIncludePublic] = useState(false);
  const [includePrivate, setIncludePrivate] = useState(false);

  const addContactMutation = useAddContact();

  const validateForm = () => {
    // Nickname is required
    if (!nickname.trim()) {
      toast.error("Contact name is required");
      return false;
    }

    // Must have at least public OR private addresses
    if (!includePublic && !includePrivate) {
      toast.error("Please include at least public or private addresses");
      return false;
    }

    // Validate EVM address if included
    if (includePublic) {
      if (!evmAddress.trim()) {
        toast.error("EVM address is required when including public addresses");
        return false;
      }
      if (!isValidEthereumAddress(evmAddress)) {
        toast.error("Invalid Ethereum address");
        return false;
      }
    }

    // Validate private addresses if included
    if (includePrivate) {
      if (!privateAddress.trim() || !envelopeAddress.trim()) {
        toast.error(
          "Both Owner Address and Envelope are required for private addresses",
        );
        return false;
      }

      // Validate private address (should be a hex string starting with 0x)
      if (
        !privateAddress.startsWith("0x") ||
        privateAddress.length < 10 ||
        !/^0x[0-9a-fA-F]+$/.test(privateAddress)
      ) {
        toast.error("Invalid Owner Address format (must be a hex string)");
        return false;
      }

      // Validate envelope address (should be a hex string starting with 0x)
      if (
        !envelopeAddress.startsWith("0x") ||
        envelopeAddress.length < 10 ||
        !/^0x[0-9a-fA-F]+$/.test(envelopeAddress)
      ) {
        toast.error("Invalid Envelope format (must be a hex string)");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await addContactMutation.mutateAsync({
        nickname: nickname.trim(),
        evmAddress: includePublic ? evmAddress.trim() : undefined,
        privateAddress: includePrivate ? privateAddress.trim() : undefined,
        envelopeAddress: includePrivate ? envelopeAddress.trim() : undefined,
      });

      // Reset form and close modal
      setNickname("");
      setEvmAddress("");
      setPrivateAddress("");
      setEnvelopeAddress("");
      setIncludePublic(false);
      setIncludePrivate(false);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to add contact:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Contact
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Contact Name */}
          <div className="space-y-2">
            <Label htmlFor="nickname" className="text-sm font-medium">
              Contact Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nickname"
              placeholder="Enter contact name"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>

          {/* Public Address Section */}
          <Label
            className="hover:bg-accent/50 flex items-start gap-3 rounded-md border border-input p-3 transition-colors data-[state=checked]:border-blue-600 cursor-pointer"
            data-state={includePublic ? "checked" : "unchecked"}
          >
            <Checkbox
              id="toggle-public"
              checked={includePublic}
              onCheckedChange={(checked) =>
                setIncludePublic(checked as boolean)
              }
              className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
            />
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-sm leading-none font-medium">Public Address</p>
              {includePublic && (
                <div className="space-y-1">
                  <Label
                    htmlFor="evm-address"
                    className="text-xs text-muted-foreground"
                  >
                    EVM Address:
                  </Label>
                  <Input
                    id="evm-address"
                    placeholder="0x..."
                    value={evmAddress}
                    onChange={(e) => setEvmAddress(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              )}
            </div>
          </Label>

          {/* Private Address Section */}
          <Label
            className="hover:bg-accent/50 flex items-start gap-3 rounded-md border border-input p-3 transition-colors data-[state=checked]:border-blue-600 cursor-pointer"
            data-state={includePrivate ? "checked" : "unchecked"}
          >
            <Checkbox
              id="toggle-private"
              checked={includePrivate}
              onCheckedChange={(checked) =>
                setIncludePrivate(checked as boolean)
              }
              className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
            />
            <div className="flex-1 min-w-0 space-y-2">
              <p className="text-sm leading-none font-medium">
                Private Addresses
              </p>
              {includePrivate && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label
                      htmlFor="private-address"
                      className="text-xs text-muted-foreground"
                    >
                      Owner Address:
                    </Label>
                    <Input
                      id="private-address"
                      placeholder="0x..."
                      value={privateAddress}
                      onChange={(e) => setPrivateAddress(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label
                      htmlFor="envelope-address"
                      className="text-xs text-muted-foreground"
                    >
                      Envelope:
                    </Label>
                    <Input
                      id="envelope-address"
                      placeholder="0x..."
                      value={envelopeAddress}
                      onChange={(e) => setEnvelopeAddress(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          </Label>

          {/* Info Notice */}
          <div className="flex items-start gap-2 rounded-md bg-muted p-3 border border-border">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              You must include at least the public address or private addresses
              to add a contact.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            className="w-full"
            variant="outline"
            disabled={addContactMutation.isPending}
          >
            {addContactMutation.isPending ? "Adding..." : "Add Contact"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
