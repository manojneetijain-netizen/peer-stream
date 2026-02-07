import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Zap, Layers, Smartphone } from "lucide-react";

const cards = [
  { icon: Layers, title: "Feed", desc: "Infinite scroll, real-time updates" },
  { icon: Zap, title: "Chat", desc: "Zero-latency messaging" },
  { icon: Smartphone, title: "Profiles", desc: "Rich identity system" },
];

const ArchitectureSection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="relative py-32 overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pulse-blue/5 rounded-full blur-3xl pointer-events-none" />

      <div ref={ref} className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-xl"
        >
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground">
            Built from the ground up for{" "}
            <span className="gradient-text">speed.</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Modular architecture. Instant rendering. Fluid interactions across every device.
          </p>
        </motion.div>

        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 40, rotateX: 10 }}
              animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
              className="group glass rounded-2xl p-8 hover:border-pulse-blue/30 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pulse-blue/20 to-pulse-cyan/10 flex items-center justify-center mb-6">
                <card.icon className="w-6 h-6 text-pulse-cyan" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">{card.title}</h3>
              <p className="mt-2 text-muted-foreground text-sm">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
