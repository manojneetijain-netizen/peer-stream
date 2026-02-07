import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Search, X } from "lucide-react";

interface SearchResult {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

const UserSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url")
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(8);
      setResults(data || []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 glass rounded-xl px-3 py-2">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search users..."
          className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none"
        />
        {query && (
          <button onClick={() => { setQuery(""); setResults([]); }} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {open && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 glass rounded-xl overflow-hidden z-50 border border-border/30">
          {searching ? (
            <div className="p-3 text-sm text-muted-foreground text-center">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">No users found</div>
          ) : (
            results.map((r) => {
              const initials = (r.display_name || r.username || "?").slice(0, 2).toUpperCase();
              return (
                <Link
                  key={r.user_id}
                  to={`/profile/${r.user_id}`}
                  onClick={() => { setOpen(false); setQuery(""); }}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/50 transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={r.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary text-foreground text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.display_name || r.username || "Anonymous"}</p>
                    {r.username && <p className="text-xs text-muted-foreground">@{r.username}</p>}
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearch;
