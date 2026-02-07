import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Sparkles, TrendingUp, Users } from "lucide-react";

const nodes = [
  { label: "For You", x: 10, y: 20 },
  { label: "Trending", x: 60, y: 10 },
  { label: "Friends", x: 35, y: 55 },
  { label: "Discover", x: 75, y: 50 },
  { label: "Topics", x: 20, y: 80 },
];

const AISection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="technology" className="relative py-32 overflow-hidden">
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-pulse-blue/5 rounded-full blur-3xl pointer-events-none" />

      <div ref={ref} className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
        {/* Copy */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="flex-1"
        >
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground">
            Intelligence behind{" "}
            <span className="gradient-text">every interaction.</span>
          </h2>
          <div className="mt-6 space-y-2 text-lg text-muted-foreground">
            <p>AI-curated feeds tailored to you.</p>
            <p>Smarter discovery.</p>
            <p>Meaningful connections, not noise.</p>
          </div>

          <div className="mt-10 flex gap-6">
            {[
              { icon: Sparkles, label: "AI Curation" },
              { icon: TrendingUp, label: "Smart Trends" },
              { icon: Users, label: "Deep Matching" },
            ].map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Icon className="w-4 h-4 text-pulse-cyan" />
                {label}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Neural graph */}
        <div className="flex-1 relative h-[400px]">
          {nodes.map((node, i) => (
            <motion.div
              key={node.label}
              initial={{ opacity: 0, scale: 0 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
              style={{ position: "absolute", left: `${node.x}%`, top: `${node.y}%` }}
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, delay: i * 0.4, repeat: Infinity }}
                className="glass rounded-xl px-4 py-2 text-xs font-medium text-foreground glow-blue"
              >
                {node.label}
              </motion.div>
            </motion.div>
          ))}

          {/* Connection lines (SVG) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {[
              [0, 1], [1, 3], [0, 2], [2, 3], [2, 4],
            ].map(([a, b], i) => (
              <motion.line
                key={i}
                x1={`${nodes[a].x + 5}%`}
                y1={`${nodes[a].y + 2}%`}
                x2={`${nodes[b].x + 5}%`}
                y2={`${nodes[b].y + 2}%`}
                stroke="hsl(222 100% 50%)"
                strokeOpacity={0.15}
                strokeWidth={1}
                initial={{ pathLength: 0 }}
                animate={inView ? { pathLength: 1 } : {}}
                transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
              />
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
};

export default AISection;
