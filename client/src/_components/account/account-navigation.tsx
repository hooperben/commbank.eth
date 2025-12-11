import { Button } from "@/components/ui/button";
import { useAuth } from "@/_providers/auth-provider";
import { ArrowDownLeft, ArrowUpRight, Users } from "lucide-react";
import { Link } from "react-router-dom";

export const AccountNavigation = () => {
  const { isSignedIn } = useAuth();

  return (
    <div className="grid grid-cols-3 gap-4">
      <Button
        variant="outline"
        className="h-16 text-lg font-semibold flex-col gap-1"
        disabled={!isSignedIn}
        asChild
      >
        <Link to="/contacts">
          <Users className="h-5 w-5" />
          <span className="text-sm">contacts</span>
        </Link>
      </Button>
      <Button
        variant="outline"
        className="h-16 text-lg font-semibold flex-col gap-1"
        disabled
      >
        <ArrowUpRight className="h-5 w-5" />
        <span className="text-sm">send</span>
      </Button>
      <Button
        variant="outline"
        className="h-16 text-lg font-semibold flex-col gap-1"
        disabled
      >
        <ArrowDownLeft className="h-5 w-5" />
        <span className="text-sm">receive</span>
      </Button>
    </div>
  );
};
