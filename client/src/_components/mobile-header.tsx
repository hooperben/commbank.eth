import { Logo } from "@/_components/logo";
import { SettingsDropdown } from "@/_components/settings/settings-dropdown";
import { useAuth } from "@/_providers/auth-provider";
import { Link } from "react-router-dom";

interface MobileHeaderProps {
  showSettingsWhenSignedIn?: boolean;
}

export function MobileHeader({
  showSettingsWhenSignedIn = true,
}: MobileHeaderProps) {
  const { isSignedIn } = useAuth();

  return (
    <>
      {/* Background gradient that fades to transparent */}
      <div className="fixed top-0 left-0 right-0 z-40 h-20 bg-gradient-to-b from-background via-background/95 to-transparent pointer-events-none md:hidden" />
      {/* Header content */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 h-10 flex items-center md:hidden">
        <Link to="/" className="flex items-center gap-0.5">
          <Logo height={48} width={48} />
          <span className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 ml-[-12px]">
            commbank.eth
          </span>
        </Link>
      </div>
      {/* Settings dropdown - only show when signed in */}
      {showSettingsWhenSignedIn && isSignedIn && (
        <div className="md:hidden">
          <SettingsDropdown />
        </div>
      )}
    </>
  );
}
