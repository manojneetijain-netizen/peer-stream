import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PostCard from "@/components/feed/PostCard";
import type { PostWithDetails } from "@/hooks/useFeed";
import { ArrowLeft, Hash } from "lucide-react";

const HashtagPage = () => {
  const { tag } = useParams<{ tag: string }>();
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!tag) return;
    setLoading(true);

    // Find hashtag
    const { data: hashtag } = await supabase
      .from("hashtags")
      .select("id")
      .eq("name", tag.toLowerCase())
      .single();

    if (!hashtag) {
      setPosts([]);
      setLoading(false);
      return;
    }

    // Get post IDs with this hashtag
    const { data: postHashtags } = await supabase
      .from("post_hashtags")
      .select("post_id")
      .eq("hashtag_id", hashtag.id);

    if (!postHashtags || postHashtags.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const postIds = postHashtags.map((ph: any) => ph.post_id);
    const { data: rawPosts } = await supabase
      .from("posts")
      .select("*")
      .in("id", postIds)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!rawPosts || rawPosts.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    // Enrich posts
    const userIds = [...new Set(rawPosts.map((p) => p.user_id))];
    const pIds = rawPosts.map((p) => p.id);

    const [profilesRes, likesRes, commentsRes, repostsRes, reactionsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", userIds),
      supabase.from("likes").select("post_id").in("post_id", pIds),
      supabase.from("comments").select("post_id").in("post_id", pIds),
      supabase.from("reposts").select("post_id").in("post_id", pIds),
      supabase.from("reactions").select("post_id, reaction_type").in("post_id", pIds),
    ]);

    const profileMap = new Map((profilesRes.data || []).map((p) => [p.user_id, p]));
    const countMap = (data: any[]) => {
      const m = new Map<string, number>();
      data.forEach((d) => m.set(d.post_id, (m.get(d.post_id) || 0) + 1));
      return m;
    };

    const likesMap = countMap(likesRes.data || []);
    const commentsMap = countMap(commentsRes.data || []);
    const repostsMap = countMap(repostsRes.data || []);

    const reactionCountsMap = new Map<string, Record<string, number>>();
    (reactionsRes.data || []).forEach((r: any) => {
      const ex = reactionCountsMap.get(r.post_id) || {};
      ex[r.reaction_type] = (ex[r.reaction_type] || 0) + 1;
      reactionCountsMap.set(r.post_id, ex);
    });

    setPosts(
      rawPosts.map((post) => {
        const profile = profileMap.get(post.user_id);
        return {
          ...post,
          author: { username: profile?.username ?? null, display_name: profile?.display_name ?? null, avatar_url: profile?.avatar_url ?? null },
          likes_count: likesMap.get(post.id) || 0,
          comments_count: commentsMap.get(post.id) || 0,
          reposts_count: repostsMap.get(post.id) || 0,
          liked_by_me: false,
          reposted_by_me: false,
          my_reaction: null,
          reaction_counts: reactionCountsMap.get(post.id) || {},
          bookmarked_by_me: false,
          images: [],
        };
      })
    );
    setLoading(false);
  }, [tag]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/feed" className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Hash className="w-5 h-5 text-primary" />
          <span className="text-lg font-bold text-foreground">{tag}</span>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-muted-foreground">No posts with #{tag} yet</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={user?.id || ""} onUpdate={fetchPosts} />
          ))
        )}
      </main>
    </div>
  );
};

export default HashtagPage;
