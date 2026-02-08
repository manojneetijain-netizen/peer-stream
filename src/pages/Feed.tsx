import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useFeed } from "@/hooks/useFeed";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useBlockMute } from "@/hooks/useBlockMute";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { usePresence } from "@/hooks/usePresence";
import { useMouseParallax } from "@/hooks/useMouseParallax";
import { supabase } from "@/integrations/supabase/client";
import PostCard from "@/components/feed/PostCard";
import StoriesBar from "@/components/feed/StoriesBar";
import NotificationBell from "@/components/feed/NotificationBell";
import MessagesPage from "@/components/feed/MessagesPage";
import FeedSidebar from "@/components/feed/FeedSidebar";
import RightSidebar from "@/components/feed/RightSidebar";
import AnimatedPost from "@/components/feed/AnimatedPost";
import MobileBottomNav from "@/components/feed/MobileBottomNav";
import PullToRefresh from "@/components/feed/PullToRefresh";
import GradientBackground from "@/components/feed/GradientBackground";
import FloatingComposer from "@/components/feed/FloatingComposer";
import { Compass, Users, Loader2 } from "lucide-react";

type FeedTab = "following" | "discover";

const Feed = () => {
  const { user, loading, signOut } = useAuth();
  const [tab, setTab] = useState<FeedTab>("discover");
  const { posts, loading: feedLoading, loadingMore, hasMore, loadMore, refetch } = useFeed(user?.id, tab);
  const sentinelRef = useInfiniteScroll(loadMore, hasMore && !loadingMore);
  const [showMessages, setShowMessages] = useState(false);
  const { isBlocked, isMuted, blockUser, unblockUser, muteUser, unmuteUser } = useBlockMute(user?.id);
  const [profile, setProfile] = useState<any>(null);
  const { isOnline, isTypingTo, setTyping } = usePresence(user?.id);
  const { mouseX, mouseY } = useMouseParallax();

  usePushNotifications(user?.id);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("display_name, username, avatar_url")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => setProfile(data));
  }, [user?.id]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const filteredPosts = posts.filter((p) => !isBlocked(p.user_id) && !isMuted(p.user_id));

  if (showMessages) {
    return (
      <div className="min-h-screen bg-background flex">
        <GradientBackground />
        <FeedSidebar currentUserId={user.id} onMessagesClick={() => setShowMessages(false)} profile={profile} />
        <main className="flex-1 max-w-2xl mx-auto">
          <MessagesPage currentUserId={user.id} onBack={() => setShowMessages(false)} isOnline={isOnline} isTypingTo={isTypingTo} setTyping={setTyping} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <GradientBackground />

      {/* Left Sidebar — parallax island */}
      <div className="hidden lg:block">
        <motion.div style={{ x: mouseX * 3, y: mouseY * 3 }}>
          <div className="sticky top-0 h-screen py-4 pl-4">
            <div className="island-sidebar h-full">
              <FeedSidebar currentUserId={user.id} onMessagesClick={() => setShowMessages(true)} profile={profile} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-surface">
        <div className="px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold gradient-text">Pulse</span>
          <div className="flex items-center gap-1">
            <NotificationBell currentUserId={user.id} />
          </div>
        </div>
      </div>

      {/* Center Feed — floating islands */}
      <main className="flex-1 min-w-0">
        <PullToRefresh onRefresh={refetch}>
          <div className="max-w-[680px] mx-auto px-4 py-6 lg:py-6 space-y-7 lg:mt-0 mt-14 pb-24 lg:pb-6">
            {/* Header with notification bell (desktop) */}
            <div className="hidden lg:flex items-center justify-between mb-2">
              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-bold text-foreground"
              >
                Home
              </motion.h2>
              <NotificationBell currentUserId={user.id} />
            </div>

            <StoriesBar currentUserId={user.id} />

            {/* Feed tabs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex rounded-3xl overflow-hidden island-card !p-0"
            >
              {([
                { key: "discover" as FeedTab, label: "Discover", icon: Compass },
                { key: "following" as FeedTab, label: "Following", icon: Users },
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-all duration-300 relative ${
                    tab === key
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-transform duration-200 ${tab === key ? "scale-110" : ""}`} />
                  {label}
                  {tab === key && (
                    <motion.div
                      layoutId="feedTab"
                      className="absolute inset-0 bg-gradient-to-r from-pulse-blue/20 to-pulse-cyan/20 rounded-3xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                </button>
              ))}
            </motion.div>

            {feedLoading ? (
              <div className="flex justify-center py-16">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-6 h-6 text-primary" />
                </motion.div>
              </div>
            ) : filteredPosts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="island-card p-8 text-center"
              >
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {tab === "following" ? "No posts from people you follow" : "Welcome to Pulse 🎉"}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {tab === "following"
                    ? "Follow some people to see their posts here!"
                    : "No posts yet. Be the first to share something!"}
                </p>
              </motion.div>
            ) : (
              <>
                {filteredPosts.map((post, index) => (
                  <AnimatedPost key={post.id} index={index}>
                    <PostCard
                      post={post}
                      currentUserId={user.id}
                      onUpdate={refetch}
                      isBlocked={isBlocked(post.user_id)}
                      isMuted={isMuted(post.user_id)}
                      onBlock={() => blockUser(post.user_id)}
                      onUnblock={() => unblockUser(post.user_id)}
                      onMute={() => muteUser(post.user_id)}
                      onUnmute={() => unmuteUser(post.user_id)}
                    />
                  </AnimatedPost>
                ))}
                <div ref={sentinelRef} className="h-1" />
                {loadingMore && (
                  <div className="flex justify-center py-4">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Loader2 className="w-5 h-5 text-muted-foreground" />
                    </motion.div>
                  </div>
                )}
                {!hasMore && filteredPosts.length > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-xs text-muted-foreground py-4"
                  >
                    You've seen it all ✨
                  </motion.p>
                )}
              </>
            )}
          </div>
        </PullToRefresh>
      </main>

      {/* Right Sidebar — parallax island */}
      <div className="hidden xl:block">
        <motion.div style={{ x: mouseX * -3, y: mouseY * 2 }}>
          <div className="sticky top-0 h-screen py-4 pr-4">
            <div className="island-sidebar h-full overflow-hidden">
              <RightSidebar currentUserId={user.id} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Composer Bubble */}
      <FloatingComposer userId={user.id} onCreated={refetch} />

      <MobileBottomNav onMessagesClick={() => setShowMessages(true)} />
    </div>
  );
};

export default Feed;
