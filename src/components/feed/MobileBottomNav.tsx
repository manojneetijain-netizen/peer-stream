import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Compass, MessageCircle, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { label: "Feed", icon: Home, path: "/feed" },
  { label: "Explore", icon: Compass, path: "/explore" },
  { label: "Messages", icon: MessageCircle, path: "/feed", action: "messages" },
  { label: "Profile", icon: User, path: "/profile" },
];

interface MobileBottomNavProps {
  onMessagesClick?: () => void;
}

const MobileBottomNav = ({ onMessagesClick }: MobileBottomNavProps) => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string, action?: string) => {
    if (action === "messages") return false; // messages is a modal, never "active"
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/30 safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const active = isActive(item.path, item.action);
          const isMessages = item.action === "messages";

          const content = (
            <div className="relative flex flex-col items-center gap-0.5 py-1.5 px-3">
              {active && (
                <motion.div
                  layoutId="mobileNav"
                  className="absolute -top-1.5 w-8 h-1 rounded-full bg-primary"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <item.icon
                className={`w-5 h-5 transition-all duration-200 ${
                  active ? "text-primary scale-110" : "text-muted-foreground"
                }`}
              />
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
