import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, UserPlus, Hash, Search } from "lucide-react";
import PostSearch from "./PostSearch";

interface RightSidebarProps {
  currentUserId: string;
}

const RightSidebar = ({ currentUserId }: RightSidebarProps) => {
  const [suggested, setSuggested] = useState<any[]>([]);
  const [trending, setTrending] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    const fetchSuggested = async () => {
      const { data: following } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", currentUserId);
      const followingIds = (following || []).map((f) => f.following_id);
      followingIds.push(currentUserId);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, bio")
        .not("user_id", "in", `(${followingIds.join(",")})`)
        .limit(4);
      setSuggested(profiles || []);
    };

    const fetchTrending = async () => {
      const { data } = await supabase
        .from("post_hashtags")
        .select("hashtag_id, hashtags(name)")
        .limit(100);
      if (!data) return;
      const counts = new Map<string, { name: string; count: number }>();
      data.forEach((ph: any) => {
        const name = ph.hashtags?.name;
        if (!name) return;
        const existing = counts.get(name);
        counts.set(name, { name, count: (existing?.count || 0) + 1 });
      });
      setTrending(
        Array.from(counts.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      );
    };

    fetchSuggested();
    fetchTrending();
  }, [currentUserId]);

  const followUser = async (userId: string) => {
    await supabase.from("follows").insert({ follower_id: currentUserId, following_id: userId });
    setSuggested((prev) => prev.filter((u) => u.user_id !== userId));
  };

  return (
    <aside className="sticky top-0 h-screen w-80 flex flex-col gap-4 py-6 px-4 overflow-y-auto border-l border-border/20">
      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <PostSearch />
      </motion.div>

      {/* Trending */}
      {trending.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-4"
        >
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-accent" />
            Trending
          </h3>
          <div className="space-y-2.5">
            {trending.map((tag, i) => (
              <motion.div
                key={tag.name}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <Link
                  to={`/hashtag/${tag.name}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary/50 transition-all duration-200 group"
                >
                  <Hash className="w-3.5 h-3.5 text-accent group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-foreground">#{tag.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{tag.count} posts</span>
                </Link>
              </motion.div>
            ))}
          </div>
          <Link to="/trending" className="block mt-3 text-xs text-primary hover:underline">
            See more →
          </Link>
        </motion.div>
      )}

      {/* Suggested */}
      {suggested.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-4"
        >
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-primary" />
            Who to follow
          </h3>
          <div className="space-y-3">
            {suggested.map((u, i) => {
              const initials = (u.display_name || u.username || "?").slice(0, 2).toUpperCase();
              return (
                <motion.div
                  key={u.user_id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className="flex items-center gap-3 group"
                >
                  <Link to={`/profile/${u.user_id}`}>
                    <Avatar className="w-9 h-9 ring-1 ring-border/30 group-hover:ring-primary/40 transition-all duration-200">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback className="bg-secondary text-foreground text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile/${u.user_id}`} className="text-sm font-medium text-foreground hover:underline truncate block">
                      {u.display_name || u.username || "Anonymous"}
                    </Link>
                    {u.bio && <p className="text-xs text-muted-foreground truncate">{u.bio}</p>}
                  </div>
                  <button
                    onClick={() => followUser(u.user_id)}
                    className="text-xs px-3 py-1.5 rounded-full gradient-border text-foreground hover:bg-secondary/50 transition-all duration-200 font-medium hover:scale-105 active:scale-95"
                  >
                    Follow
                  </button>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <div className="text-[10px] text-muted-foreground/50 px-2 mt-auto">
        © 2026 Pulse. All rights reserved.
      </div>
    </aside>
  );
};

export default RightSidebar;
