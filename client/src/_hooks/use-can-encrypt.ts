import { SUPPORTED_NETWORKS } from "@/_constants/networks";
import { useAuth } from "@/_providers/auth-provider";
import { useQuery } from "@tanstack/react-query";
import { Contract, JsonRpcProvider } from "ethers";
import { commbankDotEthAbi } from "shared/constants/abi/commbankdoteth";
import { defaultNetwork } from "shared/constants/token";

export const useCanEncrypt = () => {
  const { address } = useAuth();

  const { data: canEncrypt, isLoading } = useQuery({
    queryKey: ["canEncrypt", address],
    queryFn: async () => {
      if (!address) return false;

      const chain = SUPPORTED_NETWORKS[defaultNetwork];
      if (!chain?.CommBankDotEth) return false;

      const provider = new JsonRpcProvider(chain.rpc);
      const contract = new Contract(
        chain.CommBankDotEth,
        commbankDotEthAbi,
        provider,
      );

      const depositRole =
        "0x2561bf26f818282a3be40719542054d2173eb0d38539e8a8d3cff22f29fd2384"; // await contract.DEPOSIT_ROLE();
      const hasRole = await contract.hasRole(depositRole, address);

      return hasRole;
    },
    enabled: !!address,
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  return { canEncrypt: canEncrypt ?? false, isLoading };
};
