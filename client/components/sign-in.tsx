import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { decryptSecret, getEncryptedSecretById, initDB } from "@/lib/db";
import { authenticateWithPasskey } from "@/lib/passkey";
import { Fingerprint } from "lucide-react";
import { Button } from "./ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import {
  generateAndStoreEVMAccount,
  generateAndStoreRSAAccount,
} from "@/lib/wallet";

const SignIn = () => {
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    try {
      await initDB();

      const commbankSecret = await getEncryptedSecretById("commbank.eth");

      if (!commbankSecret) throw new Error("No commbank.eth registered");

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
    }
  };

  return (
    <>
      <CardHeader>
        <CardTitle className="text-center">Login</CardTitle>
        <CardDescription className="text-center">Welcome back!</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          type="submit"
          className="w-full bg-amber-500 hover:bg-amber-600 text-black"
          onClick={handleSignIn}
        >
          <Fingerprint className="mr-2 h-4 w-4" />
          Sign In with Passkey
        </Button>
      </CardContent>
    </>
  );
};

export default SignIn;
