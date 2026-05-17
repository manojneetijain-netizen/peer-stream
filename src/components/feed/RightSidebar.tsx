import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, Search } from "lucide-react";
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

  const categoryLabels = ["TRENDING", "TECHNOLOGY", "PHOTOGRAPHY", "DESIGN", "CULTURE"];

  return (
    <aside className="sticky top-0 h-screen w-80 flex flex-col gap-5 py-6 px-4 overflow-y-auto">
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
          className="island-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-black italic uppercase tracking-wide text-foreground">
              Trending
            </h3>
            <TrendingUp className="w-4 h-4 text-accent" />
          </div>
          <div className="space-y-4">
            {trending.map((tag, i) => (
              <motion.div
                key={tag.name}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <Link
                  to={`/hashtag/${tag.name}`}
                  className="block group"
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                    {categoryLabels[i] || "GENERAL"}
                  </p>
                  <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    #{tag.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tag.count > 1000 ? `${(tag.count / 1000).toFixed(1)}k` : tag.count} Pulses
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
          <Link to="/trending" className="block mt-4 text-xs font-semibold text-primary hover:underline">
            Show more
          </Link>
        </motion.div>
      )}

      {/* Suggested */}
      {suggested.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="island-card p-5"
        >
          <h3 className="text-base font-black italic uppercase tracking-wide text-foreground mb-4">
            Suggested
          </h3>
          <div className="space-y-4">
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
                    <Avatar className="w-10 h-10 ring-1 ring-border/30 group-hover:ring-primary/40 transition-all duration-200">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback className="bg-secondary text-foreground text-xs">{initials}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/profile/${u.user_id}`} className="text-sm font-semibold text-foreground hover:underline truncate block">
                      {u.display_name || u.username || "Anonymous"}
                    </Link>
                    {u.username && (
                      <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                    )}
                  </div>
                  <button
                    onClick={() => followUser(u.user_id)}
                    className="text-xs px-4 py-1.5 rounded-full border border-border/50 text-foreground hover:bg-secondary/50 transition-all duration-200 font-semibold hover:scale-105 active:scale-95"
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
      <div className="text-[10px] text-muted-foreground/50 px-2 mt-auto space-y-1">
        <div className="flex gap-3 flex-wrap">
          <span className="hover:underline cursor-pointer">Privacy</span>
          <span className="hover:underline cursor-pointer">Terms</span>
          <span className="hover:underline cursor-pointer">Cookies</span>
          <span className="hover:underline cursor-pointer">Ad Info</span>
        </div>
        <p>© 2026 Pulse Social</p>
      </div>
    </aside>
  );
};

export default RightSidebar;
