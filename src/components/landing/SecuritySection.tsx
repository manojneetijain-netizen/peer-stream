import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, Lock, Eye } from "lucide-react";

const features = [
  { icon: Lock, title: "End-to-end encryption", desc: "Messages and data protected in transit and at rest." },
  { icon: Eye, title: "Granular controls", desc: "Decide exactly who sees what, always." },
  { icon: Shield, title: "Your data, your rules", desc: "No selling data. No surveillance. Ever." },
];

const SecuritySection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="security" className="relative py-32 overflow-hidden">
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-pulse-cyan/5 rounded-full blur-3xl pointer-events-none" />

      <div ref={ref} className="max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground">
            Private by <span className="gradient-text">design.</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-lg mx-auto">
            Security isn't an afterthought. It's the foundation everything is built upon.
          </p>
        </motion.div>

        <div className="mt-16 grid md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
              className="glass rounded-2xl p-8 text-left group hover:border-pulse-cyan/30 transition-all duration-300"
            >
              <motion.div
                animate={inView ? { rotateY: [0, 360] } : {}}
                transition={{ duration: 1.5, delay: 0.5 + i * 0.2 }}
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-pulse-cyan/20 to-pulse-blue/10 flex items-center justify-center mb-6"
              >
                <Icon className="w-7 h-7 text-pulse-cyan" />
              </motion.div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SecuritySection;
