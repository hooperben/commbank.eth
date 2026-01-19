import { CommbankDotETHAccount } from "@/lib/commbankdoteth-account";
import { isIndexedDBSupported } from "@/lib/db";
import { useEffect, useState } from "react";

export const useDeviceCompatible = () => {
  const [isPasskeySupported, setIsPassKeySupported] = useState(true);
  const [isDBSupported, setIsDBSupported] = useState(true);

  useEffect(() => {
    const passkeySupported = CommbankDotETHAccount.isSupported();
    const dbSupported = isIndexedDBSupported();
    setIsPassKeySupported(passkeySupported);
    setIsDBSupported(dbSupported);
  }, []);

  return {
    isPasskeySupported,
    isDBSupported,
  };
};
