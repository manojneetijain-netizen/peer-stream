import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Heart, MessageCircle, UserPlus, Repeat2, UserCheck } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  from_user_id: string | null;
  reference_id: string | null;
  read: boolean;
  created_at: string;
  from_user?: { username: string | null; display_name: string | null; avatar_url: string | null };
}

interface NotificationBellProps {
  currentUserId: string;
}

const NotificationBell = ({ currentUserId }: NotificationBellProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (!data) return;

    const fromUserIds = [...new Set(data.filter((n) => n.from_user_id).map((n) => n.from_user_id!))];
    let profileMap = new Map<string, any>();
    if (fromUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .in("user_id", fromUserIds);
      profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
    }

    const enriched = data.map((n) => ({
      ...n,
      from_user: n.from_user_id ? profileMap.get(n.from_user_id) || null : null,
    }));

    setNotifications(enriched);
    setUnreadCount(enriched.filter((n) => !n.read).length);
  };

  useEffect(() => { fetchNotifications(); }, [currentUserId]);

  useEffect(() => {
    const channel = supabase
      .channel(`notifications-bell-${currentUserId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${currentUserId}` }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  const markAllRead = async () => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", currentUserId)
      .eq("read", false);
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const toggleOpen = () => {
    setOpen(!open);
    if (!open && unreadCount > 0) markAllRead();
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "like": return <Heart className="w-3.5 h-3.5 text-destructive" />;
      case "comment": return <MessageCircle className="w-3.5 h-3.5 text-accent" />;
      case "follow": return <UserPlus className="w-3.5 h-3.5 text-primary" />;
      case "follow_request": return <UserCheck className="w-3.5 h-3.5 text-primary" />;
      case "repost": return <Repeat2 className="w-3.5 h-3.5 text-accent" />;
      default: return <Bell className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const typeText = (type: string) => {
    switch (type) {
      case "like": return "liked your post";
      case "comment": return "commented on your post";
      case "follow": return "started following you";
      case "follow_request": return "requested to follow you";
      case "repost": return "reposted your post";
      default: return "sent you a notification";
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div className="relative">
      <button onClick={toggleOpen} className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground relative">
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-[9px] font-bold flex items-center justify-center text-destructive-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 max-h-96 overflow-y-auto glass-card rounded-xl border border-border/20 shadow-2xl">
            <div className="p-3 border-b border-border/30 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Notifications</span>
            </div>
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">No notifications yet</div>
            ) : (
              notifications.map((n) => {
                const initials = (n.from_user?.display_name || n.from_user?.username || "?").slice(0, 2).toUpperCase();
                return (
                  <div key={n.id} className={`flex items-start gap-2 p-3 hover:bg-secondary/20 transition-colors ${!n.read ? "bg-primary/5" : ""}`}>
                    {n.from_user_id ? (
                      <Link to={`/profile/${n.from_user_id}`}>
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={n.from_user?.avatar_url || undefined} />
                          <AvatarFallback className="bg-secondary text-foreground text-xs">{initials}</AvatarFallback>
                        </Avatar>
                      </Link>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                        {typeIcon(n.type)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground">
                        <span className="font-medium">{n.from_user?.display_name || n.from_user?.username || "Someone"}</span>{" "}
                        {typeText(n.type)}
                      </p>
                      {n.type === "follow_request" && (
                        <Link to="/follow-requests" onClick={() => setOpen(false)} className="text-[10px] text-primary hover:underline">
                          View requests
                        </Link>
                      )}
                      <span className="text-[10px] text-muted-foreground block">{timeAgo(n.created_at)}</span>
                    </div>
                    {typeIcon(n.type)}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
