"use effect";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { DEFAULT_PASSKEY_USERNAME } from "@/const";
import { gravatarUrl } from "@/const/gravatar";
import { useAuth } from "@/lib/auth-context";
import { getRegisteredUsername } from "@/lib/passkey";
import {
  getAllEVMAccounts,
  getEVMAccountByUsername,
  getRSAKeyPairByUsername,
} from "@/lib/wallet";
import { useQuery } from "@tanstack/react-query";
import { Check, Copy, SendHorizontal, Wallet } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const AccountHome = () => {
  const { mnemonic } = useAuth();
  const getAccountsDetails = async () => {
    const evmAccounts = await getAllEVMAccounts();
    const evm = await getEVMAccountByUsername(DEFAULT_PASSKEY_USERNAME);
    const rsa = await getRSAKeyPairByUsername(DEFAULT_PASSKEY_USERNAME);

    console.log("evm:", evmAccounts);
    console.log("evm:", evm);
    console.log(rsa);

    return {
      evm,
      rsa,
    };
  };

  const { data: accountsData } = useQuery({
    queryKey: ["accounts-data", getRegisteredUsername()],
    queryFn: getAccountsDetails,
  });

  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);

  const copyToClipboard = (text: string, type: "public" | "private") => {
    navigator.clipboard.writeText(text);
    if (type === "public") {
      setCopiedPublic(true);
      setTimeout(() => setCopiedPublic(false), 2000);
    } else {
      setCopiedPrivate(true);
      setTimeout(() => setCopiedPrivate(false), 2000);
    }
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const [transferDialogOpen, setTransferDialogOpen] = useState(false);

  return (
    <div className="flex">
      <main className="flex-1 p-6">
        <div className="flex flex-col gap-6">
          {accountsData && !!accountsData.evm && getRegisteredUsername() && (
            <div className="flex flex-col w-full gap-2">
              {/* ACCOUNT DETAILS */}
              <Card className="w-full">
                <CardContent className="flex pt-6 flex-row justify-between items-center">
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <Avatar className="h-20 w-20 border-2 border-primary/20">
                      <AvatarImage
                        src={gravatarUrl(accountsData.evm.address)}
                        alt={getRegisteredUsername() || "JD"}
                      />
                      <AvatarFallback className="text-lg">
                        {accountsData.evm.address.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold text-primary">
                        commbank.eth
                      </h2>
                    </div>
                  </div>

                  <Dialog
                    open={transferDialogOpen}
                    onOpenChange={setTransferDialogOpen}
                  >
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Transfer Between Accounts</DialogTitle>
                        <DialogDescription>
                          Move funds between your public and private accounts.
                        </DialogDescription>
                      </DialogHeader>
                      <Tabs defaultValue="public-to-private" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="public-to-private">
                            Public → Private
                          </TabsTrigger>
                          <TabsTrigger value="private-to-public">
                            Private → Public
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent
                          value="public-to-private"
                          className="space-y-4 pt-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="public-amount">Amount (USDC)</Label>
                            <Input
                              id="public-amount"
                              placeholder="0.00"
                              type="number"
                            />
                            <p className="text-xs text-muted-foreground">
                              Available: 0 USDC
                            </p>
                          </div>
                        </TabsContent>
                        <TabsContent
                          value="private-to-public"
                          className="space-y-4 pt-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="private-amount">Amount (USD)</Label>
                            <Input
                              id="private-amount"
                              placeholder="0.00"
                              type="number"
                            />
                            <p className="text-xs text-muted-foreground">
                              Available: 0 USDC
                            </p>
                          </div>
                        </TabsContent>
                      </Tabs>
                      <DialogFooter className="mt-4">
                        <Button
                          type="submit"
                          onClick={() => setTransferDialogOpen(false)}
                        >
                          Transfer
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <div className="flex flex-col md:flex-row w-full gap-2">
                {/* PUBLIC ACCOUNT */}
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Public Address
                      <Badge variant="outline" className="ml-2">
                        EVM
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-3 py-1.5 rounded text-sm font-mono">
                            {shortenAddress(accountsData.evm.address)}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              accountsData.evm &&
                              copyToClipboard(
                                accountsData.evm.address,
                                "public",
                              )
                            }
                          >
                            {copiedPublic ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="pt-2">
                        <div className="text-sm text-muted-foreground mb-1">
                          Balance
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="font-mono text-xl font-semibold">
                            0 USDC
                          </div>
                          <Badge variant="secondary">$0</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" className="w-full">
                        <SendHorizontal className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* PRIVATE ACCOUNT */}
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Private Address
                      <Badge variant="outline" className="ml-2">
                        commbank.eth
                      </Badge>
                      <Badge
                        variant={mnemonic ? "secondary" : "destructive"}
                        className="ml-2"
                      >
                        {mnemonic ? "Live Syncing" : "Sync Disabled"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {accountsData.rsa && (
                            <code className="bg-muted px-3 py-1.5 rounded text-sm font-mono">
                              {shortenAddress(
                                Buffer.from(
                                  accountsData.rsa.publicKey,
                                ).toString("hex"),
                              )}
                            </code>
                          )}

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              accountsData.rsa &&
                              copyToClipboard(
                                Buffer.from(
                                  accountsData.rsa.publicKey,
                                ).toString("hex"),
                                "private",
                              )
                            }
                          >
                            {copiedPrivate ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <Separator />

                      <div className="pt-2 space-y-2">
                        <div className="text-sm text-muted-foreground mb-1">
                          Balances
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="font-mono text-lg font-semibold">
                            0 USDC
                          </div>
                          <Badge variant="secondary">$0</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button size="sm" className="w-full">
                        <SendHorizontal className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AccountHome;
