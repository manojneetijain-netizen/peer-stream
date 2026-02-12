import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePushNotifications(currentUserId: string | undefined) {
  const permissionRef = useRef<NotificationPermission>("default");

  useEffect(() => {
    if (!currentUserId || !("Notification" in window)) return;

    // Request permission on mount
    if (Notification.permission === "default") {
      Notification.requestPermission().then((perm) => {
        permissionRef.current = perm;
      });
    } else {
      permissionRef.current = Notification.permission;
    }

    const channel = supabase
      .channel("push-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${currentUserId}` },
        async (payload) => {
          if (permissionRef.current !== "granted") return;
          const n = payload.new as any;

          let title = "Pulse";
          let body = "You have a new notification";

          // Fetch from_user name
          let fromName = "Someone";
          if (n.from_user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("display_name, username")
              .eq("user_id", n.from_user_id)
              .single();
            if (profile) fromName = profile.display_name || profile.username || "Someone";
          }

          switch (n.type) {
            case "like":
              title = "New Like";
              body = `${fromName} liked your post`;
              break;
            case "comment":
              title = "New Comment";
              body = `${fromName} commented on your post`;
              break;
            case "follow":
              title = "New Follower";
              body = `${fromName} started following you`;
              break;
            case "follow_request":
              title = "Follow Request";
              body = `${fromName} requested to follow you`;
              break;
            case "repost":
              title = "New Repost";
              body = `${fromName} reposted your post`;
              break;
            case "message":
              title = "New Message";
              body = `${fromName} sent you a message`;
              break;
          }

          new Notification(title, {
            body,
            icon: "/favicon.ico",
            tag: n.id,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);
}
