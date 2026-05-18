import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/hooks/useAuth";
import PageTransition from "@/components/layout/PageTransition";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import FollowList from "./pages/FollowList";
import Bookmarks from "./pages/Bookmarks";
import HashtagPage from "./pages/HashtagPage";
import TrendingPage from "./pages/TrendingPage";
import Analytics from "./pages/Analytics";
import NotificationSettings from "./pages/NotificationSettings";
import UserLists from "./pages/UserLists";
import ExplorePage from "./pages/ExplorePage";
import Settings from "./pages/Settings";
import Reels from "./pages/Reels";
import FollowRequests from "./pages/FollowRequests";
import CreatePostPage from "./pages/CreatePost";
import NotFound from "./pages/NotFound";
import AIHub from "./pages/AIHub";

const queryClient = new QueryClient();

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="/profile/:userId" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="/profile/:userId/followers" element={<PageTransition><FollowList /></PageTransition>} />
        <Route path="/profile/:userId/following" element={<PageTransition><FollowList /></PageTransition>} />
        <Route path="/bookmarks" element={<PageTransition><Bookmarks /></PageTransition>} />
        <Route path="/hashtag/:tag" element={<PageTransition><HashtagPage /></PageTransition>} />
        <Route path="/trending" element={<PageTransition><TrendingPage /></PageTransition>} />
        <Route path="/analytics" element={<PageTransition><Analytics /></PageTransition>} />
        <Route path="/settings/notifications" element={<PageTransition><NotificationSettings /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
        <Route path="/create" element={<CreatePostPage />} />
        <Route path="/lists" element={<PageTransition><UserLists /></PageTransition>} />
        <Route path="/explore" element={<PageTransition><ExplorePage /></PageTransition>} />
        <Route path="/reels" element={<Reels />} />
        <Route path="/follow-requests" element={<PageTransition><FollowRequests /></PageTransition>} />
        <Route path="/ai-hub" element={<PageTransition><AIHub /></PageTransition>} />
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AnimatedRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
