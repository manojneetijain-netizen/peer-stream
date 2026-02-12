import { useState, useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useProfileStats, useIsFollowing } from "@/hooks/useProfile";
import { useFollowRequestStatus } from "@/hooks/useFollowRequests";
import { supabase } from "@/integrations/supabase/client";
import { useFeed } from "@/hooks/useFeed";
import PostCard from "@/components/feed/PostCard";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileSettings from "@/components/profile/ProfileSettings";
import AnimatedPost from "@/components/feed/AnimatedPost";
import MobileBottomNav from "@/components/feed/MobileBottomNav";
import { ArrowLeft, Pin, LogOut, Lock } from "lucide-react";

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, loading: authLoading, signOut } = useAuth();
  const targetId = userId || user?.id;
  const isOwnProfile = targetId === user?.id;

  const { profile, loading, refetch } = useProfile(targetId);
  const stats = useProfileStats(targetId);
  const { isFollowing, toggle: toggleFollow, loading: followLoading } = useIsFollowing(user?.id, targetId);
  const { requestStatus, sendRequest, cancelRequest, loading: reqLoading } = useFollowRequestStatus(user?.id, targetId);
  const { posts, refetch: refetchPosts } = useFeed(user?.id, "discover");

  const [pinnedPostId, setPinnedPostId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"posts" | "settings">("posts");

  useEffect(() => {
    if (profile) {
      setPinnedPostId(profile.pinned_post_id || null);
    }
  }, [profile]);

  if (authLoading || loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const isPrivate = (profile as any)?.is_private === true;
  const canSeePosts = isOwnProfile || isFollowing || !isPrivate;

  const userPosts = posts.filter((p) => p.user_id === targetId);
  const pinnedPost = pinnedPostId ? userPosts.find((p) => p.id === pinnedPostId) : null;
  const otherPosts = userPosts.filter((p) => p.id !== pinnedPostId);

  const pinPost = async (postId: string) => {
    await supabase.from("profiles").update({ pinned_post_id: postId }).eq("user_id", user.id);
    setPinnedPostId(postId);
  };

  const unpinPost = async () => {
    await supabase.from("profiles").update({ pinned_post_id: null }).eq("user_id", user.id);
    setPinnedPostId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/feed" className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="text-lg font-bold gradient-text">
              {profile?.display_name || profile?.username || "Profile"}
            </span>
          </div>
          {isOwnProfile && (
            <button
              onClick={signOut}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-20 lg:pb-6 space-y-4">
        <ProfileHeader
          profile={profile}
          stats={stats}
          isOwnProfile={isOwnProfile}
          isFollowing={isFollowing}
          followLoading={followLoading}
          toggleFollow={toggleFollow}
          currentUserId={user.id}
          targetId={targetId!}
          refetch={refetch}
          followRequestStatus={requestStatus}
          onSendFollowRequest={sendRequest}
          onCancelFollowRequest={cancelRequest}
          followRequestLoading={reqLoading}
        />

        {/* Section toggle for own profile */}
        {isOwnProfile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex rounded-xl overflow-hidden glass"
          >
            {([
              { key: "posts" as const, label: "Posts" },
              { key: "settings" as const, label: "Settings" },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`flex-1 py-2.5 text-sm font-medium transition-all duration-300 relative ${
                  activeSection === key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                {activeSection === key && (
                  <motion.div
                    layoutId="profileSection"
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                  />
                )}
              </button>
            ))}
          </motion.div>
        )}

        {/* Settings section */}
        {isOwnProfile && activeSection === "settings" && (
          <ProfileSettings
            userId={user.id}
            userEmail={user.email || ""}
            profile={profile}
          />
        )}

        {/* Posts section */}
        {(activeSection === "posts" || !isOwnProfile) && (
          <>
            {!canSeePosts ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-10 text-center space-y-3">
                <Lock className="w-10 h-10 mx-auto text-muted-foreground" />
                <h3 className="text-foreground font-semibold">This Account is Private</h3>
                <p className="text-muted-foreground text-sm">Follow this account to see their posts</p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {pinnedPost && (
                  <AnimatedPost index={0}>
                    <PostCard
                      post={pinnedPost}
                      currentUserId={user.id}
                      onUpdate={refetchPosts}
                      isPinned
                      onPin={() => {}}
                      onUnpin={isOwnProfile ? unpinPost : undefined}
                    />
                  </AnimatedPost>
                )}

                {otherPosts.length > 0 ? (
                  otherPosts.map((p, i) => (
                    <AnimatedPost key={p.id} index={i + 1}>
                      <PostCard
                        post={p}
                        currentUserId={user.id}
                        onUpdate={refetchPosts}
                        onPin={isOwnProfile ? () => pinPost(p.id) : undefined}
                        onUnpin={undefined}
                      />
                    </AnimatedPost>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass rounded-2xl p-8 text-center"
                  >
                    <p className="text-muted-foreground text-sm">No posts yet</p>
                  </motion.div>
                )}
              </div>
            )}
          </>
        )}
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default Profile;
