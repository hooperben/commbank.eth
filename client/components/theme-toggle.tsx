"use client";

import { useEffect, useState } from "react";
import { Monitor, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
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
          <Monitor className="h-4 w-4 text-gray-200" />
        </Button>
        <Button
          onClick={() => setTheme("light")}
          className={`p-2 rounded-md ${
            theme === "light" ? "bg-gray-100" : "hover:bg-primary/80"
          }`}
          aria-label="Use light theme"
        >
          <Sun className="h-4 w-4 dark:text-gray-200 text-black" />
        </Button>
        <Button
          onClick={() => setTheme("dark")}
          className={`p-2 rounded-md ${
            theme === "dark" ? "bg-primary/70" : "hover:bg-primary/80"
          }`}
          aria-label="Use dark theme"
        >
          <Moon className="h-4 w-4 text-gray-200" />
        </Button>
      </div>
    </div>
  );
};

export default ThemeToggle;
