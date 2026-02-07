import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ThemeToggle from "@/components/feed/ThemeToggle";
import {
  Home, Compass, Bookmark, MessageCircle, Bell, Settings,
  User, List, LogOut, TrendingUp,
} from "lucide-react";

interface FeedSidebarProps {
  currentUserId: string;
  onMessagesClick: () => void;
  profile?: { display_name?: string | null; username?: string | null; avatar_url?: string | null } | null;
}

const navItems = [
  { label: "Feed", icon: Home, path: "/feed" },
  { label: "Explore", icon: Compass, path: "/explore" },
  { label: "Trending", icon: TrendingUp, path: "/trending" },
  { label: "Bookmarks", icon: Bookmark, path: "/bookmarks" },
  { label: "Lists", icon: List, path: "/lists" },
  { label: "Settings", icon: Settings, path: "/settings" }, // redirects to profile
];

const FeedSidebar = ({ currentUserId, onMessagesClick, profile }: FeedSidebarProps) => {
  const location = useLocation();
  const { signOut } = useAuth();

  const initials = (profile?.display_name || profile?.username || "?").slice(0, 2).toUpperCase();

  return (
    <aside className="sticky top-0 h-screen w-64 flex flex-col py-6 px-4 border-r border-border/20">
      {/* Logo */}
      <Link to="/" className="mb-8 px-3">
        <span className="text-2xl font-bold gradient-text tracking-tight">Pulse</span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item, i) => {
          const isActive = location.pathname === item.path;
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "glass text-foreground glow-blue"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-primary" : ""}`} />
                {item.label}
              </Link>
            </motion.div>
          );
        })}

        {/* Messages button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: navItems.length * 0.05, duration: 0.3 }}
        >
          <button
            onClick={onMessagesClick}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all duration-200 group"
          >
            <MessageCircle className="w-5 h-5 transition-transform duration-200 group-hover:scale-110" />
            Messages
          </button>
        </motion.div>
      </nav>

      {/* Theme toggle */}
      <ThemeToggle className="mb-2" />

      {/* User profile card */}
      <div className="glass rounded-2xl p-3 flex items-center gap-3">
        <Link to={`/profile/${currentUserId}`}>
          <Avatar className="w-10 h-10 ring-2 ring-primary/30 transition-all duration-200 hover:ring-primary/60">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary text-foreground text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{profile?.display_name || profile?.username || "Anonymous"}</p>
          {profile?.username && <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>}
        </div>
        <button
          onClick={signOut}
          className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

export default FeedSidebar;
