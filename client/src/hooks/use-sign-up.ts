import { CommbankDotETHAccount } from "@/lib/commbankdoteth-account";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";
import { useIsRegistered } from "./use-is-registered";

export const useSignUp = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { refetch: refetchRegistered } = useIsRegistered();

  // Sign up mutation
  const signUpMutation = useMutation({
    mutationFn: async () => {
      const account = new CommbankDotETHAccount();
      const wallet = await account.registerPasskey();

      if (!wallet) {
        throw new Error("Failed to register passkey");
      }
      await refetchRegistered();

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
      toast.success("Account created successfully!");
      navigate("/account");
    },
    onError: (error) => {
      console.error("Sign up error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to sign up. Please try again.",
      );
    },
  });

  return signUpMutation;
};
