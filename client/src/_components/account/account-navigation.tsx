import { Button } from "@/_components/ui/button";
import {
  ArrowUpRight,
  LockKeyhole,
  LockKeyholeOpen,
  Share2,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ShareProfile } from "./share-profile";

export const AccountNavigation = () => {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  return (
    <div className="space-y-4">
      <ShareProfile
        isShareDialogOpen={isShareDialogOpen}
        setIsShareDialogOpen={() => setIsShareDialogOpen(!isShareDialogOpen)}
      />
      {/* Top row: contacts and share */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="h-8 text-lg font-semibold flex gap-1"
          asChild
        >
          <Link to="/contacts">
            <Users className="h-5 w-5" />
            <span className="text-sm">contacts</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-8 text-lg font-semibold flex gap-1"
          onClick={() => setIsShareDialogOpen(!isShareDialogOpen)}
        >
          <Share2 className="h-5 w-5" />
          <span className="text-sm">receive</span>
        </Button>
      </div>

      {/* Bottom row: send, encrypt, decrypt */}
      <div className="grid grid-cols-3 gap-4">
        <Button
          variant="outline"
          className="h-16 text-lg font-semibold flex-col gap-1"
          asChild
        >
          <Link to="/send">
            <ArrowUpRight className="h-5 w-5" />
            <span className="text-sm">send</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-16 text-lg font-semibold flex-col gap-1"
          asChild
        >
          <Link to="/encrypt">
            <LockKeyhole className="h-5 w-5" />
            <span className="text-sm">hide money</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-16 text-lg font-semibold flex-col gap-1"
          asChild
        >
          <Link to="/decrypt">
            <LockKeyholeOpen className="h-5 w-5" />
            <span className="text-sm">show money</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};
