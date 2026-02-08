import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Sunrise } from "lucide-react";
import { useTheme, type Theme } from "@/hooks/useTheme";

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

const themeConfig: Record<Theme, { icon: typeof Sun; label: string; next: string; hoverColor: string }> = {
  dark: { icon: Sun, label: "Light mode", next: "light", hoverColor: "group-hover:text-amber-400" },
  light: { icon: Sunrise, label: "Warm mode", next: "warm", hoverColor: "group-hover:text-orange-400" },
  warm: { icon: Moon, label: "Dark mode", next: "dark", hoverColor: "group-hover:text-indigo-400" },
};

const ThemeToggle = ({ showLabel = true, className = "" }: ThemeToggleProps) => {
  const { theme, cycleTheme } = useTheme();
  const config = themeConfig[theme];
  const Icon = config.icon;

  return (
    <button
      onClick={cycleTheme}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-300 group ${className}`}
    >
      <div className="relative w-5 h-5 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            initial={{ rotate: -90, scale: 0, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <Icon className={`w-5 h-5 ${config.hoverColor} transition-colors`} />
          </motion.div>
        </AnimatePresence>
      </div>
      {showLabel && (
        <AnimatePresence mode="wait">
          <motion.span
            key={theme}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            transition={{ duration: 0.2 }}
          >
            {config.label}
          </motion.span>
        </AnimatePresence>
      )}
    </button>
  );
};

export default ThemeToggle;
