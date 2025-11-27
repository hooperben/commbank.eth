import { useAuth } from "@/lib/auth-context";

export const useCanEncrypt = () => {
  const { address } = useAuth();

  //   const role =
  //     "0x2561bf26f818282a3be40719542054d2173eb0d38539e8a8d3cff22f29fd2384";

  // this is much faster than querying the RPC
  const currentlyAllowed = [
    BigInt("0xd55b4fe4795c117603b3b41fe1d39c5e4235478a"),
    BigInt("0x6e400024D346e8874080438756027001896937E3"),
  ];

  return currentlyAllowed.includes(BigInt(address ?? "0"));
};
