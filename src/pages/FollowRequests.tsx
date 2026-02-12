import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { usePendingRequests } from "@/hooks/useFollowRequests";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Check, X, UserPlus } from "lucide-react";
import MobileBottomNav from "@/components/feed/MobileBottomNav";

interface RequesterProfile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

const FollowRequests = () => {
  const { user, loading: authLoading } = useAuth();
  const { requests, loading, acceptRequest, rejectRequest } = usePendingRequests(user?.id);
  const [profiles, setProfiles] = useState<Record<string, RequesterProfile>>({});

  useEffect(() => {
    if (requests.length === 0) return;
    const ids = requests.map((r) => r.requester_id);
    supabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url")
      .in("user_id", ids)
      .then(({ data }) => {
        const map: Record<string, RequesterProfile> = {};
        data?.forEach((p) => (map[p.user_id] = p));
        setProfiles(map);
      });
  }, [requests]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/feed" className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-lg font-bold gradient-text">Follow Requests</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-20 lg:pb-6 space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading...</p>
        ) : requests.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-8 text-center space-y-3">
            <UserPlus className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground text-sm">No pending follow requests</p>
          </motion.div>
        ) : (
          requests.map((req, i) => {
            const p = profiles[req.requester_id];
            const initials = (p?.display_name || p?.username || "?").slice(0, 2).toUpperCase();
            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass rounded-xl p-4 flex items-center gap-3"
              >
                <Link to={`/profile/${req.requester_id}`}>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={p?.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary text-foreground text-sm">{initials}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/profile/${req.requester_id}`} className="text-sm font-medium text-foreground hover:underline">
                    {p?.display_name || p?.username || "User"}
                  </Link>
                  {p?.username && <p className="text-xs text-muted-foreground">@{p.username}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => acceptRequest(req.id, req.requester_id)}
                    className="p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => rejectRequest(req.id)}
                    className="p-2 rounded-full bg-secondary text-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default FollowRequests;
