import { DEFAULT_PASSKEY_USERNAME } from "@/const";
import { getEVMAccountByUsername, getRSAKeyPairByUsername } from "@/lib/wallet";
import { useQuery } from "@tanstack/react-query";

export const useAccountsData = () => {
  const getAccountsDetails = async () => {
    const evm = await getEVMAccountByUsername(DEFAULT_PASSKEY_USERNAME);
    const rsa = await getRSAKeyPairByUsername(DEFAULT_PASSKEY_USERNAME);

    return {
      evm,
      rsa,
    };
  };

  const queryFn = useQuery({
    queryKey: ["accounts-data"],
    queryFn: getAccountsDetails,
  });

  return queryFn;
};
