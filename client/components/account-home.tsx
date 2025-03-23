"use effect";

import { getRegisteredUsername } from "@/lib/passkey";
import {
  getAllEVMAccounts,
  getEVMAccountByUsername,
  getRSAKeyPairByUsername,
} from "@/lib/wallet";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { Button } from "./ui/button";
import { Check, Copy, SendHorizontal, Wallet } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { KeyPair } from "@/wasm/signature_gen";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";

const AccountHome = () => {
  const getAccountsDetails = async () => {
    const username = getRegisteredUsername();

    if (!username) throw new Error("shouldnt happen");

    const evmAccounts = await getAllEVMAccounts();
    const evm = await getEVMAccountByUsername(username);
    const rsa = await getRSAKeyPairByUsername(username);

    try {
      // Dynamically import the WASM module
      const wasmModule = await import("../wasm/signature_gen");

      // Initialize the WASM module with the correct path to the .wasm file
      // For Next.js 13+, WASM files should be in the public directory
      await wasmModule.default("/signature_gen_bg.wasm");

      console.log(rsa);

      const keyPair = new wasmModule.KeyPair(rsa!.privateKey, rsa!.publicKey);

      console.log(keyPair);
    } catch (err) {
      console.log(err);
    }

    console.log("evm:", evmAccounts);
    console.log("evm:", evm);
    console.log(rsa);

    return {
      evm,
      rsa,
    };
  };

  const generateMD5 = (input: string) => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const hexHash = Math.abs(hash).toString(16).padStart(32, "0");
    return hexHash;
  };

  const { data: accountsData, isLoading: isLoadingAccountsData } = useQuery({
    queryKey: ["accounts-data", getRegisteredUsername()],
    queryFn: getAccountsDetails,
  });

  const gravatarUrl = (address: string) =>
    `https://www.gravatar.com/avatar/${generateMD5(address)}?d=identicon&s=200`;

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
          <h1 className="text-3xl font-bold">My Account</h1>

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
                        {getRegisteredUsername() || "JD"}
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

                  <div className="flex flex-col max-w-[300px]">
                    <Button onClick={() => setTransferDialogOpen(true)}>
                      Transfer Between Accounts
                    </Button>

                    <div className="text-muted-foreground mt-2 text-xs">
                      Easily move funds between your public and private
                      accounts.
                    </div>
                  </div>
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
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <code className="bg-muted px-3 py-1.5 rounded text-sm font-mono">
                            {shortenAddress(accountsData.rsa.publicKey)}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              copyToClipboard(
                                accountsData.rsa.publicKey,
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
                            0
                          </div>
                          <Badge variant="secondary">USDC</Badge>
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
