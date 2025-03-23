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
import { Check, Copy, Wallet } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";

const AccountHome = () => {
  const getAccountsDetails = async () => {
    const username = getRegisteredUsername();

    if (!username) throw new Error("shouldnt happen");

    const evmAccounts = await getAllEVMAccounts();
    const evm = await getEVMAccountByUsername(username);

    const rsa = await getRSAKeyPairByUsername(username);

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

  return (
    <div className="flex">
      <main className="flex-1 p-6">
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-bold">My Account</h1>

          {accountsData && !!accountsData.evm && getRegisteredUsername() && (
            <div className="flex flex-col w-full gap-2">
              {/* ACCOUNT DETAILS */}
              <Card className="w-full">
                <CardContent className="pt-6">
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
                      <p className="text-sm text-muted-foreground">
                        Account created on {accountsData.evm.createdAt}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* PUBLIC ACCOUNT */}

              <div className="flex flex-row w-full gap-2">
                <Card className="w-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5" />
                      Public Address
                      <Badge variant="outline" className="ml-2">
                        ETH
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
                            10 USDC
                          </div>
                          <Badge variant="secondary">~$10</Badge>
                        </div>
                      </div>
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
                        RSA
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
                            $100
                          </div>
                          <Badge variant="secondary">USD</Badge>
                        </div>
                      </div>
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
