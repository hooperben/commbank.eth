import { SignupModal } from "@/_components/auth/signup-modal";
import { Button } from "@/_components/ui/button";
import { useDeviceCompatible } from "@/_hooks/use-device-compatible";
import { useIsRegistered } from "@/_hooks/use-is-registered";
import { useSignIn } from "@/_hooks/use-sign-in";
import { useAuth } from "@/_providers/auth-provider";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const AuthButton = () => {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  const { data: isRegistered, isLoading: checkingRegistration } =
    useIsRegistered();

  const { isPasskeySupported, isDBSupported } = useDeviceCompatible();

  const [showSignupModal, setShowSignupModal] = useState(false);

  const signInMutation = useSignIn();

  const isLoading = signInMutation.isPending || checkingRegistration;

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
  return (
    <>
      <SignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
      />
      <Button
        size="lg"
        onClick={handleButtonClick}
        disabled={isLoading}
        className="min-w-28"
      >
        {isLoading && <Loader2 className="size-5 animate-spin" />}

        {isRegistered ? (isSignedIn ? "My Account" : "Sign In") : "Get Started"}
      </Button>
    </>
  );
};
