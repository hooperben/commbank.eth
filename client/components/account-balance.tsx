import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatAddress } from "@/const";
import { useBalancesTotal } from "@/hooks/use-balances-total";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Copy, HelpCircle, QrCodeIcon, SendIcon, Wallet } from "lucide-react";

const AccountBalance = ({
  setIsDepositModalOpen,
  setIsSendModalOpen,
  setIsAccountManagerOpen,
}: {
  setIsDepositModalOpen: (input: boolean) => void;
  setIsSendModalOpen: (input: boolean) => void;
  setIsAccountManagerOpen: (input: boolean) => void;
}) => {
  const { isSignedIn, address: authAddress } = useAuth();

  const { data: balancesFiatTotal, isLoading } = useBalancesTotal(authAddress!);

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast({
      title: "Address copied",
      description: "Address has been copied to clipboard",
    });
  };

  return (
    <div className="">
      <div className="grid gap-4 md:grid-cols-2">
        {/* CommBank.eth Account */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-amber-500" />
                <CardTitle>commbank.eth Account</CardTitle>
              </div>
            </div>
            <CardDescription>
              Your primary commbank.eth account secured with passkey
              authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSignedIn && authAddress ? (
              <>
                <div className="flex flex-row justify-between w-full items-center space-y-4">
                  <div className="flex flex-row items-center">
                    {isLoading && <Skeleton className="w-24 h-12" />}
                    {!isLoading && (
                      <div className="flex flex-col">
                        <h1 className="text-5xl">
                          {balancesFiatTotal ? (
                            <>${balancesFiatTotal?.toFixed(2)}</>
                          ) : (
                            <>$0.00</>
                          )}
                        </h1>
                      </div>
                    )}
                  </div>

                  {isSignedIn && (
                    <div className="flex md:flex-row md:gap-2 md:justify-center flex-col gap-2 justify-center sm:flex-col sm:gap-2 sm:justify-center">
                      <Button
                        className="flex flex-row items-center h-10 text-xs w-full text-gray-700 md:flex-col md:h-16 md:text-sm md:w-20"
                        onClick={() => setIsDepositModalOpen(true)}
                        disabled={!isSignedIn}
                      >
                        <QrCodeIcon className="mr-2 md:mr-0" />
                        <span>Deposit</span>
                      </Button>
                      <Button
                        className="flex flex-row items-center h-10 text-xs w-full text-gray-700 md:flex-col md:h-16 md:text-sm md:w-20"
                        onClick={() => setIsSendModalOpen(true)}
                        disabled={!isSignedIn}
                      >
                        <SendIcon className="mr-2 md:mr-0" />
                        <span>Send</span>
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium">EVM Address</p>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3 w-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>
                              EVM is short for &apos;Ethereum Virtual
                              Machine&apos;. This means that this is the address
                              where you can send assets on EVM compatible chains
                              (Ethereum, Base, Arbitrum, Optimism, etc).
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <p className="font-mono text-sm text-muted-foreground">
                      {formatAddress(authAddress)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyAddress(authAddress)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground mb-4">
                  Sign in to your commbank.eth account to view details
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAccountManagerOpen(true)}
                >
                  Sign In
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccountBalance;
