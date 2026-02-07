import { motion } from "framer-motion";

interface OnlineIndicatorProps {
  isOnline: boolean;
  size?: "sm" | "md";
  className?: string;
}

const OnlineIndicator = ({ isOnline, size = "sm", className = "" }: OnlineIndicatorProps) => {
  if (!isOnline) return null;

  const sizeClasses = size === "sm" ? "w-2.5 h-2.5" : "w-3.5 h-3.5";

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`absolute bottom-0 right-0 ${sizeClasses} rounded-full bg-emerald-400 border-2 border-background ${className}`}
    >
      <motion.span
        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 rounded-full bg-emerald-400"
      />
    </motion.span>
  );
};

export default OnlineIndicator;
