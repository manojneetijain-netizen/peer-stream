import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Eye, TrendingUp, Users, Heart } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface AnalyticsData {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalReposts: number;
  engagementRate: number;
  followerCount: number;
  viewsByDay: { date: string; views: number }[];
  engagementByDay: { date: string; likes: number; comments: number; reposts: number }[];
  followerGrowth: { date: string; followers: number }[];
  topPosts: { id: string; content: string; views: number; likes: number }[];
}

const Analytics = () => {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);

      // Get user's posts
      const { data: posts } = await supabase
        .from("posts")
        .select("id, content, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const postIds = (posts || []).map((p) => p.id);

      if (postIds.length === 0) {
        setData({
          totalViews: 0, totalLikes: 0, totalComments: 0, totalReposts: 0,
          engagementRate: 0, followerCount: 0,
          viewsByDay: [], engagementByDay: [], followerGrowth: [], topPosts: [],
        });
        setLoading(false);
        return;
      }

      const [viewsRes, likesRes, commentsRes, repostsRes, followersRes, snapshotsRes] = await Promise.all([
        supabase.from("post_views").select("post_id, created_at").in("post_id", postIds),
        supabase.from("likes").select("post_id, created_at").in("post_id", postIds),
        supabase.from("comments").select("post_id, created_at").in("post_id", postIds),
        supabase.from("reposts").select("post_id, created_at").in("post_id", postIds),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("follower_snapshots").select("*").eq("user_id", user.id).order("snapshot_date", { ascending: true }).limit(30),
      ]);

      const views = viewsRes.data || [];
      const likes = likesRes.data || [];
      const comments = commentsRes.data || [];
      const reposts = (repostsRes as any).data || [];
      const followerCount = followersRes.count ?? 0;
      const snapshots = snapshotsRes.data || [];

      // Save today's follower snapshot
      await supabase.from("follower_snapshots").upsert(
        { user_id: user.id, follower_count: followerCount, snapshot_date: new Date().toISOString().split("T")[0] },
        { onConflict: "user_id,snapshot_date" }
      );

      const totalViews = views.length;
      const totalLikes = likes.length;
      const totalComments = comments.length;
      const totalReposts = reposts.length;
      const totalEngagements = totalLikes + totalComments + totalReposts;
      const engagementRate = totalViews > 0 ? (totalEngagements / totalViews) * 100 : 0;

      // Group by day (last 14 days)
      const last14 = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        return d.toISOString().split("T")[0];
      });

      const viewsByDay = last14.map((date) => ({
        date: date.slice(5),
        views: views.filter((v) => v.created_at.startsWith(date)).length,
      }));

      const engagementByDay = last14.map((date) => ({
        date: date.slice(5),
        likes: likes.filter((l) => l.created_at.startsWith(date)).length,
        comments: comments.filter((c) => c.created_at.startsWith(date)).length,
        reposts: reposts.filter((r: any) => r.created_at.startsWith(date)).length,
      }));

      // Follower growth from snapshots
      const followerGrowth = snapshots.length > 0
        ? snapshots.map((s: any) => ({ date: s.snapshot_date.slice(5), followers: s.follower_count }))
        : [{ date: new Date().toISOString().split("T")[0].slice(5), followers: followerCount }];

      // Top posts by views
      const viewCountMap = new Map<string, number>();
      views.forEach((v) => viewCountMap.set(v.post_id, (viewCountMap.get(v.post_id) || 0) + 1));
      const likeCountMap = new Map<string, number>();
      likes.forEach((l) => likeCountMap.set(l.post_id, (likeCountMap.get(l.post_id) || 0) + 1));

      const topPosts = (posts || [])
        .map((p) => ({
          id: p.id,
          content: p.content?.slice(0, 60) || "(image post)",
          views: viewCountMap.get(p.id) || 0,
          likes: likeCountMap.get(p.id) || 0,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      setData({
        totalViews, totalLikes, totalComments, totalReposts,
        engagementRate, followerCount, viewsByDay, engagementByDay, followerGrowth, topPosts,
      });
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to={`/profile/${user.id}`} className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-lg font-bold gradient-text">Analytics</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading analytics...</div>
        ) : !data ? null : (
          <>
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Views", value: data.totalViews, icon: Eye, color: "text-accent" },
                { label: "Engagement Rate", value: `${data.engagementRate.toFixed(1)}%`, icon: TrendingUp, color: "text-primary" },
                { label: "Followers", value: data.followerCount, icon: Users, color: "text-accent" },
                { label: "Total Likes", value: data.totalLikes, icon: Heart, color: "text-destructive" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="glass rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${color}`} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                </div>
              ))}
            </div>

            {/* Views chart */}
            <div className="glass rounded-2xl p-4">
              <h3 className="text-sm font-medium text-foreground mb-4">Views (Last 14 Days)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.viewsByDay}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(222, 100%, 50%)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(222, 100%, 50%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: "hsl(210, 20%, 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(210, 20%, 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(240, 10%, 6%)", border: "1px solid hsl(240, 10%, 16%)", borderRadius: 12, color: "hsl(210, 40%, 98%)" }} />
                  <Area type="monotone" dataKey="views" stroke="hsl(222, 100%, 50%)" fill="url(#viewsGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Engagement chart */}
            <div className="glass rounded-2xl p-4">
              <h3 className="text-sm font-medium text-foreground mb-4">Engagement (Last 14 Days)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.engagementByDay}>
                  <XAxis dataKey="date" tick={{ fill: "hsl(210, 20%, 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(210, 20%, 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(240, 10%, 6%)", border: "1px solid hsl(240, 10%, 16%)", borderRadius: 12, color: "hsl(210, 40%, 98%)" }} />
                  <Bar dataKey="likes" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="comments" fill="hsl(222, 100%, 50%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="reposts" fill="hsl(190, 100%, 44%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Follower growth */}
            <div className="glass rounded-2xl p-4">
              <h3 className="text-sm font-medium text-foreground mb-4">Follower Growth</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.followerGrowth}>
                  <defs>
                    <linearGradient id="followerGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(190, 100%, 44%)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(190, 100%, 44%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: "hsl(210, 20%, 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "hsl(210, 20%, 60%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(240, 10%, 6%)", border: "1px solid hsl(240, 10%, 16%)", borderRadius: 12, color: "hsl(210, 40%, 98%)" }} />
                  <Area type="monotone" dataKey="followers" stroke="hsl(190, 100%, 44%)" fill="url(#followerGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Top posts */}
            <div className="glass rounded-2xl p-4">
              <h3 className="text-sm font-medium text-foreground mb-3">Top Posts</h3>
              {data.topPosts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No post data yet</p>
              ) : (
                <div className="space-y-2">
                  {data.topPosts.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                      <span className="text-xs font-bold text-muted-foreground w-5">#{i + 1}</span>
                      <span className="flex-1 text-sm text-foreground truncate">{p.content}</span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{p.views}</span>
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{p.likes}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Analytics;
