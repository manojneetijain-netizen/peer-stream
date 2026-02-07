import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { MessageCircle, Heart, Bell } from "lucide-react";

const RealTimeSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute top-1/3 right-0 w-[600px] h-[600px] bg-pulse-cyan/5 rounded-full blur-3xl pointer-events-none" />

      <div ref={ref} className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
        {/* Animated elements */}
        <div className="flex-1 relative h-[400px] flex items-center justify-center">
          {/* Central node */}
          <motion.div
            animate={inView ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-pulse-blue to-pulse-cyan flex items-center justify-center glow-blue"
          >
            <Zap className="w-8 h-8 text-foreground" />
          </motion.div>

          {/* Orbiting elements */}
          {[
            { Icon: MessageCircle, angle: 0, delay: 0, dist: 130 },
            { Icon: Heart, angle: 120, delay: 0.5, dist: 130 },
            { Icon: Bell, angle: 240, delay: 1, dist: 130 },
          ].map(({ Icon, angle, delay, dist }, i) => {
            const x = Math.cos((angle * Math.PI) / 180) * dist;
            const y = Math.sin((angle * Math.PI) / 180) * dist;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.3 + delay }}
                style={{ position: "absolute", left: `calc(50% + ${x}px - 24px)`, top: `calc(50% + ${y}px - 24px)` }}
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, delay, repeat: Infinity }}
                  className="w-12 h-12 rounded-xl glass flex items-center justify-center glow-cyan"
                >
                  <Icon className="w-5 h-5 text-pulse-cyan" />
                </motion.div>
              </motion.div>
            );
          })}

          {/* Pulse rings */}
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              animate={inView ? { scale: [1, 2.5], opacity: [0.3, 0] } : {}}
              transition={{ duration: 3, delay: i * 0.8, repeat: Infinity }}
              className="absolute w-20 h-20 rounded-full border border-pulse-blue/30"
            />
          ))}
        </div>

        {/* Copy */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="flex-1 text-right"
        >
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground">
            Always live.{" "}
            <span className="gradient-text">Always connected.</span>
          </h2>
          <div className="mt-6 space-y-2 text-lg text-muted-foreground">
            <p>Real-time messaging and reactions.</p>
            <p>Zero-lag feeds.</p>
            <p>Moments shared the instant they happen.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Zap = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

export default RealTimeSection;
