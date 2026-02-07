import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import FollowList from "./pages/FollowList";
import Bookmarks from "./pages/Bookmarks";
import HashtagPage from "./pages/HashtagPage";
import TrendingPage from "./pages/TrendingPage";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/profile/:userId/followers" element={<FollowList />} />
            <Route path="/profile/:userId/following" element={<FollowList />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/hashtag/:tag" element={<HashtagPage />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
