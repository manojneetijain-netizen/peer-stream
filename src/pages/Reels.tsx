import { useState, useRef, useEffect, useCallback } from "react";
import { Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useReels } from "@/hooks/useReels";
import ReelCard from "@/components/reels/ReelCard";
import ReelUploader from "@/components/reels/ReelUploader";

const Reels = () => {
  const { user, loading } = useAuth();
  const { reels, loading: reelsLoading, refetch } = useReels(user?.id);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const index = Math.round(scrollTop / height);
    setActiveIndex(index);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="fixed inset-0 bg-black z-50">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 safe-area-top">
        <Link to="/feed" className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-white font-bold text-lg drop-shadow">Reels</h1>
        <div className="w-9" /> {/* spacer */}
      </div>

      {reelsLoading ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      ) : reels.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-white text-center px-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-3"
          >
            <p className="text-5xl">🎬</p>
            <h2 className="text-xl font-bold">No Reels Yet</h2>
            <p className="text-white/60 text-sm">Be the first to create a reel!</p>
          </motion.div>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="h-full w-full overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
        >
          {reels.map((reel, index) => (
            <div key={reel.id} className="h-full w-full">
              <ReelCard
                reel={reel}
                isActive={index === activeIndex}
                currentUserId={user.id}
                onUpdate={refetch}
              />
            </div>
          ))}
        </div>
      )}

      {/* Upload FAB */}
      <ReelUploader userId={user.id} onCreated={refetch} />
    </div>
  );
};

export default Reels;
