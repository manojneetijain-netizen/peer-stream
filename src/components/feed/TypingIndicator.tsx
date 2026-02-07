import { motion } from "framer-motion";

const TypingIndicator = () => (
  <div className="flex items-center gap-1.5 px-4 py-2">
    <div className="flex gap-1 bg-secondary/60 rounded-2xl px-3 py-2">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
          animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
    <span className="text-xs text-muted-foreground">typing…</span>
  </div>
);

export default TypingIndicator;
