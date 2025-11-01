import { Logo } from "@/components/logo";
import PageContainer from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { CommbankDotETHAccount } from "@/lib/commbankdoteth-account";
import { PAGE_METADATA } from "@/lib/seo-config";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const HomePage = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [isPasskeySupported, setIsPassKeySupported] = useState(true);

  useEffect(() => {
    const isSupported = CommbankDotETHAccount.isSupported();
    setIsPassKeySupported(isSupported);
  }, []);

  // Check if user is registered
  const { data: isRegistered, isLoading: checkingRegistration } = useQuery({
    queryKey: ["isRegistered"],
    queryFn: async () => {
      const account = new CommbankDotETHAccount();
      return await account.isRegistered();
    },
    enabled: isPasskeySupported,
  });

  // Sign up mutation
  const signUpMutation = useMutation({
    mutationFn: async () => {
      const account = new CommbankDotETHAccount();
      const wallet = await account.registerPasskey();
      if (!wallet) {
        throw new Error("Failed to register passkey");
      }
      return wallet;
    },
    onSuccess: (account) => {
      console.log(account);
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

  // Sign in mutation
  const signInMutation = useMutation({
    mutationFn: async () => {
      await signIn();
      const account = new CommbankDotETHAccount();
      return await account.getPasskeyAccount();
    },
    onSuccess: (account) => {
      console.log(account);
      toast.success("Signed in successfully!");
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

  const handleButtonClick = () => {
    if (!isPasskeySupported) return;

    if (!isRegistered) {
      signUpMutation.mutate();
    } else {
      signInMutation.mutate();
    }
  };

  const isLoading =
    signUpMutation.isPending ||
    signInMutation.isPending ||
    checkingRegistration;

  return (
    <PageContainer {...PAGE_METADATA.home}>
      <div className="mb-8 transform transition-all duration-1000 delay-300 flex w-full justify-center">
        <Logo height={400} width={400} />
      </div>
      <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 transform transition-all duration-1000 delay-500">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
          commbank.eth
        </span>
      </h1>

      {!isPasskeySupported && (
        <div className="flex items-center gap-2 mb-4 p-4 rounded-lg bg-destructive/10 text-destructive">
          <AlertCircle className="size-5" />
          <p className="text-sm">
            Passkeys are not supported in this browser. Please try a modern
            browser like Chrome, Safari, or Edge.
          </p>
        </div>
      )}

      <div className="flex flex-row gap-2 justify-center">
        <Button size="lg" variant={"outline"} asChild>
          <Link to="/about">Learn more</Link>
        </Button>

        {isPasskeySupported && (
          <Button
            size="lg"
            onClick={handleButtonClick}
            disabled={isLoading}
            className="min-w-28"
          >
            {isLoading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : !isRegistered ? (
              "Sign Up"
            ) : (
              "Sign In"
            )}
          </Button>
        )}
      </div>
    </PageContainer>
  );
};
