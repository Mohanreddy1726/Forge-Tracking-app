"use client";

import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Simple dark‑mode toggle component.
 * Stores the preference in localStorage and updates the <html> class.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Apply a theme class to <html>
  const apply = (t: "light" | "dark") => {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  // Initialise from storage or system preference
  useEffect(() => {
    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    if (stored) {
      setTheme(stored);
      apply(stored);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const init = prefersDark ? "dark" : "light";
      setTheme(init);
      apply(init);
    }
    // Listen for OS‑level changes when no explicit storage value
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem("theme")) {
        const newTheme = e.matches ? "dark" : "light";
        setTheme(newTheme);
        apply(newTheme);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    apply(next);
  };

  return (
    <button
      onClick={toggle}
      className="flex size-9 items-center justify-center rounded-full border border-border bg-background/60 hover:bg-background"
      aria-label="Toggle dark mode"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
