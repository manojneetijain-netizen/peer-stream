import { motion } from "framer-motion";
import { Sun, Moon, Sunrise } from "lucide-react";
import { useTheme, type Theme } from "@/hooks/useTheme";

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

const themes: { key: Theme; icon: typeof Sun; label: string }[] = [
  { key: "light", icon: Sun, label: "Light" },
  { key: "dark", icon: Moon, label: "Dark" },
  { key: "warm", icon: Sunrise, label: "Warm" },
];

const ThemeToggle = ({ showLabel = true, className = "" }: ThemeToggleProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-xl bg-secondary/40 border border-border/30 ${className}`}>
      {themes.map(({ key, icon: Icon, label }) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          className={`relative flex items-center justify-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-200 ${
            theme === key
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {theme === key && (
            <motion.div
              layoutId="themeTogglePill"
              className="absolute inset-0 bg-primary/15 border border-primary/20 rounded-lg"
              transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
            />
          )}
          <Icon className={`w-3.5 h-3.5 relative z-10 shrink-0 ${theme === key ? "text-primary" : ""}`} />
          {showLabel && <span className="relative z-10 hidden sm:inline">{label}</span>}
        </button>
      ))}
    </div>
  );
};

export default ThemeToggle;
