import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFeed } from "@/hooks/useFeed";
import CreatePost from "@/components/feed/CreatePost";
import PostCard from "@/components/feed/PostCard";
import { LogOut, User, Bell } from "lucide-react";

const Feed = () => {
  const { user, loading, signOut } = useAuth();
  const { posts, loading: feedLoading, refetch } = useFeed(user?.id);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold gradient-text">Pulse</span>
          <div className="flex items-center gap-1">
            <Link to={`/profile/${user.id}`} className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
              <User className="w-4 h-4" />
            </Link>
            <button onClick={signOut} className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <CreatePost userId={user.id} onCreated={refetch} />

        {feedLoading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading feed...</div>
        ) : posts.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">Welcome to Pulse 🎉</h2>
            <p className="text-muted-foreground text-sm">No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={user.id} onUpdate={refetch} />
          ))
        )}
      </main>
    </div>
  );
};

export default Feed;
