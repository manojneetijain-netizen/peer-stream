import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Bell, Heart, MessageCircle, UserPlus, Repeat2, Mail } from "lucide-react";
import { toast } from "sonner";

interface Prefs {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  messages: boolean;
  reposts: boolean;
}

const NotificationSettings = () => {
  const { user, loading: authLoading } = useAuth();
  const [prefs, setPrefs] = useState<Prefs>({ likes: true, comments: true, follows: true, messages: true, reposts: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setPrefs({ likes: data.likes, comments: data.comments, follows: data.follows, messages: data.messages, reposts: data.reposts });
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { data: existing } = await supabase
      .from("notification_preferences")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("notification_preferences").update(prefs).eq("user_id", user.id);
    } else {
      await supabase.from("notification_preferences").insert({ user_id: user.id, ...prefs });
    }
    setSaving(false);
    toast.success("Preferences saved");
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const toggleItems = [
    { key: "likes" as keyof Prefs, label: "Likes", icon: Heart, desc: "When someone likes your post" },
    { key: "comments" as keyof Prefs, label: "Comments", icon: MessageCircle, desc: "When someone comments on your post" },
    { key: "follows" as keyof Prefs, label: "Follows", icon: UserPlus, desc: "When someone follows you" },
    { key: "messages" as keyof Prefs, label: "Messages", icon: Mail, desc: "When you receive a message" },
    { key: "reposts" as keyof Prefs, label: "Reposts", icon: Repeat2, desc: "When someone reposts your post" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/feed" className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <Bell className="w-4 h-4 text-foreground" />
          <span className="text-lg font-bold gradient-text">Notification Settings</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="glass rounded-2xl p-4 space-y-1">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          ) : (
            toggleItems.map(({ key, label, icon: Icon, desc }) => (
              <div key={key} className="flex items-center gap-3 py-3 px-2 rounded-lg hover:bg-secondary/20 transition-colors">
                <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <button
                  onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))}
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    prefs[key] ? "bg-primary" : "bg-secondary"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-foreground transition-transform ${
                      prefs[key] ? "left-[18px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            ))
          )}
          <button
            onClick={save}
            disabled={saving || loading}
            className="w-full mt-4 px-4 py-2 rounded-full bg-gradient-to-r from-pulse-blue to-pulse-cyan text-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default NotificationSettings;
