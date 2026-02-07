import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";

const Feed = () => {
  const { user, loading, signOut } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold gradient-text">Pulse</span>
          <button
            onClick={signOut}
            className="p-2 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="glass rounded-2xl p-6 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Welcome to Pulse 🎉</h2>
          <p className="text-muted-foreground text-sm">
            Your feed is empty. The social features are coming next — posts, likes, comments, and more.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Feed;
