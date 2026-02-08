import { useState, useEffect } from "react";

export type Theme = "dark" | "light" | "warm";

const THEME_CLASSES: Theme[] = ["dark", "light", "warm"];

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("pulse-theme") as Theme) || "dark";
    }
    return "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes, then add the current one (dark has no class)
    THEME_CLASSES.forEach((t) => root.classList.remove(t));
    if (theme !== "dark") {
      root.classList.add(theme);
    }
    localStorage.setItem("pulse-theme", theme);
  }, [theme]);

  const cycleTheme = () =>
    setTheme((t) => {
      const idx = THEME_CLASSES.indexOf(t);
      return THEME_CLASSES[(idx + 1) % THEME_CLASSES.length];
    });

  return { theme, setTheme, cycleTheme };
}
