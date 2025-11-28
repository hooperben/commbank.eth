import { CommbankDotETHAccount } from "@/lib/commbankdoteth-account";
import { useDeviceCompatible } from "./use-device-compatible";
import { useQuery } from "@tanstack/react-query";

export const useIsRegistered = () => {
  const { isPasskeySupported, isDBSupported } = useDeviceCompatible();

  // Check if user is registered
  const queryFn = useQuery({
    queryKey: ["isRegistered"],
    queryFn: async () => {
      const account = new CommbankDotETHAccount();
      return await account.isRegistered();
    },
    enabled: isPasskeySupported && isDBSupported,
  });

  return queryFn;
};
