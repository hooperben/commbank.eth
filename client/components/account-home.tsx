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
import { Check, Copy } from "lucide-react";

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

          {accountsData && accountsData.evm && getRegisteredUsername() && (
            <div className="flex flex-row w-full gap-2">
              <Avatar className="flex justify-center h-16 w-16 border-2 border-primary/20">
                <AvatarImage
                  src={gravatarUrl(accountsData.evm?.address)}
                  alt={getRegisteredUsername() || "JD"}
                />
                <AvatarFallback>
                  {accountsData.evm?.address.slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-row w-full justify-between gap-4 items-end">
                <div>
                  <h1 className="text-2xl font-bold text-primary">
                    {getRegisteredUsername() || ""}
                  </h1>
                  <div className="flex items-center mt-1">
                    <div className="flex flex-col">
                      <p>Public Address:</p>

                      <div className="flex flex-row items-center">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {shortenAddress(accountsData.evm.address)}
                        </code>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 ml-1"
                          onClick={() =>
                            copyToClipboard(accountsData.evm.address, "public")
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
                  </div>

                  <div className="flex items-center mt-3">
                    <div className="flex flex-col">
                      <p>Private Address:</p>

                      <div className="flex flex-row items-center">
                        <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                          {shortenAddress(accountsData.rsa.publicKey)}
                        </code>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 ml-1"
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
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AccountHome;
