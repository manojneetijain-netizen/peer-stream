import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useBlockMute(currentUserId: string | undefined) {
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());
  const [mutedIds, setMutedIds] = useState<Set<string>>(new Set());

  const fetch = useCallback(async () => {
    if (!currentUserId) return;
    const [blocksRes, mutesRes] = await Promise.all([
      supabase.from("blocks").select("blocked_id").eq("blocker_id", currentUserId),
      supabase.from("mutes").select("muted_id").eq("muter_id", currentUserId),
    ]);
    setBlockedIds(new Set((blocksRes.data || []).map((b: any) => b.blocked_id)));
    setMutedIds(new Set((mutesRes.data || []).map((m: any) => m.muted_id)));
  }, [currentUserId]);

  useEffect(() => { fetch(); }, [fetch]);

  const blockUser = async (userId: string) => {
    if (!currentUserId) return;
    await supabase.from("blocks").insert({ blocker_id: currentUserId, blocked_id: userId });
    // Also unfollow both directions
    await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", userId);
    await supabase.from("follows").delete().eq("follower_id", userId).eq("following_id", currentUserId);
    setBlockedIds((prev) => new Set([...prev, userId]));
  };

  const unblockUser = async (userId: string) => {
    if (!currentUserId) return;
    await supabase.from("blocks").delete().eq("blocker_id", currentUserId).eq("blocked_id", userId);
    setBlockedIds((prev) => { const s = new Set(prev); s.delete(userId); return s; });
  };

  const muteUser = async (userId: string) => {
    if (!currentUserId) return;
    await supabase.from("mutes").insert({ muter_id: currentUserId, muted_id: userId });
    setMutedIds((prev) => new Set([...prev, userId]));
  };

  const unmuteUser = async (userId: string) => {
    if (!currentUserId) return;
    await supabase.from("mutes").delete().eq("muter_id", currentUserId).eq("muted_id", userId);
    setMutedIds((prev) => { const s = new Set(prev); s.delete(userId); return s; });
  };

  const isBlocked = (userId: string) => blockedIds.has(userId);
  const isMuted = (userId: string) => mutedIds.has(userId);

  return { blockedIds, mutedIds, blockUser, unblockUser, muteUser, unmuteUser, isBlocked, isMuted, refetch: fetch };
}
