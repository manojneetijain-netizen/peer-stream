import { useState, useRef, useEffect, useCallback } from "react";
import { Navigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, Grid3X3, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useReels } from "@/hooks/useReels";
import ReelCard from "@/components/reels/ReelCard";
import ReelThumbnail from "@/components/reels/ReelThumbnail";
import ReelUploader from "@/components/reels/ReelUploader";

const Reels = () => {
  const { user, loading } = useAuth();
  const { reels, loading: reelsLoading, refetch } = useReels(user?.id);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "fullscreen">("grid");
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

  const openReel = (index: number) => {
    setActiveIndex(index);
    setViewMode("fullscreen");
  };

  // Scroll to selected reel when entering fullscreen
  useEffect(() => {
    if (viewMode !== "fullscreen" || !containerRef.current) return;
    const el = containerRef.current;
    const height = el.clientHeight;
    el.scrollTo({ top: height * activeIndex, behavior: "instant" });
  }, [viewMode]);

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
        {viewMode === "fullscreen" ? (
          <button
            onClick={() => setViewMode("grid")}
            className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white"
          >
            <Grid3X3 className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-9" />
        )}
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
      ) : viewMode === "grid" ? (
        /* Grid Browse View */
        <div className="h-full overflow-y-auto pt-16 pb-20 px-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {reels.map((reel, index) => (
              <motion.div
                key={reel.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
              >
                <ReelThumbnail
                  videoUrl={reel.video_url}
                  onClick={() => openReel(index)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        /* Fullscreen Swipe View */
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
