import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/_providers/auth-provider";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const useSignIn = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const signInMutation = useMutation({
    mutationFn: async () => {
      await signIn();
    },
    onSuccess: () => {
      toast.success("Successfully signed in.");
      navigate("/account");
    },
    onError: (error) => {
      console.error("Sign in error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to sign in. Please try again.",
      );
    },
  });

  return signInMutation;
};
