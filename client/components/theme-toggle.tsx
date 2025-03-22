"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 rounded-md p-1">
        <Button
          onClick={() => setTheme("system")}
          className={`p-2 rounded-md ${
            theme === "system" ? "bg-primary" : "hover:bg-gray-800"
          }`}
          aria-label="Use system theme"
        >
          <Monitor className="h-2 w-2 text-gray-200" />
        </Button>
        <Button
          onClick={() => setTheme("light")}
          className={`p-2 rounded-md ${
            theme === "light" ? "bg-gray-100" : "hover:bg-primary/80"
          }`}
          aria-label="Use light theme"
        >
          <Sun className="h-2 w-2 dark:text-gray-200 text-black" />
        </Button>
        <Button
          onClick={() => setTheme("dark")}
          className={`p-2 rounded-md ${
            theme === "dark" ? "bg-primary/70" : "hover:bg-primary/80"
          }`}
          aria-label="Use dark theme"
          size="icon"
        >
          <Moon className="h-2 w-2 text-gray-200" />
        </Button>
      </div>
    </div>
  );
};

export default ThemeToggle;
