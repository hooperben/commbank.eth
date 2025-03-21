"use client";

import { Button } from "@/components/ui/button";
import { Home, Users, Settings, LucideIcon } from "lucide-react";
import Link from "next/link";

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
    href: "/accounts",
    icon: Users,
    label: "My Account",
  },
  {
    href: "/settings",
    icon: Settings,
    label: "Settings",
  },
];

const SideBarContent = () => {
  return (
    <div className="flex-1 overflow-auto py-2">
      <nav className="grid items-start px-4 text-sm font-medium">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
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
