import { motion } from "framer-motion";
import { useMouseParallax } from "@/hooks/useMouseParallax";

const GradientBackground = () => {
  const { mouseX, mouseY } = useMouseParallax();

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-background" />

      {/* Radial glow orbs */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full opacity-[0.07]"
        style={{
          background: "radial-gradient(circle, hsl(var(--pulse-blue)) 0%, transparent 70%)",
          left: "20%",
          top: "10%",
          x: mouseX * 15,
          y: mouseY * 15,
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.05]"
        style={{
          background: "radial-gradient(circle, hsl(var(--pulse-cyan)) 0%, transparent 70%)",
          right: "10%",
          bottom: "20%",
          x: mouseX * -10,
          y: mouseY * -10,
        }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")", backgroundRepeat: "repeat" }} />
    </div>
  );
};

export default GradientBackground;
