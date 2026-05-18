import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ThemeToggle from "@/components/feed/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import pulseLogo from "@/assets/logo-pulse.png";
import {
  Home, Compass, Bell, User, MessageCircle,
  Bookmark, List, LogOut, TrendingUp, Film,
  Plus, MoreHorizontal, Bot,
} from "lucide-react";

interface FeedSidebarProps {
  currentUserId: string;
  onMessagesClick: () => void;
  profile?: { display_name?: string | null; username?: string | null; avatar_url?: string | null } | null;
  isMessagesView?: boolean;
  onNavClick?: () => void;
}

const navItems = [
  { label: "Home", icon: Home, path: "/feed" },
  { label: "Explore", icon: Compass, path: "/explore" },
  { label: "Notifications", icon: Bell, path: "/settings/notifications", badge: true },
  { label: "Profile", icon: User, path: "/profile" },
  { label: "Reels", icon: Film, path: "/reels" },
  { label: "Trending", icon: TrendingUp, path: "/trending" },
  { label: "Bookmarks", icon: Bookmark, path: "/bookmarks" },
  { label: "Lists", icon: List, path: "/lists" },
  { label: "AI Hub", icon: Bot, path: "/ai-hub", glow: true },
];

const FeedSidebar = ({ currentUserId, onMessagesClick, profile, isMessagesView, onNavClick }: FeedSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!currentUserId) return;
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", currentUserId)
      .eq("read", false);
    setUnreadMessages(count ?? 0);

    const { count: notifCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", currentUserId)
      .eq("read", false);
    setUnreadNotifs(notifCount ?? 0);
  }, [currentUserId]);

  useEffect(() => {
    fetchUnread();
    if (!currentUserId) return;
    const channel = supabase
      .channel("sidebar-unread")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `receiver_id=eq.${currentUserId}` }, () => {
        fetchUnread();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${currentUserId}` }, () => {
        fetchUnread();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchUnread, currentUserId]);

  const initials = (profile?.display_name || profile?.username || "?").slice(0, 2).toUpperCase();

  return (
    <aside className="sticky top-0 h-full max-h-[100dvh] w-64 flex flex-col py-5 px-4 min-h-0">
      {/* Logo */}
      <Link to="/" onClick={onNavClick} className="mb-3 px-3 flex items-center gap-2 shrink-0">
        <img src={pulseLogo} alt="Pulse logo" width={100} height={100} className="drop-shadow-[0_0_18px_hsl(var(--primary)/0.55)]" style={{ width: 100, height: 100 }} />
        <span className="text-2xl font-black tracking-tight text-foreground uppercase">Pulse</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 mt-4">
        {navItems.map((item, i) => {
          const profilePath = item.path === "/profile" ? `/profile/${currentUserId}` : item.path;
          const isActive = !isMessagesView && (item.path === "/profile"
            ? location.pathname.startsWith("/profile")
            : location.pathname === item.path || (item.path === "/feed" && location.pathname === "/"));
          const hasBadge = item.badge && unreadNotifs > 0;

          return (
            <motion.div
              key={item.path + item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <Link
                to={profilePath}
                onClick={onNavClick}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-bold transition-all duration-200 group ${isActive
                  ? "text-foreground bg-secondary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
                  }`}
              >
                <div className="relative">
                  <item.icon className={`w-6 h-6 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-foreground" : (item as any).glow ? "text-primary drop-shadow-[0_0_6px_hsl(var(--primary)/0.8)]" : ""
                  }`} />
                  {hasBadge && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive border-2 border-background" />
                  )}
                </div>
                <span className="tracking-wide">{item.label}</span>
              </Link>
            </motion.div>
          );
        })}

        {/* Messages button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: navItems.length * 0.04, duration: 0.3 }}
        >
          <button
            onClick={onMessagesClick}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-base font-bold transition-all duration-200 group ${isMessagesView
              ? "text-foreground bg-secondary/20"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
              }`}
          >
            <div className="relative">
              <MessageCircle className={`w-6 h-6 transition-transform duration-200 group-hover:scale-110 ${isMessagesView ? "text-foreground" : ""}`} />
              {unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive border-2 border-background" />
              )}
            </div>
            <span className="tracking-wide">Messages</span>
          </button>
        </motion.div>
      </nav>

      {/* Create Pulse button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onClick={() => navigate("/create")}
        className="shrink-0 mt-3 mb-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-bold hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_20px_hsl(var(--pulse-blue)/0.3)]"
      >
        <Plus className="w-4 h-4" />
        CREATE PULSE
      </motion.button>

      {/* Theme toggle */}
      <ThemeToggle className="shrink-0 mb-3" />

      {/* User profile card */}
      <div className="shrink-0 island-card p-3 flex items-center gap-3">
        <Link to={`/profile/${currentUserId}`}>
          <Avatar className="w-10 h-10 ring-2 ring-primary/20 transition-all duration-200 hover:ring-primary/50">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary text-foreground text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{profile?.display_name || profile?.username || "Anonymous"}</p>
          {profile?.username && <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>}
        </div>
        <button
          onClick={signOut}
          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
          title="Sign out"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

export default FeedSidebar;
