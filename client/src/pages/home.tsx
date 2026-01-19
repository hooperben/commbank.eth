import { BrowserNotSupportedWarning } from "@/_components/status/browser-not-supported-warning";
import { Logo } from "@/_components/logo";
import PageContainer from "@/_providers/page-container";
import { Button } from "@/_components/ui/button";
import { useDeviceCompatible } from "@/_hooks/use-device-compatible";
import { PAGE_METADATA } from "@/_constants/seo-config";
import { Link } from "react-router-dom";
import { AuthButton } from "@/_components/auth/auth-button";

export const HomePage = () => {
  const { isPasskeySupported, isDBSupported } = useDeviceCompatible();
  const isBrowserSupported = isPasskeySupported && isDBSupported;

  return (
    <PageContainer {...PAGE_METADATA.home}>
      <div className="transform transition-all duration-1000 delay-300 flex w-full justify-center ml-4">
        <Logo height={400} width={400} />
      </div>
      <h1 className="text-5xl md:text-7xl font-bold tracking-tighter transform transition-all duration-1000 delay-500">
        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
          commbank.eth
        </span>
      </h1>

      <div className="mb-6 text-muted-foreground">
        <p className="text-sm">
          open source, privacy enhancing financial technologies
        </p>
      </div>

      <BrowserNotSupportedWarning />

      <div className="flex flex-row gap-2 justify-center">
        <Button size="lg" variant={"outline"} asChild>
          <Link to="/about">Learn more</Link>
        </Button>

        {isBrowserSupported && <AuthButton />}
      </div>
    </PageContainer>
  );
};
