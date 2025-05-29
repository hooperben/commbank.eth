"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { gravatarUrl } from "@/const/gravatar";
import { useAccountsData } from "@/hooks/use-accounts-data";
import { useAuth } from "@/lib/auth-context";
import { getRegisteredUsername } from "@/lib/passkey";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Banner } from "./banner";
import PrivateAddressManager from "./private-address-manager";
import PublicAddressManager from "./public-address-manager";

const AccountHome = () => {
  const { token } = useAuth();
  const { data: accountsData } = useAccountsData();

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
                  </CardContent>
                </Card>

                <div className="flex flex-col md:flex-row w-full gap-2">
                  <PublicAddressManager />
                  <PrivateAddressManager />
                </div>
              </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default AccountHome;
