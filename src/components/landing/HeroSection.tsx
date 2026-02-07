import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import PhoneMockup from "./PhoneMockup";

const HeroSection = () => {
  return (
    <section id="overview" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-pulse-blue/10 to-pulse-cyan/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-16 pt-24">
        {/* Copy */}
        <div className="flex-1 text-center lg:text-left">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-bold tracking-tighter gradient-text leading-none"
          >
            Pulse
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-4 text-2xl md:text-3xl font-light text-foreground/90 tracking-tight"
          >
            Connect. Instantly.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-4 text-lg text-muted-foreground max-w-md mx-auto lg:mx-0"
          >
            The next generation of real-time social experiences.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
          >
            <Link
              to="/auth"
              className="inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-medium bg-gradient-to-r from-pulse-blue to-pulse-cyan text-foreground hover:opacity-90 transition-opacity"
            >
              Get Pulse
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-medium gradient-border text-foreground hover:bg-secondary/50 transition-colors"
            >
              See Features
            </a>
          </motion.div>
        </div>

        {/* Phone */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="flex-shrink-0"
        >
          <div className="animate-float">
            <PhoneMockup />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
