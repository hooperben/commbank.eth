import { Button } from "@/_components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/_components/ui/dropdown-menu";
import { useAuth } from "@/_providers/auth-provider";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, RefreshCw, Settings, User } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function SettingsDropdown() {
  const { isLoading, isSignedIn, signOut, refreshNotes } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      const newNotesCount = await refreshNotes();
      if (newNotesCount > 0) {
        // Invalidate queries to refresh balances
        queryClient.invalidateQueries({ queryKey: ["privateBalances"] });
        queryClient.invalidateQueries({ queryKey: ["notes"] });
      } else {
        toast.success("Account is up to date");
      }
    } catch (error) {
      console.error("Failed to refresh:", error);
      toast.error("Failed to refresh account");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    signOut();
    toast.success("Logged out - Have a nice day!");
    navigate("/");
  };

  if (isLoading || !isSignedIn) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`
                group relative overflow-hidden
                h-10 w-10
                rounded-2xl
                backdrop-blur-xl
                bg-background/40
                border border-border/50
                shadow-lg shadow-black/5
                hover:shadow-xl hover:shadow-black/10
                hover:bg-background/60
                hover:border-border/80
                hover:scale-105
                active:scale-95
                transition-all duration-300 ease-out
                before:absolute before:inset-0
                before:bg-gradient-to-br before:from-white/10 before:to-transparent
                before:opacity-0 before:group-hover:opacity-100
                before:transition-opacity before:duration-300
                after:absolute after:inset-0
                after:bg-gradient-to-tr after:from-transparent after:via-white/5 after:to-white/10
                after:opacity-60
              `}
          >
            <Settings className="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link
              to="/account"
              className="flex items-center gap-2 cursor-pointer"
            >
              <User className="size-4" />
              Account
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              to="/settings"
              className="flex items-center gap-2 cursor-pointer"
            >
              <Settings className="size-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw
              className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh Account"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={handleLogout}
            className="flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="size-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
