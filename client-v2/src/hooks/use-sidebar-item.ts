import { useAuth } from "@/lib/auth-context";
import { Home, Users, Settings } from "lucide-react";
import { useEffect, useState } from "react";

// Menu items
// TODO assign order as more pages are added
const MENU_BAR_ITEMS = [
  {
    href: "/",
    icon: Home,
    label: "Home",
    requireAuth: false,
    order: 0,
  },
  {
    href: "/account/",
    icon: Users,
    label: "Account",
    requireAuth: true,
    order: 1,
  },
  {
    href: "/settings/",
    icon: Settings,
    label: "Settings",
    requireAuth: true,
    order: 2,
  },
];

const authedMenuItems = MENU_BAR_ITEMS.filter((item) => item.requireAuth);
const publicMenuItems = MENU_BAR_ITEMS.filter((item) => !item.requireAuth);

export const useSideBarItems = () => {
  const { isSignedIn } = useAuth();

  const [menuItems, setMenuItems] = useState(authedMenuItems);

  useEffect(() => {
    if (isSignedIn) {
      setMenuItems([...publicMenuItems, ...authedMenuItems]);
    } else {
      setMenuItems(publicMenuItems);
    }
  }, [isSignedIn]);

  return menuItems;
};
