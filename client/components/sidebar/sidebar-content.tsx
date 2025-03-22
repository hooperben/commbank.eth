"use client";

import { Button } from "@/components/ui/button";
import { Home, Users, LucideIcon, LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isPasskeyRegistered, getRegisteredUsername } from "@/lib/passkey";

// Define navigation item type
type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const navItems: NavItem[] = [
  {
    href: "/",
    icon: Home,
    label: "Dashboard",
  },
  {
    href: "/home",
    icon: Users,
    label: "My Account",
  },
];

const SideBarContent = () => {
  const pathname = usePathname();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is signed in (has a registered passkey)
    const checkAuth = () => {
      const isRegistered = isPasskeyRegistered();
      setIsSignedIn(isRegistered);
      setUsername(isRegistered ? getRegisteredUsername() : null);
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);
    window.addEventListener("auth-change", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("auth-change", checkAuth);
    };
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("passkeyCredentialId");
    localStorage.removeItem("passkeyUsername");
    setIsSignedIn(false);
    setUsername(null);
    window.dispatchEvent(new Event("auth-change"));
  };

  return (
    <div className="flex-1 overflow-auto py-2">
      <nav className="grid items-start px-4 text-sm font-medium">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant={pathname === item.href ? "default" : "ghost"}
            size="sm"
            className="justify-start gap-2"
            asChild
          >
            <Link href={item.href}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
    </div>
  );
};

export default SideBarContent;

// ba73fa0ba74895597b6bf3e482187b3e59b87822db3ea464354c400e0a468799
