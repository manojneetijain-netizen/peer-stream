import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Hash, TrendingUp } from "lucide-react";

interface TrendingTag {
  name: string;
  count: number;
}

const TrendingPage = () => {
  const [trending, setTrending] = useState<TrendingTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      // Get post_hashtags from last 7 days
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data: recentPH } = await supabase
        .from("post_hashtags")
        .select("hashtag_id")
        .limit(1000);

      if (!recentPH || recentPH.length === 0) {
        setTrending([]);
        setLoading(false);
        return;
      }

      // Count per hashtag
      const counts = new Map<string, number>();
      recentPH.forEach((ph: any) => {
        counts.set(ph.hashtag_id, (counts.get(ph.hashtag_id) || 0) + 1);
      });

      const topIds = [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([id]) => id);

      if (topIds.length === 0) {
        setTrending([]);
        setLoading(false);
        return;
      }

      const { data: hashtags } = await supabase
        .from("hashtags")
        .select("id, name")
        .in("id", topIds);

      const hashtagMap = new Map((hashtags || []).map((h: any) => [h.id, h.name]));

      setTrending(
        topIds
          .map((id) => ({ name: hashtagMap.get(id) || "", count: counts.get(id) || 0 }))
          .filter((t) => t.name)
      );
      setLoading(false);
    };

    fetchTrending();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/feed" className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <TrendingUp className="w-5 h-5 text-primary" />
          <span className="text-lg font-bold gradient-text">Trending</span>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-2">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading...</div>
        ) : trending.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-muted-foreground">No trending hashtags yet. Start posting with #hashtags!</p>
          </div>
        ) : (
          trending.map((t, i) => (
            <Link
              key={t.name}
              to={`/hashtag/${t.name}`}
              className="flex items-center gap-4 glass rounded-xl p-4 hover:bg-secondary/30 transition-colors"
            >
              <span className="text-lg font-bold text-muted-foreground w-6">{i + 1}</span>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-foreground">{t.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{t.count} {t.count === 1 ? "post" : "posts"}</p>
              </div>
            </Link>
          ))
        )}
      </main>
    </div>
  );
};

export default TrendingPage;
