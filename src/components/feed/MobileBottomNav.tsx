import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Compass, MessageCircle, User, Film, Bot } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "Feed", icon: Home, path: "/feed" },
  { label: "Reels", icon: Film, path: "/reels" },
  { label: "AI Hub", icon: Bot, path: "/ai-hub" },
  { label: "Messages", icon: MessageCircle, path: "/feed", action: "messages" },
  { label: "Profile", icon: User, path: "/profile" },
];

interface MobileBottomNavProps {
  onMessagesClick?: () => void;
}

const MobileBottomNav = ({ onMessagesClick }: MobileBottomNavProps) => {
  const location = useLocation();
  const { user } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!user?.id) return;
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("read", false);
    setUnreadMessages(count ?? 0);
  }, [user?.id]);

  useEffect(() => {
    fetchUnread();
    // Listen for new messages
    if (!user?.id) return;
    const channel = supabase
      .channel("unread-badge")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `receiver_id=eq.${user.id}` }, () => {
        fetchUnread();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchUnread, user?.id]);

  const isActive = (path: string, action?: string) => {
    if (action === "messages") return false;
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-surface border-t border-border/20 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const active = isActive(item.path, item.action);
          const isMessages = item.action === "messages";
          const badge = isMessages ? unreadMessages : 0;

          const content = (
            <div className="relative flex flex-col items-center gap-0.5 py-1.5 px-3">
              {active && (
                <motion.div
                  layoutId="mobileNav"
                  className="absolute -top-1.5 w-8 h-1 rounded-full bg-primary"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <div className="relative">
                <item.icon
                  className={`w-5 h-5 transition-all duration-200 ${
                    active ? "text-primary scale-110" : "text-muted-foreground"
                  }`}
                />
                {badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center"
                  >
                    {badge > 99 ? "99+" : badge}
                  </motion.span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </div>
          );

          if (isMessages) {
            return (
              <button
                key={item.label}
                onClick={onMessagesClick}
                className="transition-transform active:scale-90"
              >
                {content}
              </button>
            );
          }

          const to = item.path === "/profile" && user?.id ? `/profile/${user.id}` : item.path;

          return (
            <Link
              key={item.label}
              to={to}
              className="transition-transform active:scale-90"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
