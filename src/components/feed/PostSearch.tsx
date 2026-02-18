import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, X, Hash, TrendingUp } from "lucide-react";

const PostSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    setOpen(true);

    // Search posts by content
    const { data: posts } = await supabase
      .from("posts")
      .select("id, content, user_id, created_at")
      .ilike("content", `%${q}%`)
      .order("created_at", { ascending: false })
      .limit(10);

    // Also search hashtags
    const { data: hashtags } = await supabase
      .from("hashtags")
      .select("name")
      .ilike("name", `%${q}%`)
      .limit(5);

    // Search users
    const { data: users } = await supabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url")
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .limit(5);

    setResults([
      ...(hashtags || []).map((h: any) => ({ type: "hashtag", name: h.name })),
      ...(users || []).map((u: any) => ({ type: "user", ...u })),
      ...(posts || []).map((p: any) => ({ type: "post", ...p })),
    ]);
    setSearching(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 glass rounded-xl px-3 py-2.5">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query.trim() && setOpen(true)}
          placeholder="Search Pulse"
          className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); setOpen(false); }} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
        <Link to="/trending" className="text-muted-foreground hover:text-foreground">
          <TrendingUp className="w-4 h-4" />
        </Link>
      </div>

      {open && query.trim() && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 glass rounded-xl overflow-hidden z-50 border border-border/30 max-h-80 overflow-y-auto">
            {searching ? (
              <div className="p-3 text-sm text-muted-foreground text-center">Searching...</div>
            ) : results.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">No results</div>
            ) : (
              results.map((r, i) => {
                if (r.type === "hashtag") {
                  return (
                    <Link
                      key={`h-${r.name}`}
                      to={`/hashtag/${r.name}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 transition-colors"
                    >
                      <Hash className="w-4 h-4 text-primary" />
                      <span className="text-sm text-foreground font-medium">#{r.name}</span>
                    </Link>
                  );
                }
                if (r.type === "user") {
                  return (
                    <Link
                      key={`u-${r.user_id}`}
                      to={`/profile/${r.user_id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-foreground">
                        {(r.display_name || r.username || "?").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.display_name || r.username}</p>
                        {r.username && <p className="text-xs text-muted-foreground">@{r.username}</p>}
                      </div>
                    </Link>
                  );
                }
                return (
                  <div key={`p-${r.id}`} className="px-3 py-2.5 hover:bg-secondary/50 transition-colors">
                    <p className="text-sm text-foreground line-clamp-2">{r.content}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default PostSearch;
