import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedPostProps {
  children: ReactNode;
  index: number;
}

const AnimatedPost = ({ children, index }: AnimatedPostProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3), ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPost;
