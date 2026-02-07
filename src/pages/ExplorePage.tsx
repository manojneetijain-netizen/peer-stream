import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import PostCard from "@/components/feed/PostCard";
import { ArrowLeft, Compass, TrendingUp, Hash, Image, MessageCircle, Heart } from "lucide-react";
import type { PostWithDetails } from "@/hooks/useFeed";

type Category = "trending" | "popular" | "media" | "discussions";

const ExplorePage = () => {
  const { user, loading: authLoading } = useAuth();
  const [category, setCategory] = useState<Category>("trending");
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [trendingTags, setTrendingTags] = useState<{ name: string; count: number }[]>([]);

  useEffect(() => {
    // Fetch trending hashtags
    const fetchTrending = async () => {
      const { data } = await supabase
        .from("post_hashtags")
        .select("hashtag_id");

      if (!data) return;

      const countMap = new Map<string, number>();
      data.forEach((ph) => { countMap.set(ph.hashtag_id, (countMap.get(ph.hashtag_id) || 0) + 1); });

      const topIds = [...countMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id);

      if (topIds.length === 0) return;

      const { data: hashtags } = await supabase
        .from("hashtags")
        .select("id, name")
        .in("id", topIds);

      if (hashtags) {
        setTrendingTags(
          hashtags
            .map((h) => ({ name: h.name, count: countMap.get(h.id) || 0 }))
            .sort((a, b) => b.count - a.count)
        );
      }
    };
    fetchTrending();
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchPosts = async () => {
      setLoading(true);
      let query = supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(30);

      if (category === "media") {
        query = query.not("image_url", "is", null);
      }

      const { data: rawPosts } = await query;
      if (!rawPosts || rawPosts.length === 0) { setPosts([]); setLoading(false); return; }

      // For "popular" sort by engagement later
      const userIds = [...new Set(rawPosts.map((p) => p.user_id))];
      const postIds = rawPosts.map((p) => p.id);

      const [profilesRes, likesRes, commentsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", userIds),
        supabase.from("likes").select("post_id").in("post_id", postIds),
        supabase.from("comments").select("post_id").in("post_id", postIds),
      ]);

      const profileMap = new Map((profilesRes.data || []).map((p) => [p.user_id, p]));
      const likesMap = new Map<string, number>();
      (likesRes.data || []).forEach((l) => { likesMap.set(l.post_id, (likesMap.get(l.post_id) || 0) + 1); });
      const commentsMap = new Map<string, number>();
      (commentsRes.data || []).forEach((c) => { commentsMap.set(c.post_id, (commentsMap.get(c.post_id) || 0) + 1); });

      let enriched: PostWithDetails[] = rawPosts.map((post) => {
        const profile = profileMap.get(post.user_id);
        return {
          ...post,
          author: { username: profile?.username ?? null, display_name: profile?.display_name ?? null, avatar_url: profile?.avatar_url ?? null },
          likes_count: likesMap.get(post.id) || 0,
          comments_count: commentsMap.get(post.id) || 0,
          reposts_count: 0, liked_by_me: false, reposted_by_me: false, my_reaction: null, reaction_counts: {}, bookmarked_by_me: false,
        };
      });

      if (category === "popular") {
        enriched.sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count));
      } else if (category === "discussions") {
        enriched = enriched.filter((p) => p.comments_count > 0);
        enriched.sort((a, b) => b.comments_count - a.comments_count);
      }

      setPosts(enriched);
      setLoading(false);
    };
    fetchPosts();
  }, [user, category]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const categories: { key: Category; label: string; icon: typeof TrendingUp }[] = [
    { key: "trending", label: "Trending", icon: TrendingUp },
    { key: "popular", label: "Popular", icon: Heart },
    { key: "media", label: "Media", icon: Image },
    { key: "discussions", label: "Discussions", icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/feed" className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Compass className="w-4 h-4 text-foreground" />
          <span className="text-lg font-bold gradient-text">Explore</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                category === key
                  ? "bg-gradient-to-r from-pulse-blue to-pulse-cyan text-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Trending tags sidebar */}
        {trendingTags.length > 0 && category === "trending" && (
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Hash className="w-4 h-4 text-primary" />
              Trending Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag) => (
                <Link
                  key={tag.name}
                  to={`/hashtag/${tag.name}`}
                  className="px-3 py-1.5 rounded-full bg-secondary/50 text-sm text-foreground hover:bg-secondary/80 transition-colors"
                >
                  #{tag.name} <span className="text-xs text-muted-foreground ml-1">{tag.count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-muted-foreground text-sm">No posts found in this category</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={user.id} onUpdate={() => {}} />
          ))
        )}
      </main>
    </div>
  );
};

export default ExplorePage;
