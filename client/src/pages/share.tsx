import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { verifyNicknameHash } from "@/lib/nickname-hash";
import type { ContactInfo, ShareProfileParams } from "@/_types";
import { AlertCircle, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function SharePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);

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
      : "Anonymous";

    setContactInfo({
      address: params.address,
      privateAddress: params.privateAddress,
      envelope: params.envelope,
      nickname: displayNickname,
    });
  };

  const handleAddContact = () => {
    if (!contactInfo) return;

    console.log("Add contact:", contactInfo);
    toast.success(`Contact "${contactInfo.nickname}" added!`);
  };

  const handleSignIn = () => {
    navigate("/");
  };

  if (isValid === null) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Loading profile...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 py-8">
              <AlertCircle className="h-16 w-16 text-destructive" />
              <h2 className="text-2xl font-bold text-center">
                Something&apos;s broken here :(
              </h2>
              <p className="text-muted-foreground text-center">
                Maybe try again
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
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
                Public Address (EVM):
              </p>
              <p className="text-sm font-mono break-all bg-muted p-2 rounded">
                {contactInfo.address}
              </p>
            </div>
          )}

          {contactInfo?.privateAddress && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Private Owner Address:
              </p>
              <p className="text-sm font-mono break-all bg-muted p-2 rounded">
                {contactInfo.privateAddress}
              </p>
            </div>
          )}

          {contactInfo?.envelope && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Envelope:
              </p>
              <p className="text-sm font-mono break-all bg-muted p-2 rounded">
                {contactInfo.envelope}
              </p>
            </div>
          )}

          <div className="pt-4">
            {isSignedIn ? (
              <Button
                onClick={handleAddContact}
                className="w-full gap-2"
                size="lg"
              >
                <UserPlus className="h-5 w-5" />
                Add Contact
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Sign in to add this contact
                </p>
                <Button
                  onClick={handleSignIn}
                  className="w-full"
                  size="lg"
                  variant="default"
                >
                  Sign In / Sign Up
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
