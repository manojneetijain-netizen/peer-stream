import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import PostCard from "@/components/feed/PostCard";
import { ArrowLeft, Bookmark as BookmarkIcon, Folder, FolderOpen } from "lucide-react";
import type { PostWithDetails } from "@/hooks/useFeed";

interface BookmarkFolder {
  id: string;
  name: string;
}

const Bookmarks = () => {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("bookmark_folders")
      .select("id, name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setFolders((data as BookmarkFolder[]) || []));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      let query = supabase
        .from("bookmarks")
        .select("post_id, folder_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (activeFolder) {
        query = query.eq("folder_id", activeFolder);
      }

      const { data: bookmarks } = await query;
      if (!bookmarks || bookmarks.length === 0) { setPosts([]); setLoading(false); return; }

      const postIds = bookmarks.map((b) => b.post_id);
      const { data: rawPosts } = await supabase.from("posts").select("*").in("id", postIds);
      if (!rawPosts || rawPosts.length === 0) { setPosts([]); setLoading(false); return; }

      const userIds = [...new Set(rawPosts.map((p) => p.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, username, display_name, avatar_url").in("user_id", userIds);
      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

      const enriched: PostWithDetails[] = rawPosts.map((post) => {
        const profile = profileMap.get(post.user_id);
        return {
          ...post,
          author: { username: profile?.username ?? null, display_name: profile?.display_name ?? null, avatar_url: profile?.avatar_url ?? null },
          likes_count: 0, comments_count: 0, reposts_count: 0,
          liked_by_me: false, reposted_by_me: false, my_reaction: null, reaction_counts: {}, bookmarked_by_me: true,
        };
      });

      const orderMap = new Map(postIds.map((id, i) => [id, i]));
      enriched.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
      setPosts(enriched);
      setLoading(false);
    };
    fetch();
  }, [user, activeFolder]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/feed" className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <BookmarkIcon className="w-4 h-4 text-foreground" />
          <span className="text-lg font-bold gradient-text">Bookmarks</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Folder tabs */}
        {folders.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveFolder(null)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !activeFolder ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <FolderOpen className="w-3 h-3" /> All
            </button>
            {folders.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFolder(f.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  activeFolder === f.id ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Folder className="w-3 h-3" /> {f.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Loading bookmarks...</div>
        ) : posts.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center">
            <h2 className="text-xl font-semibold text-foreground mb-2">No bookmarks yet</h2>
            <p className="text-muted-foreground text-sm">Save posts to read later!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={user.id} onUpdate={() => {}} />
          ))
        )}
      </main>
    </div>
  );
};

export default Bookmarks;
