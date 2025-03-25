"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

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
      <RadioGroup
        value={theme}
        onValueChange={setTheme}
        className="flex items-center gap-2 rounded-md p-1"
      >
        <div className="flex items-center">
          <RadioGroupItem value="system" id="system" className="sr-only" />
          <label
            htmlFor="system"
            className={`flex p-2 rounded-md cursor-pointer ${
              theme === "system" ? "bg-primary" : "hover:bg-gray-800"
            }`}
          >
            <Monitor className="h-4 w-4 text-gray-200" />
          </label>
        </div>

        <div className="flex items-center">
          <RadioGroupItem value="light" id="light" className="sr-only" />
          <label
            htmlFor="light"
            className={`flex p-2 rounded-md cursor-pointer ${
              theme === "light" ? "bg-gray-100" : "hover:bg-primary/80"
            }`}
          >
            <Sun className="h-4 w-4 dark:text-gray-200 text-black" />
          </label>
        </div>

        <div className="flex items-center">
          <RadioGroupItem value="dark" id="dark" className="sr-only" />
          <label
            htmlFor="dark"
            className={`flex p-2 rounded-md cursor-pointer ${
              theme === "dark" ? "bg-primary/70" : "hover:bg-primary/80"
            }`}
          >
            <Moon className="h-4 w-4 text-gray-200" />
          </label>
        </div>
      </RadioGroup>
    </div>
  );
};

export default ThemeToggle;
