import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, username, display_name, avatar_url, cover_url, bio, is_verified, is_private, pinned_post_id, created_at, updated_at")
      .eq("user_id", userId)
      .single();
    setProfile(data as Profile | null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, refetch: fetchProfile };
}

export function useProfileStats(userId: string | undefined) {
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });

  useEffect(() => {
    if (!userId) return;
    const fetchStats = async () => {
      const [postsRes, followersRes, followingRes] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
      ]);
      setStats({
        posts: postsRes.count ?? 0,
        followers: followersRes.count ?? 0,
        following: followingRes.count ?? 0,
      });
    };
    fetchStats();
  }, [userId]);

  return stats;
}

export function useIsFollowing(currentUserId: string | undefined, targetUserId: string | undefined) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) return;
    const check = async () => {
      const { data } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId)
        .maybeSingle();
      setIsFollowing(!!data);
    };
    check();
  }, [currentUserId, targetUserId]);

  const toggle = async () => {
    if (!currentUserId || !targetUserId) return;
    setLoading(true);
    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId);
      setIsFollowing(false);
    } else {
      await supabase
        .from("follows")
        .insert({ follower_id: currentUserId, following_id: targetUserId });
      setIsFollowing(true);
    }
    setLoading(false);
  };

  return { isFollowing, toggle, loading };
}
