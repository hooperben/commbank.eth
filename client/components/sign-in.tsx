import { useAuth } from "@/lib/auth-context";
import { Fingerprint, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SignIn = () => {
  const { handleSignIn, isAuthenticating } = useAuth();

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
