import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Reel {
  id: string;
  user_id: string;
  content: string;
  video_url: string;
  created_at: string;
  profiles?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  };
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}

export const useReels = (currentUserId?: string) => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReels = useCallback(async () => {
    setLoading(true);

    // Use raw rpc-style query to avoid deep type instantiation
    const query = supabase
      .from("posts")
      .select("id, user_id, content, video_url, created_at") as any;

    const { data: posts } = await query
      .eq("type", "reel")
      .not("video_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!posts || posts.length === 0) {
      const fallbackQuery = supabase
        .from("posts")
        .select("id, user_id, content, video_url, created_at") as any;

      const { data: videoPosts } = await fallbackQuery
        .not("video_url", "is", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!videoPosts) {
        setReels([]);
        setLoading(false);
        return;
      }

      await enrichReels(videoPosts);
    } else {
      await enrichReels(posts);
    }

    setLoading(false);
  }, [currentUserId]);

  const enrichReels = async (posts: any[]) => {
    const userIds = [...new Set(posts.map((p) => p.user_id))];
    const postIds = posts.map((p) => p.id);

    const [profilesRes, likesRes, commentsRes, userLikesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, username, avatar_url, is_verified").in("user_id", userIds),
      supabase.from("likes").select("post_id").in("post_id", postIds),
      supabase.from("comments").select("post_id").in("post_id", postIds),
      currentUserId
        ? supabase.from("likes").select("post_id").eq("user_id", currentUserId).in("post_id", postIds)
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map((profilesRes.data || []).map((p) => [p.user_id, p]));
    const likeCounts = new Map<string, number>();
    const commentCounts = new Map<string, number>();
    const userLikedSet = new Set((userLikesRes.data || []).map((l) => l.post_id));

    (likesRes.data || []).forEach((l) => likeCounts.set(l.post_id, (likeCounts.get(l.post_id) || 0) + 1));
    (commentsRes.data || []).forEach((c) => commentCounts.set(c.post_id, (commentCounts.get(c.post_id) || 0) + 1));

    const enriched: Reel[] = posts.map((post) => ({
      ...post,
      video_url: post.video_url!,
      profiles: profileMap.get(post.user_id) || undefined,
      likes_count: likeCounts.get(post.id) || 0,
      comments_count: commentCounts.get(post.id) || 0,
      user_has_liked: userLikedSet.has(post.id),
    }));

    setReels(enriched);
  };

  useEffect(() => {
    fetchReels();
  }, [fetchReels]);

  return { reels, loading, refetch: fetchReels };
};
