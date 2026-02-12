import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FollowRequest {
  id: string;
  requester_id: string;
  target_id: string;
  status: string;
  created_at: string;
}

export function useFollowRequestStatus(
  currentUserId: string | undefined,
  targetUserId: string | undefined
) {
  const [requestStatus, setRequestStatus] = useState<"none" | "pending" | "accepted" | "rejected">("none");
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) return;
    const { data } = await supabase
      .from("follow_requests")
      .select("status")
      .eq("requester_id", currentUserId)
      .eq("target_id", targetUserId)
      .maybeSingle();
    setRequestStatus(data ? (data.status as any) : "none");
  }, [currentUserId, targetUserId]);

  useEffect(() => {
    check();
  }, [check]);

  const sendRequest = async () => {
    if (!currentUserId || !targetUserId) return;
    setLoading(true);
    await supabase.from("follow_requests").insert({
      requester_id: currentUserId,
      target_id: targetUserId,
    });
    // Send a notification to the target user
    await supabase.from("notifications").insert({
      user_id: targetUserId,
      from_user_id: currentUserId,
      type: "follow_request",
    });
    setRequestStatus("pending");
    setLoading(false);
  };

  const cancelRequest = async () => {
    if (!currentUserId || !targetUserId) return;
    setLoading(true);
    await supabase
      .from("follow_requests")
      .delete()
      .eq("requester_id", currentUserId)
      .eq("target_id", targetUserId);
    setRequestStatus("none");
    setLoading(false);
  };

  return { requestStatus, sendRequest, cancelRequest, loading, refetch: check };
}

export function usePendingRequests(userId: string | undefined) {
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from("follow_requests")
      .select("*")
      .eq("target_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setRequests((data as FollowRequest[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const acceptRequest = async (requestId: string, requesterId: string) => {
    // Accept: update status and create the follow
    await supabase.from("follow_requests").update({ status: "accepted" }).eq("id", requestId);
    await supabase.from("follows").insert({ follower_id: requesterId, following_id: userId! });
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  const rejectRequest = async (requestId: string) => {
    await supabase.from("follow_requests").update({ status: "rejected" }).eq("id", requestId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  return { requests, loading, acceptRequest, rejectRequest, refetch: fetch };
}
