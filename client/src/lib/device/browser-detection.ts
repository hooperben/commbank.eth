// Detect if user is on mobile device
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

// Detect if user is in an in-app browser
export function isInAppBrowser(): boolean {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent || navigator.vendor;

  // Facebook
  if (ua.includes("FBAN") || ua.includes("FBAV")) {
    return true;
  }

  // Instagram
  if (ua.includes("Instagram")) {
    return true;
  }

  // X/Twitter
  if (ua.includes("Twitter")) {
    return true;
  }

  // LinkedIn
  if (ua.includes("LinkedInApp")) {
    return true;
  }

  // TikTok
  if (ua.includes("BytedanceWebview") || ua.includes("musical_ly")) {
    return true;
  }

  // Snapchat
  if (ua.includes("Snapchat")) {
    return true;
  }

  // Line
  if (ua.includes("Line")) {
    return true;
  }

  // WeChat
  if (ua.includes("MicroMessenger")) {
    return true;
  }

  return false;
}

// Get the name of the in-app browser
export function getInAppBrowserName(): string | null {
  if (typeof window === "undefined") return null;

  const ua = navigator.userAgent || navigator.vendor;

  if (ua.includes("FBAN") || ua.includes("FBAV")) return "Facebook";
  if (ua.includes("Instagram")) return "Instagram";
  if (ua.includes("Twitter")) return "X (Twitter)";
  if (ua.includes("LinkedInApp")) return "LinkedIn";
  if (ua.includes("BytedanceWebview") || ua.includes("musical_ly"))
    return "TikTok";
  if (ua.includes("Snapchat")) return "Snapchat";
  if (ua.includes("Line")) return "Line";
  if (ua.includes("MicroMessenger")) return "WeChat";

  return null;
}

// Check if user should see the warning banner
export function shouldShowInAppBrowserWarning(): boolean {
  return isMobileDevice() && isInAppBrowser();
}
