"use effect";

import { getRegisteredUsername } from "@/lib/passkey";
import {
  getAllEVMAccounts,
  getEVMAccountByUsername,
  getRSAKeyPairByUsername,
} from "@/lib/wallet";
import { useQuery } from "@tanstack/react-query";

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

  const { data: accountsData, isLoading: isLoadingAccountsData } = useQuery({
    queryKey: ["accounts-data", getRegisteredUsername()],
    queryFn: getAccountsDetails,
  });

  return (
    <div className="flex">
      <main className="flex-1 p-6">
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-bold">My Account</h1>
        </div>
      </main>
    </div>
  );
};

export default AccountHome;
