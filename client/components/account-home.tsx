"use client";

import { SendTransactionDialog } from "@/components/send-transaction";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { DEFAULT_PASSKEY_USERNAME } from "@/const";
import { erc20ABI } from "@/const/erc20-abi";
import { gravatarUrl } from "@/const/gravatar";
import { RPC_URL } from "@/const/rpc";
import { USDC_ADDRESS } from "@/const/supported-assets";
import { useAuth } from "@/lib/auth-context";
import { getRegisteredUsername } from "@/lib/passkey";
import { getEVMAccountByUsername, getRSAKeyPairByUsername } from "@/lib/wallet";
import { useQuery } from "@tanstack/react-query";
import { ethers } from "ethers";
import {
  ArrowDownToLine,
  Check,
  Copy,
  SendHorizontal,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Banner } from "./banner";

const AccountHome = () => {
  const { mnemonic, token } = useAuth();
  const getAccountsDetails = async () => {
    const evm = await getEVMAccountByUsername(DEFAULT_PASSKEY_USERNAME);
    const rsa = await getRSAKeyPairByUsername(DEFAULT_PASSKEY_USERNAME);

    console.log("evm:", evm);
    console.log("rsa:", rsa);

    return {
      evm,
      rsa,
    };
  };

  const { data: accountsData } = useQuery({
    queryKey: ["accounts-data", token],
    queryFn: getAccountsDetails,
  });

  const fetchTokenBalances = async () => {
    if (!accountsData?.evm?.address) return { eth: "0", usdc: "0" };

    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);

      // Fetch ETH balance
      const ethBalance = await provider.getBalance(accountsData.evm.address);

      const usdcContract = new ethers.Contract(
        USDC_ADDRESS,
        erc20ABI,
        provider,
      );

      // Fetch USDC balance
      const usdcBalance = await usdcContract.balanceOf(
        accountsData.evm.address,
      );

      return {
        eth: ethers.formatEther(ethBalance),
        usdc: ethers.formatUnits(usdcBalance, 6), // USDC has 6 decimals
      };
    } catch (error) {
      console.error("Error fetching token balances:", error);
      return { eth: "0", usdc: "0" };
    }
  };

  const { data: tokenBalances, isLoading: isLoadingBalances } = useQuery({
    queryKey: ["token-balances", accountsData?.evm?.address],
    queryFn: fetchTokenBalances,
    enabled: !!accountsData?.evm?.address,
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

  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [receiveAddress, setReceiveAddress] = useState("");
  const [receiveType, setReceiveType] = useState<"public" | "private">(
    "public",
  );

  // New state for send transaction dialog
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendAccountType, setSendAccountType] = useState<"public" | "private">(
    "public",
  );

  const { data: isRegisteredUsername } = useQuery({
    queryKey: ["registered-username"],
    queryFn: async () => {
      const username = await getRegisteredUsername();
      return { username };
    },
  });

  return (
    <div className="flex flex-col">
      {token && (
        <Banner className="border-none px-6">
          <Badge variant="destructive">
            <p>
              WARNING: commbank.eth is experimental and unaudited. Please ensure
              you have exported your mnemonic from the{" "}
              <Link href="/settings"> {" Settings "} </Link> page before
              depositing.
            </p>
          </Badge>
        </Banner>
      )}
      <main className="flex-1 px-6">
        <div className="flex flex-col gap-6">
          {accountsData &&
            isRegisteredUsername?.username &&
            !!accountsData.evm && (
              <div className="flex flex-col w-full gap-2">
                {/* ACCOUNT DETAILS */}
                <Card className="w-full">
                  <CardContent className="flex pt-6 flex-row justify-between items-center">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <Avatar className="h-20 w-20 border-2 border-primary/20">
                        <AvatarImage
                          src={gravatarUrl(accountsData.evm.address)}
                          alt={isRegisteredUsername.username || "JD"}
                        />
                        <AvatarFallback className="text-lg">
                          {accountsData.evm.address.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-primary">
                          My Account
                        </h2>
                      </div>
                    </div>

                    <Dialog
                      open={receiveDialogOpen}
                      onOpenChange={setReceiveDialogOpen}
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Receive Funds</DialogTitle>
                          <DialogDescription>
                            Scan this QR code or copy the address to receive
                            funds.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center justify-center gap-4 py-4">
                          <div className="bg-white p-4 rounded-lg">
                            <QRCodeSVG value={receiveAddress} size={200} />
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="bg-muted text-center px-3 py-1.5 rounded text-sm font-mono flex-1 overflow-hidden text-ellipsis">
                              {receiveAddress}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0"
                              onClick={() =>
                                copyToClipboard(receiveAddress, receiveType)
                              }
                            >
                              {(
                                receiveType === "public"
                                  ? copiedPublic
                                  : copiedPrivate
                              ) ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {receiveType === "public"
                              ? "Public EVM Address"
                              : "Private Address"}
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Send Transaction Dialog */}
                    <SendTransactionDialog
                      open={sendDialogOpen}
                      onOpenChange={setSendDialogOpen}
                      accountType={sendAccountType}
                      availableAssets={tokenBalances || { eth: "0", usdc: "0" }}
                    />
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
                          {isLoadingBalances ? (
                            <div className="h-12 flex items-center">
                              <div className="h-5 w-24 bg-muted animate-pulse rounded"></div>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between items-center">
                                <div className="font-mono text-xl font-semibold">
                                  {tokenBalances?.usdc || "0"} USDC
                                </div>
                                <Badge variant="secondary">
                                  ${tokenBalances?.usdc || "0"}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1 font-mono">
                                {tokenBalances?.eth || "0"} ETH
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setReceiveAddress(accountsData.evm!.address);
                            setReceiveType("public");
                            setReceiveDialogOpen(true);
                          }}
                        >
                          <ArrowDownToLine className="h-4 w-4 mr-2" />
                          Receive
                        </Button>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setSendAccountType("public");
                            setSendDialogOpen(true);
                          }}
                        >
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
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setReceiveAddress(
                              Buffer.from(accountsData.rsa!.publicKey).toString(
                                "hex",
                              ),
                            );
                            setReceiveType("private");
                            setReceiveDialogOpen(true);
                          }}
                        >
                          <ArrowDownToLine className="h-4 w-4 mr-2" />
                          Receive
                        </Button>
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            setSendAccountType("private");
                            setSendDialogOpen(true);
                          }}
                        >
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
