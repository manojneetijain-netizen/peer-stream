import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft } from "lucide-react";

interface FollowUser {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

type Tab = "followers" | "following";

const FollowList = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("followers");
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetch = async () => {
      setLoading(true);
      const column = tab === "followers" ? "following_id" : "follower_id";
      const targetColumn = tab === "followers" ? "follower_id" : "following_id";

      const { data: follows } = await supabase
        .from("follows")
        .select("*")
        .eq(column, userId);

      if (!follows || follows.length === 0) { setUsers([]); setLoading(false); return; }

      const ids = follows.map((f: any) => f[targetColumn]);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .in("user_id", ids);

      setUsers(profiles || []);
      setLoading(false);
    };
    fetch();
  }, [userId, tab]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to={`/profile/${userId}`} className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-lg font-bold gradient-text">{tab === "followers" ? "Followers" : "Following"}</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex rounded-xl overflow-hidden bg-secondary/50 mb-4">
          {(["followers", "following"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-gradient-to-r from-pulse-blue to-pulse-cyan text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No {tab} yet
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => {
              const initials = (u.display_name || u.username || "?").slice(0, 2).toUpperCase();
              return (
                <Link
                  key={u.user_id}
                  to={`/profile/${u.user_id}`}
                  className="flex items-center gap-3 p-3 glass rounded-xl hover:bg-secondary/30 transition-colors"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={u.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary text-foreground text-sm">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.display_name || u.username || "Anonymous"}</p>
                    {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default FollowList;
