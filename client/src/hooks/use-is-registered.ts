import { useDeviceCompatible } from "./use-device-compatible";
import { useQuery } from "@tanstack/react-query";

export const useIsRegistered = () => {
  const { isPasskeySupported, isDBSupported } = useDeviceCompatible();

  // Check if user is registered
  const queryFn = useQuery({
    queryKey: ["isRegistered"],
    queryFn: async () => {
      // Check both the explicit flag and actual registration artifacts
      const accountRegistered = localStorage.getItem("accountRegistered");
      const registeredUsername = localStorage.getItem("registeredUsername");
      const encryptedMnemonic = localStorage.getItem("encryptedMnemonic");

      // User is registered if either:
      // 1. The accountRegistered flag is set, OR
      // 2. Both registration artifacts (username + encrypted mnemonic) exist
      const isRegistered =
        accountRegistered === "true" ||
        (registeredUsername === "commbank.eth" && encryptedMnemonic !== null);

      return isRegistered;
    },
    enabled: isPasskeySupported && isDBSupported,
  });

  return queryFn;
};
