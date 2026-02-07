import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";

const CTASection = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative py-40 overflow-hidden">
      {/* Large glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-gradient-to-r from-pulse-blue/10 to-pulse-cyan/10 rounded-full blur-3xl pointer-events-none" />

      <div ref={ref} className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground"
        >
          The future of social{" "}
          <span className="gradient-text">starts now.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-6 text-xl text-muted-foreground"
        >
          Fast. Intelligent. Private.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            to="/auth"
            className="inline-flex items-center justify-center rounded-full px-10 py-4 text-base font-medium bg-gradient-to-r from-pulse-blue to-pulse-cyan text-foreground hover:opacity-90 transition-opacity glow-blue"
          >
            Get Pulse
          </Link>
          <a
            href="#features"
            className="inline-flex items-center justify-center rounded-full px-10 py-4 text-base font-medium gradient-border text-foreground hover:bg-secondary/50 transition-colors"
          >
            See Features
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-8 text-sm text-muted-foreground"
        >
          Available on iOS, Android, and Web.
        </motion.p>
      </div>
    </section>
  );
};

export default CTASection;
