import { useDeviceCompatible } from "@/hooks/use-device-compatible";
import { AlertCircle } from "lucide-react";

export const BrowserNotSupportedWarning = () => {
  const { isPasskeySupported, isDBSupported } = useDeviceCompatible();

  const isBrowserSupported = isPasskeySupported && isDBSupported;

  if (isBrowserSupported) return null;

  return (
    <div className="flex align-middle items-center gap-2 mb-4 p-4 rounded-lg bg-destructive/10 text-destructive max-w-xl">
      <div className="text-sm space-y-1">
        {!isPasskeySupported && (
          <>
            <p className="flex align-top justify-center gap-2">
              <AlertCircle className="size-5 shrink-0" />
              <strong>Passkeys are not supported in this browser.</strong>
            </p>
            <p>
              Please use another browser browser like Chrome, Safari, or Edge.
            </p>
          </>
        )}
        {!isDBSupported && (
          <p>
            <strong>IndexedDB not supported:</strong> Your browser must support
            IndexedDB to use commbank.eth.
          </p>
        )}
        <p className="text-xs opacity-90">
          commbank.eth requires both passkey functionality to secure your
          account within your browser.
        </p>
      </div>
    </div>
  );
};
