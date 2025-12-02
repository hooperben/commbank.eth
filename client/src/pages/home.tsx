import { Logo } from "@/components/logo";
import PageContainer from "@/components/page-container";
import { SignupModal } from "@/components/signup/signup-modal";
import { Button } from "@/components/ui/button";
import { useDeviceCompatible } from "@/hooks/use-device-compatible";
import { useIsRegistered } from "@/hooks/use-is-registered";
import { useSignIn } from "@/hooks/use-sign-in";
import { useAuth } from "@/lib/auth-context";
import { PAGE_METADATA } from "@/lib/seo-config";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export const HomePage = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  const [showSignupModal, setShowSignupModal] = useState(false);

  const { data: isRegistered, isLoading: checkingRegistration } =
    useIsRegistered();

  const { isPasskeySupported, isDBSupported } = useDeviceCompatible();

  const signInMutation = useSignIn();

  const handleButtonClick = () => {
    if (!isPasskeySupported || !isDBSupported) return;

    if (!isRegistered) {
      setShowSignupModal(true);
    } else if (isRegistered && !isSignedIn) {
      signInMutation.mutate();
    } else if (isSignedIn) {
      // Already signed in, just navigate to account page
      navigate("/account");
    }
  };

  const isBrowserSupported = isPasskeySupported && isDBSupported;

  const isLoading = signInMutation.isPending || checkingRegistration;

  return (
    <PageContainer {...PAGE_METADATA.home}>
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
      />

      <div className="transform transition-all duration-1000 delay-300 flex w-full justify-center ml-4">
        <Logo height={400} width={400} />
      </div>
      <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 transform transition-all duration-1000 delay-500">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
          commbank.eth
        </span>
      </h1>

      {!isBrowserSupported && (
        <div className="flex items-center gap-2 mb-4 p-4 rounded-lg bg-destructive/10 text-destructive max-w-xl">
          <AlertCircle className="size-5 shrink-0" />
          <div className="text-sm space-y-1">
            {!isPasskeySupported && (
              <p>
                <strong>Passkeys not supported:</strong> Please use a modern
                browser like Chrome, Safari, or Edge.
              </p>
            )}
            {!isDBSupported && (
              <p>
                <strong>IndexedDB not supported:</strong> Your browser must
                support IndexedDB to use commbank.eth.
              </p>
            )}
            <p className="text-xs opacity-90">
              commbank.eth requires both passkey authentication and IndexedDB
              for secure, private transactions.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-row gap-2 justify-center">
        <Button size="lg" variant={"outline"} asChild>
          <Link to="/about">Learn more</Link>
        </Button>

        {isBrowserSupported && (
          <Button
            size="lg"
            onClick={handleButtonClick}
            disabled={isLoading}
            className="min-w-28"
          >
            {isLoading && <Loader2 className="size-5 animate-spin" />}

            {isRegistered
              ? isSignedIn
                ? "My Account"
                : "Sign In"
              : "Get Started"}
          </Button>
        )}
      </div>
    </PageContainer>
  );
};
