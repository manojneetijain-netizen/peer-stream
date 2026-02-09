import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Film, Compass, TrendingUp, Bookmark, List } from "lucide-react";

const tabs = [
  { label: "Feed", icon: Home, path: "/feed" },
  { label: "Reels", icon: Film, path: "/reels" },
  { label: "Explore", icon: Compass, path: "/explore" },
  { label: "Trending", icon: TrendingUp, path: "/trending" },
  { label: "Bookmarks", icon: Bookmark, path: "/bookmarks" },
  { label: "Lists", icon: List, path: "/lists" },
];

const FeedNavTabs = () => {
  const location = useLocation();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="island-card !p-1.5 flex gap-1 overflow-x-auto scrollbar-hide"
    >
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-medium whitespace-nowrap transition-colors duration-200 ${
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="feedNavTab"
                className="absolute inset-0 glass glow-blue rounded-2xl"
                transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
              />
            )}
            <tab.icon className="w-3.5 h-3.5 relative z-10" />
            <span className="relative z-10">{tab.label}</span>
          </Link>
        );
      })}
    </motion.div>
  );
};

export default FeedNavTabs;
