import { useAuth } from "@/_providers/auth-provider";
import { CommbankDotETHAccount } from "@/lib/commbankdoteth-account";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useIsRegistered } from "./use-is-registered";

export const useSignUp = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { refetch: refetchRegistered } = useIsRegistered();

  const [state, setState] = useState<"Registering" | "Signing In">();

  // Sign up mutation
  const signUpMutation = useMutation({
    mutationFn: async () => {
      const account = new CommbankDotETHAccount();
      setState("Registering");
      const wallet = await account.registerPasskey();

      if (!wallet) {
        throw new Error("Failed to register passkey");
      }
      await refetchRegistered();

      setState("Signing In");

      // Sign in automatically after registration
      // Note: registerPasskey already authenticates once to encrypt the mnemonic,
      // so we pass the mnemonic here to avoid a third authentication
      const mnemonic = wallet.mnemonic?.phrase;
      if (!mnemonic) {
        throw new Error("Failed to get mnemonic from wallet");
      }
      await signIn(mnemonic);
    },
    onSuccess: () => {
      setState(undefined);
      toast.success("Account created successfully!");
      navigate("/account");
    },
    onError: (error) => {
      setState(undefined);
      console.error("Sign up error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to sign up. Please try again.",
      );
    },
  });

  return { state, ...signUpMutation };
};
