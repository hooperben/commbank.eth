import { useDeviceCompatible } from "./use-device-compatible";
import { useQuery } from "@tanstack/react-query";

export const useIsRegistered = () => {
  const { isPasskeySupported, isDBSupported } = useDeviceCompatible();

  // Check if user is registered
  const queryFn = useQuery({
    queryKey: ["isRegistered"],
    queryFn: async () => {
      const registered = localStorage.getItem("accountRegistered");
      return registered;
    },
    enabled: isPasskeySupported && isDBSupported,
  });

  return queryFn;
};
