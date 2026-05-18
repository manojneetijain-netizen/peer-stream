import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PostWithDetails {
  id: string;
  content: string;
  image_url: string | null;
  audio_url?: string | null;
  video_url?: string | null;
  created_at: string;
  user_id: string;
  quoted_post_id: string | null;
  author: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  likes_count: number;
  comments_count: number;
  reposts_count: number;
  liked_by_me: boolean;
  reposted_by_me: boolean;
  my_reaction: string | null;
  reaction_counts: Record<string, number>;
  bookmarked_by_me: boolean;
}

type FeedTab = "following" | "discover";

const PAGE_SIZE = 15;

export function useFeed(currentUserId: string | undefined, tab: FeedTab = "discover") {
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  const enrichPosts = useCallback(
    async (rawPosts: any[]): Promise<PostWithDetails[]> => {
      if (rawPosts.length === 0) return [];

      const userIds = [...new Set(rawPosts.map((p) => p.user_id))];
      const postIds = rawPosts.map((p) => p.id);

      const [profilesRes, likesCountRes, commentsCountRes, repostsCountRes, reactionsRes, myLikesRes, myRepostsRes, myReactionsRes, myBookmarksRes] =
        await Promise.all([
          supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", userIds),
          supabase.from("likes").select("post_id").in("post_id", postIds),
          supabase.from("comments").select("post_id").in("post_id", postIds),
          supabase.from("reposts").select("post_id").in("post_id", postIds),
          supabase.from("reactions").select("post_id, reaction_type").in("post_id", postIds),
          currentUserId
            ? supabase.from("likes").select("post_id").eq("user_id", currentUserId).in("post_id", postIds)
            : Promise.resolve({ data: [] }),
          currentUserId
            ? supabase.from("reposts").select("post_id").eq("user_id", currentUserId).in("post_id", postIds)
            : Promise.resolve({ data: [] }),
          currentUserId
            ? supabase.from("reactions").select("post_id, reaction_type").eq("user_id", currentUserId).in("post_id", postIds)
            : Promise.resolve({ data: [] }),
          currentUserId
            ? supabase.from("bookmarks").select("post_id").eq("user_id", currentUserId).in("post_id", postIds)
            : Promise.resolve({ data: [] }),
        ]);

      const profileMap = new Map((profilesRes.data || []).map((p) => [p.user_id, p]));

      const likesMap = new Map<string, number>();
      (likesCountRes.data || []).forEach((l) => {
        likesMap.set(l.post_id, (likesMap.get(l.post_id) || 0) + 1);
      });

      const commentsMap = new Map<string, number>();
      (commentsCountRes.data || []).forEach((c) => {
        commentsMap.set(c.post_id, (commentsMap.get(c.post_id) || 0) + 1);
      });

      const repostsMap = new Map<string, number>();
      ((repostsCountRes as any).data || []).forEach((r: any) => {
        repostsMap.set(r.post_id, (repostsMap.get(r.post_id) || 0) + 1);
      });

      // Reaction counts per post
      const reactionCountsMap = new Map<string, Record<string, number>>();
      ((reactionsRes as any).data || []).forEach((r: any) => {
        const existing = reactionCountsMap.get(r.post_id) || {};
        existing[r.reaction_type] = (existing[r.reaction_type] || 0) + 1;
        reactionCountsMap.set(r.post_id, existing);
      });

      const myLikeSet = new Set((myLikesRes.data || []).map((l) => l.post_id));
      const myRepostSet = new Set(((myRepostsRes as any).data || []).map((r: any) => r.post_id));
      const myBookmarkSet = new Set(((myBookmarksRes as any).data || []).map((b: any) => b.post_id));

      const myReactionMap = new Map<string, string>();
      ((myReactionsRes as any).data || []).forEach((r: any) => {
        myReactionMap.set(r.post_id, r.reaction_type);
      });

      return rawPosts.map((post) => {
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
          reposts_count: repostsMap.get(post.id) || 0,
          liked_by_me: myLikeSet.has(post.id),
          reposted_by_me: myRepostSet.has(post.id),
          my_reaction: myReactionMap.get(post.id) || null,
          reaction_counts: reactionCountsMap.get(post.id) || {},
          bookmarked_by_me: myBookmarkSet.has(post.id),
        };
      });
    },
    [currentUserId]
  );

  const fetchPosts = useCallback(
    async (append = false) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        pageRef.current = 0;
      }

      const from = pageRef.current * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (tab === "following" && currentUserId) {
        const { data: follows } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", currentUserId);
        const followingIds = (follows || []).map((f) => f.following_id);
        followingIds.push(currentUserId);
        if (followingIds.length > 0) {
          query = query.in("user_id", followingIds);
        }
      }

      const { data: rawPosts } = await query;

      if (!rawPosts || rawPosts.length === 0) {
        if (!append) setPosts([]);
        setHasMore(false);
        setLoading(false);
        setLoadingMore(false);
        return;
      }

      setHasMore(rawPosts.length === PAGE_SIZE);
      const enriched = await enrichPosts(rawPosts);

      if (append) {
        setPosts((prev) => [...prev, ...enriched]);
      } else {
        setPosts(enriched);
      }

      pageRef.current += 1;
      setLoading(false);
      setLoadingMore(false);
    },
    [currentUserId, tab, enrichPosts]
  );

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchPosts(true);
    }
  }, [fetchPosts, loadingMore, hasMore]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("feed-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => fetchPosts())
      .on("postgres_changes", { event: "*", schema: "public", table: "likes" }, () => fetchPosts())
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => fetchPosts())
      .on("postgres_changes", { event: "*", schema: "public", table: "reposts" }, () => fetchPosts())
      .on("postgres_changes", { event: "*", schema: "public", table: "reactions" }, () => fetchPosts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPosts]);

  return { posts, loading, loadingMore, hasMore, loadMore, refetch: fetchPosts };
}
