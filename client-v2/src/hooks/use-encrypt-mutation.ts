import { SUPPORTED_NETWORKS } from "@/lib/networks";
import { useMutation } from "@tanstack/react-query";
import { Deposit } from "shared/classes/Deposit";

export const useEncryptMutation = () => {
  const mutationFn = useMutation({
    mutationFn: async ({
      assetId,
      chainId,
    }: {
      assetId: string;
      chainId: number;
    }) => {
      const chain = SUPPORTED_NETWORKS[chainId];
      if (!chain) throw new Error("Misconfigured");

      console.log("assetId: ", assetId);

      const deposit = new Deposit();

      console.log(deposit);

      // need to get tree data
      // generate proof
      // call deposit on contract
    },
  });

  return mutationFn;
};
