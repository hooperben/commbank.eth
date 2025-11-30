import type { ContactInfo, ShareProfileParams } from "@/_types";
import PageContainer from "@/components/page-container";
import { SignupModal } from "@/components/signup/signup-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAddContact } from "@/hooks/use-contacts";
import { useIsRegistered } from "@/hooks/use-is-registered";
import { useSignIn } from "@/hooks/use-sign-in";
import { verifyNicknameHash } from "@/lib/nickname-hash";
import { PAGE_METADATA } from "@/lib/seo-config";
import { AlertCircle, Loader2, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function SharePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);

  // Check localStorage for sign-in status (works across tabs)
  const [hasAccount, setHasAccount] = useState(false);

  useEffect(() => {
    // a users signed in before they have this flag set to true
    if (typeof window !== "undefined") {
      const registered = localStorage.getItem("accountRegistered") === "true";
      setHasAccount(registered);
    }
  }, []);

  // Check if user is registered
  const { data: isRegistered, isLoading: checkingRegistration } =
    useIsRegistered();

  // Sign in mutation
  const signInMutation = useSignIn();

  // Add contact mutation
  const addContactMutation = useAddContact();

  const handleGetStarted = () => {
    if (!isRegistered) {
      setShowSignupModal(true);
    } else {
      signInMutation.mutate();
    }
  };

  useEffect(() => {
    validateShareParams();
  }, [searchParams]);

  const validateShareParams = () => {
    const params: ShareProfileParams = {
      address: searchParams.get("address") || undefined,
      privateAddress: searchParams.get("privateAddress") || undefined,
      envelope: searchParams.get("envelope") || undefined,
      nickname: searchParams.get("nickname") || undefined,
    };

    // Check if at least one address is provided
    const hasAddress = params.address || params.privateAddress;
    if (!hasAddress) {
      setIsValid(false);
      return;
    }

    // Verify nickname hash if nickname is provided
    if (params.nickname) {
      const isNicknameValid = verifyNicknameHash(params.nickname);
      if (!isNicknameValid) {
        setIsValid(false);
        return;
      }
    }

    // All validations passed
    setIsValid(true);

    // Extract nickname without hash for display
    const displayNickname = params.nickname
      ? params.nickname.split(".")[0]
      : "No Name Provided";

    setContactInfo({
      address: params.address,
      privateAddress: params.privateAddress,
      envelope: params.envelope,
      nickname: displayNickname,
    });
  };

  const handleAddContact = () => {
    if (!contactInfo) return;

    addContactMutation.mutate(
      {
        nickname: contactInfo.nickname || "Unknown",
        evmAddress: contactInfo.address,
        privateAddress: contactInfo.privateAddress,
        envelopeAddress: contactInfo.envelope,
      },
      {
        onSuccess: () => {
          // Navigate to contacts page after successful add
          navigate("/contacts");
        },
      },
    );
  };

  const isLoading =
    signInMutation.isPending ||
    checkingRegistration ||
    addContactMutation.isPending;

  return (
    <PageContainer {...PAGE_METADATA.share}>
      {isValid === null && (
        <div className="container mx-auto p-6 max-w-2xl">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Loading profile...
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      {!isValid && (
        <div className="container mx-auto p-6 max-w-2xl">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 py-8">
                <AlertCircle className="h-16 w-16 text-destructive" />
                <h2 className="text-2xl font-bold text-center">
                  Something&apos;s broken here
                </h2>
                <p className="text-muted-foreground text-center">
                  Maybe try again
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {isValid && (
        <div className="container mx-auto p-6 max-w-2xl space-y-6">
          <SignupModal
            isOpen={showSignupModal}
            onClose={() => setShowSignupModal(false)}
          />
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {contactInfo?.nickname || "Anonymous"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                wants to share their commbank.eth details
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {contactInfo?.address && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Their Public Address (EVM):
                  </p>
                  <p className="text-sm font-mono break-all bg-muted p-2 rounded">
                    {contactInfo.address}
                  </p>
                </div>
              )}

              {contactInfo?.privateAddress && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Their Private Address:
                  </p>
                  <p className="text-sm font-mono break-all bg-muted p-2 rounded">
                    {contactInfo.privateAddress}
                  </p>
                </div>
              )}

              {contactInfo?.envelope && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Their Envelope:
                  </p>
                  <p className="text-sm font-mono break-all bg-muted p-2 rounded">
                    {contactInfo.envelope}
                  </p>
                </div>
              )}

              <div className="pt-4">
                {hasAccount ? (
                  <Button
                    onClick={handleAddContact}
                    className="w-full gap-2"
                    size="lg"
                    disabled={addContactMutation.isPending}
                  >
                    {addContactMutation.isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <UserPlus className="h-5 w-5" />
                    )}
                    {addContactMutation.isPending ? "Adding..." : "Add Contact"}
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center">
                      Create an account to add this contact
                    </p>
                    <Button
                      onClick={handleGetStarted}
                      className="w-full"
                      size="lg"
                      variant="default"
                      disabled={isLoading}
                    >
                      {isLoading && (
                        <Loader2 className="size-5 animate-spin mr-2" />
                      )}
                      Get Started
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
