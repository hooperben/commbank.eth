import { Banner, BannerDescription, BannerTitle } from "@/components/ui/banner";
import {
  getInAppBrowserName,
  shouldShowInAppBrowserWarning,
} from "@/lib/device/browser-detection";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export function InAppBrowserWarning() {
  const [shouldShow, setShouldShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [browserName, setBrowserName] = useState<string | null>(null);

  useEffect(() => {
    // Check if user previously dismissed this warning
    const wasDismissed =
      localStorage.getItem("inAppBrowserWarningDismissed") === "true";

    if (!wasDismissed && shouldShowInAppBrowserWarning()) {
      setShouldShow(true);
      setBrowserName(getInAppBrowserName());
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("inAppBrowserWarningDismissed", "true");
  };

  if (!shouldShow || dismissed) {
    return null;
  }

  const instructions = getOpenInBrowserInstructions(browserName);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] p-3">
      <Banner variant="warning" dismissible onDismiss={handleDismiss}>
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <div>
          <BannerTitle>
            Re-open in commbank.eth in your external browser
          </BannerTitle>
          <BannerDescription>
            <p className="mb-2">
              You're viewing this web app within{" "}
              {browserName || "an in-app browser"}. commbank.eth stores all of
              your account information in your web browser, so it works best in
              dedicated browsers like chrome, safari or firefox.
            </p>
            <div className="mt-3 flex align-top gap-2 text-xs opacity-75">
              <p className="font-medium">{instructions}</p>
            </div>
          </BannerDescription>
        </div>
      </Banner>
    </div>
  );
}

function getOpenInBrowserInstructions(browserName: string | null): string {
  switch (browserName) {
    case "Facebook":
      return "Tap the three dots (⋯) menu and select 'Open in Safari' or 'Open in Browser'.";
    case "Instagram":
      return "Tap the three dots (⋯) menu at the top right and select 'Open in Browser'.";
    case "X (Twitter)":
      return "Tap the Share icon and select 'Open in Safari' or 'Open in Browser'.";
    case "TikTok":
      return "Tap the three dots (⋯) menu and select 'Open in Browser'.";
    case "Snapchat":
      return "Tap and hold the link, then select 'Open in Safari'.";
    case "LinkedIn":
      return "Tap the three dots (⋯) menu and select 'Open in external browser'.";
    default:
      return "Look for an option to open this page in your default browser (Safari, Chrome, etc).";
  }
}
