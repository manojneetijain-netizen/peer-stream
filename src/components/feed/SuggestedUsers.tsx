import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus } from "lucide-react";

interface SuggestedUsersProps {
  currentUserId: string;
}

const SuggestedUsers = ({ currentUserId }: SuggestedUsersProps) => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchSuggested = async () => {
      // Get users the current user already follows
      const { data: following } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", currentUserId);

      const followingIds = (following || []).map((f) => f.following_id);
      followingIds.push(currentUserId); // Exclude self

      // Get profiles not followed, ordered by most recent
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, bio")
        .not("user_id", "in", `(${followingIds.join(",")})`)
        .limit(5);

      setUsers(profiles || []);
    };

    fetchSuggested();
  }, [currentUserId]);

  const followUser = async (userId: string) => {
    await supabase.from("follows").insert({ follower_id: currentUserId, following_id: userId });
    setUsers((prev) => prev.filter((u) => u.user_id !== userId));
  };

  if (users.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-primary" />
        Suggested for you
      </h3>
      <div className="space-y-3">
        {users.map((u) => {
          const initials = (u.display_name || u.username || "?").slice(0, 2).toUpperCase();
          return (
            <div key={u.user_id} className="flex items-center gap-3">
              <Link to={`/profile/${u.user_id}`}>
                <Avatar className="w-9 h-9">
                  <AvatarImage src={u.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary text-foreground text-xs">{initials}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/profile/${u.user_id}`} className="text-sm font-medium text-foreground hover:underline truncate block">
                  {u.display_name || u.username || "Anonymous"}
                </Link>
                {u.bio && <p className="text-xs text-muted-foreground truncate">{u.bio}</p>}
              </div>
              <button
                onClick={() => followUser(u.user_id)}
                className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
              >
                Follow
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestedUsers;
