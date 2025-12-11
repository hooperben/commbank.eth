import { BrowserNotSupportedWarning } from "@/_components/status/browser-not-supported-warning";
import { Logo } from "@/_components/logo";
import PageContainer from "@/_providers/page-container";
import { SignupModal } from "@/_components/sign-up/signup-modal";
import { Button } from "@/_components/ui/button";
import { useDeviceCompatible } from "@/_hooks/use-device-compatible";
import { useIsRegistered } from "@/_hooks/use-is-registered";
import { useSignIn } from "@/_hooks/use-sign-in";
import { useAuth } from "@/_providers/auth-provider";
import { PAGE_METADATA } from "@/_constants/seo-config";
import { Loader2 } from "lucide-react";
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

      <BrowserNotSupportedWarning />

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
