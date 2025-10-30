import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";

const TransferDialog = ({
  transferModalOpen,
  setTransferModalOpen,
}: {
  transferModalOpen: boolean;
  setTransferModalOpen: (_: boolean) => void;
}) => {
  const [selectedAsset, setSelectedAsset] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const { address: wagmiAddress } = useAccount();
  const { address: commbankDotEthAddress } = useAuth();

  const handleTransfer = () => console.log("TODO");

  return (
    <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer to commbank.eth
          </DialogTitle>
          <DialogDescription>
            Transfer assets from your connected wallet to your commbank.eth
            account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="asset">Select Asset</Label>
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an asset to transfer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODO">TODO</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              step="any"
              min="0"
            />

            {selectedAsset && transferAmount && (
              <Card className="p-4 bg-muted/50">
                <h4 className="font-medium mb-2">Transfer Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>
                      {transferAmount} {selectedAsset}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>From:</span>
                    <span className="font-mono">
                      {wagmiAddress?.slice(0, 6)}...{wagmiAddress?.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>To:</span>
                    <span className="font-mono">
                      {commbankDotEthAddress?.slice(0, 6)}...
                      {commbankDotEthAddress?.slice(-4)}
                    </span>
                  </div>
                </div>
              </Card>
            )}

            <Button
              onClick={handleTransfer}
              disabled={!selectedAsset || !transferAmount}
              className="w-full"
            >
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Transfer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransferDialog;
