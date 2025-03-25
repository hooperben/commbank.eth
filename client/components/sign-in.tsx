import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { decryptSecret, getEncryptedSecretById, initDB } from "@/lib/db";
import { authenticateWithPasskey, retrieveMnemonic } from "@/lib/passkey";
import { Fingerprint, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

const SignIn = () => {
  const { signIn } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSignIn = async () => {
    setIsAuthenticating(true);

    try {
      await initDB();

      // Use the provided username or fall back to retrieving from storage
      const userToAuthenticate = "commbank.eth";

      // Try to retrieve mnemonic using our enhanced method
      const mnemonic = await retrieveMnemonic();

      if (mnemonic) {
        // Sign in with the retrieved mnemonic
        signIn(mnemonic);
        return;
      }

      // Fall back to original approach if retrieveMnemonic fails
      const commbankSecret = await getEncryptedSecretById(userToAuthenticate);

      if (!commbankSecret)
        throw new Error(`No ${userToAuthenticate} registered`);

      const authData = await authenticateWithPasskey();

      if (!authData) {
        toast({
          title: "Authentication Failed",
          description: "Failed to authenticate with passkey",
          variant: "destructive",
        });
        return;
      }

      const decryptedSecret = await decryptSecret(commbankSecret, authData);
      signIn(decryptedSecret);
    } catch (err) {
      console.log(err);
      toast({
        title: "Authentication Failed",
        description: "Failed to authenticate with passkey",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="text-center">Login</CardTitle>
        <CardDescription className="text-center">Welcome Back</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="submit"
          className="w-full bg-amber-500 hover:bg-amber-600 text-black"
          onClick={handleSignIn}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Authenticating...
            </>
          ) : (
            <>
              <Fingerprint className="mr-2 h-4 w-4" />
              Sign In with Passkey
            </>
          )}
        </Button>
      </CardContent>
    </>
  );
};

export default SignIn;
