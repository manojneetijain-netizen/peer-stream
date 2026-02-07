import { motion } from "framer-motion";

const PhoneMockup = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Glow behind phone */}
      <div className="absolute inset-0 -z-10 blur-3xl opacity-40 bg-gradient-to-br from-pulse-blue to-pulse-cyan rounded-full scale-75" />

      {/* Phone frame */}
      <div className="relative w-[280px] h-[580px] rounded-[40px] gradient-border bg-card overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-background rounded-b-2xl z-10" />

        {/* Screen content */}
        <div className="p-4 pt-10 h-full flex flex-col gap-3">
          {/* Status bar */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground px-2">
            <span>9:41</span>
            <div className="flex gap-1">
              <div className="w-4 h-2 rounded-sm bg-muted-foreground/40" />
              <div className="w-4 h-2 rounded-sm bg-muted-foreground/40" />
              <div className="w-4 h-2 rounded-sm bg-muted-foreground/40" />
            </div>
          </div>

          {/* App header */}
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-bold gradient-text">Pulse</span>
            <div className="w-6 h-6 rounded-full bg-secondary" />
          </div>

          {/* Story row */}
          <div className="flex gap-3 py-2">
            {[1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                className="w-12 h-12 rounded-full gradient-border bg-secondary shrink-0"
              />
            ))}
          </div>

          {/* Post cards */}
          {[1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
              className="rounded-xl bg-secondary/50 p-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-muted" />
                <div className="space-y-1">
                  <div className="w-16 h-2 rounded bg-muted" />
                  <div className="w-10 h-1.5 rounded bg-muted/50" />
                </div>
              </div>
              <div className="w-full h-24 rounded-lg bg-muted/30" />
              <div className="flex gap-4">
                <div className="w-5 h-5 rounded bg-muted/40" />
                <div className="w-5 h-5 rounded bg-muted/40" />
                <div className="w-5 h-5 rounded bg-muted/40" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PhoneMockup;
