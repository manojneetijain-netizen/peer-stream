import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PresenceState {
  user_id: string;
  online_at: string;
  typing_to?: string | null;
}

export function usePresence(currentUserId: string | undefined) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map()); // userId -> typing_to
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase.channel("global-presence", {
      config: { presence: { key: currentUserId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceState>();
        const online = new Set<string>();
        const typing = new Map<string, string>();
        Object.entries(state).forEach(([key, presences]) => {
          online.add(key);
          const latest = presences[presences.length - 1] as PresenceState;
          if (latest?.typing_to) {
            typing.set(key, latest.typing_to);
          }
        });
        setOnlineUsers(online);
        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: currentUserId,
            online_at: new Date().toISOString(),
            typing_to: null,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const setTyping = useCallback(
    async (recipientId: string | null) => {
      if (!channelRef.current || !currentUserId) return;
      await channelRef.current.track({
        user_id: currentUserId,
        online_at: new Date().toISOString(),
        typing_to: recipientId,
      });
    },
    [currentUserId]
  );

  const isOnline = useCallback(
    (userId: string) => onlineUsers.has(userId),
    [onlineUsers]
  );

  const isTypingTo = useCallback(
    (userId: string, recipientId: string) => typingUsers.get(userId) === recipientId,
    [typingUsers]
  );

  return { isOnline, isTypingTo, setTyping, onlineUsers };
}
