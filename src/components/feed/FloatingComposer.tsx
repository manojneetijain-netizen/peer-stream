import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";
import CreatePost from "./CreatePost";

interface FloatingComposerProps {
  userId: string;
  onCreated: () => void;
}

const FloatingComposer = ({ userId, onCreated }: FloatingComposerProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Expanded composer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
            className="fixed bottom-24 right-6 z-[70] w-[min(420px,calc(100vw-3rem))]"
          >
            <div className="island-card p-0 overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-4 pb-0">
                <span className="text-sm font-semibold text-foreground">Create post</span>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <CreatePost
                userId={userId}
                onCreated={() => {
                  onCreated();
                  setOpen(false);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-20 lg:bottom-8 right-6 z-[65] w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-[0_8px_30px_hsl(var(--pulse-blue)/0.4)] flex items-center justify-center lg:hidden"
      >
        <motion.div animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <Plus className="w-6 h-6" />
        </motion.div>
      </motion.button>
    </>
  );
};

export default FloatingComposer;
