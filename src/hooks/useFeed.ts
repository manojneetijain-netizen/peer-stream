import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PostWithDetails {
  id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  user_id: string;
  author: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
}

type FeedTab = "following" | "discover";

export function useFeed(currentUserId: string | undefined, tab: FeedTab = "discover") {
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (tab === "following" && currentUserId) {
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", currentUserId);
      const followingIds = (follows || []).map((f) => f.following_id);
      // Include own posts too
      followingIds.push(currentUserId);
      if (followingIds.length > 0) {
        query = query.in("user_id", followingIds);
      }
    }

    const { data: rawPosts } = await query;

    if (!rawPosts || rawPosts.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(rawPosts.map((p) => p.user_id))];
    const postIds = rawPosts.map((p) => p.id);

    const [profilesRes, likesCountRes, commentsCountRes, myLikesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", userIds),
      supabase.from("likes").select("post_id").in("post_id", postIds),
      supabase.from("comments").select("post_id").in("post_id", postIds),
      currentUserId
        ? supabase.from("likes").select("post_id").eq("user_id", currentUserId).in("post_id", postIds)
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map(
      (profilesRes.data || []).map((p) => [p.user_id, p])
    );

    const likesMap = new Map<string, number>();
    (likesCountRes.data || []).forEach((l) => {
      likesMap.set(l.post_id, (likesMap.get(l.post_id) || 0) + 1);
    });

    const commentsMap = new Map<string, number>();
    (commentsCountRes.data || []).forEach((c) => {
      commentsMap.set(c.post_id, (commentsMap.get(c.post_id) || 0) + 1);
    });

    const myLikeSet = new Set((myLikesRes.data || []).map((l) => l.post_id));

    const enriched: PostWithDetails[] = rawPosts.map((post) => {
      const profile = profileMap.get(post.user_id);
      return {
        ...post,
        author: {
          username: profile?.username ?? null,
          display_name: profile?.display_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
        },
        likes_count: likesMap.get(post.id) || 0,
        comments_count: commentsMap.get(post.id) || 0,
        liked_by_me: myLikeSet.has(post.id),
      };
    });

    setPosts(enriched);
    setLoading(false);
  }, [currentUserId, tab]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, loading, refetch: fetchPosts };
}
