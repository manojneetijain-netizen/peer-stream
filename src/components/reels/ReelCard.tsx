import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, Music2, Play, Volume2, VolumeX, Bookmark, UserPlus, UserCheck } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Reel } from "@/hooks/useReels";
import ReelCommentsSheet from "./ReelCommentsSheet";

interface ReelCardProps {
  reel: Reel;
  isActive: boolean;
  currentUserId?: string;
  onUpdate?: () => void;
}

const ReelCard = ({ reel, isActive, currentUserId, onUpdate }: ReelCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState(reel.user_has_liked);
  const [likesCount, setLikesCount] = useState(reel.likes_count);
  const [showHeart, setShowHeart] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [progress, setProgress] = useState(0);

  // Check follow & bookmark status
  useEffect(() => {
    if (!currentUserId || currentUserId === reel.user_id) return;
    supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUserId)
      .eq("following_id", reel.user_id)
      .maybeSingle()
      .then(({ data }) => setFollowing(!!data));
  }, [currentUserId, reel.user_id]);

  useEffect(() => {
    if (!currentUserId) return;
    supabase
      .from("bookmarks")
      .select("id")
      .eq("user_id", currentUserId)
      .eq("post_id", reel.id)
      .maybeSingle()
      .then(({ data }) => setBookmarked(!!data));
  }, [currentUserId, reel.id]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setPaused(false);
    } else {
      videoRef.current.pause();
    }
  }, [isActive]);

  // Progress bar
  useEffect(() => {
    if (!videoRef.current || !isActive) return;
    const video = videoRef.current;
    const update = () => {
      if (video.duration) setProgress((video.currentTime / video.duration) * 100);
      if (isActive && !video.paused) requestAnimationFrame(update);
    };
    video.addEventListener("play", () => requestAnimationFrame(update));
    return () => {};
  }, [isActive]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPaused(false);
    } else {
      videoRef.current.pause();
      setPaused(true);
    }
  };

  const handleDoubleTap = async () => {
    if (!currentUserId) return;
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 800);
    if (!liked) {
      setLiked(true);
      setLikesCount((c) => c + 1);
      await supabase.from("likes").insert({ user_id: currentUserId, post_id: reel.id });
    }
  };

  const toggleLike = async () => {
    if (!currentUserId) return;
    if (liked) {
      setLiked(false);
      setLikesCount((c) => c - 1);
      await supabase.from("likes").delete().eq("user_id", currentUserId).eq("post_id", reel.id);
    } else {
      setLiked(true);
      setLikesCount((c) => c + 1);
      await supabase.from("likes").insert({ user_id: currentUserId, post_id: reel.id });
    }
  };

  const toggleBookmark = async () => {
    if (!currentUserId) return;
    if (bookmarked) {
      setBookmarked(false);
      await supabase.from("bookmarks").delete().eq("user_id", currentUserId).eq("post_id", reel.id);
      toast.success("Removed from saved");
    } else {
      setBookmarked(true);
      await supabase.from("bookmarks").insert({ user_id: currentUserId, post_id: reel.id });
      toast.success("Saved!");
    }
  };

  const toggleFollow = async () => {
    if (!currentUserId || currentUserId === reel.user_id) return;
    if (following) {
      setFollowing(false);
      await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", reel.user_id);
      toast.success("Unfollowed");
    } else {
      setFollowing(true);
      await supabase.from("follows").insert({ follower_id: currentUserId, following_id: reel.user_id });
      toast.success("Following!");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin + `/reels?id=${reel.id}`);
      toast.success("Link copied!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const initials = (reel.profiles?.display_name || reel.profiles?.username || "?").slice(0, 2).toUpperCase();

  return (
    <div className="relative w-full h-full bg-black snap-start snap-always flex items-center justify-center">
      {/* Video */}
      <video
        ref={videoRef}
        src={reel.video_url}
        className="absolute inset-0 w-full h-full object-contain"
        loop
        muted={muted}
        playsInline
        onClick={togglePlay}
        onDoubleClick={handleDoubleTap}
      />

      {/* Progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 z-30 bg-white/10">
        <motion.div
          className="h-full bg-white/70 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Double-tap heart */}
      <AnimatePresence>
        {showHeart && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.4, opacity: 1 }}
            exit={{ scale: 1.8, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
          >
            <Heart className="w-24 h-24 text-red-500 fill-red-500 drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pause indicator */}
      <AnimatePresence>
        {paused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
          >
            <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right side actions */}
      <div className="absolute right-3 bottom-28 flex flex-col items-center gap-5 z-20">
        {/* Like */}
        <button onClick={toggleLike} className="flex flex-col items-center gap-1">
          <motion.div whileTap={{ scale: 1.4 }}>
            <Heart className={`w-7 h-7 drop-shadow-lg transition-colors ${liked ? "text-red-500 fill-red-500" : "text-white"}`} />
          </motion.div>
          <span className="text-white text-xs font-semibold drop-shadow">{likesCount}</span>
        </button>

        {/* Comment */}
        <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1">
          <MessageCircle className="w-7 h-7 text-white drop-shadow-lg" />
          <span className="text-white text-xs font-semibold drop-shadow">{reel.comments_count}</span>
        </button>

        {/* Share */}
        <button onClick={handleShare} className="flex flex-col items-center gap-1">
          <Share2 className="w-7 h-7 text-white drop-shadow-lg" />
        </button>

        {/* Bookmark */}
        <button onClick={toggleBookmark} className="flex flex-col items-center gap-1">
          <Bookmark className={`w-7 h-7 drop-shadow-lg transition-colors ${bookmarked ? "text-yellow-400 fill-yellow-400" : "text-white"}`} />
        </button>

        {/* Mute toggle */}
        <button onClick={() => setMuted(!muted)}>
          {muted ? (
            <VolumeX className="w-6 h-6 text-white/70 drop-shadow-lg" />
          ) : (
            <Volume2 className="w-6 h-6 text-white/70 drop-shadow-lg" />
          )}
        </button>

        {/* Music disc */}
        <motion.div
          animate={isActive && !paused ? { rotate: 360 } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-800 to-gray-600 border-2 border-white/20 flex items-center justify-center"
        >
          <Music2 className="w-4 h-4 text-white" />
        </motion.div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-6 left-4 right-16 z-20">
        <div className="flex items-center gap-2 mb-2">
          <Link to={`/profile/${reel.user_id}`} className="flex items-center gap-2">
            <Avatar className="w-9 h-9 ring-2 ring-white/40">
              <AvatarImage src={reel.profiles?.avatar_url || undefined} />
              <AvatarFallback className="bg-gray-700 text-white text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-white font-semibold text-sm drop-shadow-lg">
              {reel.profiles?.display_name || reel.profiles?.username || "User"}
            </span>
            {reel.profiles?.is_verified && (
              <span className="text-blue-400 text-xs">✓</span>
            )}
          </Link>
          {/* Follow button */}
          {currentUserId && currentUserId !== reel.user_id && (
            <button
              onClick={toggleFollow}
              className={`ml-1 px-3 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                following
                  ? "border-white/30 text-white/70"
                  : "border-white bg-white text-black"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
          )}
        </div>
        {reel.content && (
          <p className="text-white/90 text-sm drop-shadow-lg line-clamp-2">{reel.content}</p>
        )}
      </div>

      {/* Top gradient */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/40 to-transparent pointer-events-none z-10" />
      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-10" />

      {/* Comments sheet */}
      <ReelCommentsSheet
        open={showComments}
        onClose={() => setShowComments(false)}
        postId={reel.id}
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default ReelCard;
