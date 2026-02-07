import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import ThemeToggle from "@/components/feed/ThemeToggle";
import { toast } from "sonner";
import {
  ArrowLeft, User, Bell, Shield, Palette, LogOut,
  Heart, MessageCircle, UserPlus, Repeat2, Mail,
  Eye, Lock, ChevronRight,
} from "lucide-react";

type Tab = "account" | "notifications" | "privacy" | "appearance";

interface Prefs {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  messages: boolean;
  reposts: boolean;
}

const tabs: { key: Tab; label: string; icon: typeof User }[] = [
  { key: "account", label: "Account", icon: User },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "privacy", label: "Privacy", icon: Shield },
  { key: "appearance", label: "Appearance", icon: Palette },
];

const Settings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [profile, setProfile] = useState<any>(null);
  const [prefs, setPrefs] = useState<Prefs>({ likes: true, comments: true, follows: true, messages: true, reposts: true });
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile data
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || "");
        setBio(data.bio || "");
        setUsername(data.username || "");
      }
    });
    supabase.from("notification_preferences").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setPrefs({ likes: data.likes, comments: data.comments, follows: data.follows, messages: data.messages, reposts: data.reposts });
      setPrefsLoading(false);
    });
  }, [user]);

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const initials = (profile?.display_name || profile?.username || "?").slice(0, 2).toUpperCase();

  const saveProfile = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ display_name: displayName, bio, username }).eq("user_id", user.id);
    toast.success("Profile updated");
    setSaving(false);
  };

  const saveNotifs = async () => {
    setSaving(true);
    const { data: existing } = await supabase.from("notification_preferences").select("id").eq("user_id", user.id).maybeSingle();
    if (existing) {
      await supabase.from("notification_preferences").update(prefs).eq("user_id", user.id);
    } else {
      await supabase.from("notification_preferences").insert({ user_id: user.id, ...prefs });
    }
    toast.success("Notification preferences saved");
    setSaving(false);
  };

  const notifItems = [
    { key: "likes" as keyof Prefs, label: "Likes", icon: Heart, desc: "When someone likes your post" },
    { key: "comments" as keyof Prefs, label: "Comments", icon: MessageCircle, desc: "When someone comments" },
    { key: "follows" as keyof Prefs, label: "Follows", icon: UserPlus, desc: "When someone follows you" },
    { key: "messages" as keyof Prefs, label: "Messages", icon: Mail, desc: "When you receive a message" },
    { key: "reposts" as keyof Prefs, label: "Reposts", icon: Repeat2, desc: "When someone reposts" },
  ];

  const contentVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, staggerChildren: 0.05 } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
  };

  const itemVariants = {
    initial: { opacity: 0, x: -8 },
    animate: { opacity: 1, x: 0 },
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/feed" className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-lg font-bold gradient-text">Settings</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar tabs */}
          <motion.nav
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-2 md:w-56 shrink-0 flex md:flex-col gap-1 overflow-x-auto"
          >
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap relative ${
                  activeTab === t.key
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                }`}
              >
                {activeTab === t.key && (
                  <motion.div
                    layoutId="settingsTab"
                    className="absolute inset-0 bg-gradient-to-r from-primary/15 to-accent/10 rounded-xl"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <t.icon className={`w-4 h-4 relative z-10 ${activeTab === t.key ? "text-primary" : ""}`} />
                <span className="relative z-10">{t.label}</span>
              </button>
            ))}

            <div className="mt-auto pt-4 border-t border-border/20 md:mt-4">
              <button
                onClick={signOut}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-all w-full"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </motion.nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {activeTab === "account" && (
                <motion.div key="account" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="glass rounded-2xl p-6 space-y-6">
                  <motion.h3 variants={itemVariants} className="text-base font-semibold text-foreground">Account Settings</motion.h3>

                  <motion.div variants={itemVariants} className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 ring-2 ring-primary/30">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-secondary text-foreground">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-foreground">{profile?.display_name || "Anonymous"}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants} className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Display Name</label>
                      <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Username</label>
                      <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bio</label>
                      <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none" />
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <button onClick={saveProfile} disabled={saving} className="px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </motion.div>
                </motion.div>
              )}

              {activeTab === "notifications" && (
                <motion.div key="notifs" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="glass rounded-2xl p-6 space-y-4">
                  <motion.h3 variants={itemVariants} className="text-base font-semibold text-foreground">Notification Preferences</motion.h3>
                  {prefsLoading ? (
                    <p className="text-sm text-muted-foreground py-4">Loading...</p>
                  ) : (
                    <>
                      {notifItems.map(({ key, label, icon: Icon, desc }) => (
                        <motion.div key={key} variants={itemVariants} className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-secondary/20 transition-all">
                          <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{label}</p>
                            <p className="text-xs text-muted-foreground">{desc}</p>
                          </div>
                          <button
                            onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))}
                            className={`w-11 h-6 rounded-full transition-all duration-300 relative ${prefs[key] ? "bg-primary" : "bg-secondary"}`}
                          >
                            <motion.span
                              animate={{ x: prefs[key] ? 20 : 2 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              className="absolute top-0.5 w-5 h-5 rounded-full bg-foreground shadow-sm"
                            />
                          </button>
                        </motion.div>
                      ))}
                      <motion.div variants={itemVariants}>
                        <button onClick={saveNotifs} disabled={saving} className="px-6 py-2.5 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 mt-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
                          {saving ? "Saving..." : "Save Preferences"}
                        </button>
                      </motion.div>
                    </>
                  )}
                </motion.div>
              )}

              {activeTab === "privacy" && (
                <motion.div key="privacy" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="glass rounded-2xl p-6 space-y-4">
                  <motion.h3 variants={itemVariants} className="text-base font-semibold text-foreground">Privacy Controls</motion.h3>

                  {[
                    { icon: Eye, title: "Profile Visibility", desc: "Your profile is visible to everyone", action: "Public" },
                    { icon: Lock, title: "Direct Messages", desc: "Anyone can send you messages", action: "Everyone" },
                    { icon: Shield, title: "Blocked Users", desc: "Manage your blocked accounts", action: "Manage", link: true },
                  ].map((item, i) => (
                    <motion.div key={i} variants={itemVariants} className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-secondary/20 transition-all group">
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-foreground transition-colors">
                        {item.action}
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {activeTab === "appearance" && (
                <motion.div key="appearance" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="glass rounded-2xl p-6 space-y-6">
                  <motion.h3 variants={itemVariants} className="text-base font-semibold text-foreground">Appearance</motion.h3>

                  <motion.div variants={itemVariants} className="space-y-4">
                    <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                    <div className="grid grid-cols-2 gap-3">
                      {(["dark", "light"] as const).map((t) => (
                        <motion.button
                          key={t}
                          onClick={() => { if (theme !== t) toggleTheme(); }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`relative rounded-2xl p-4 border-2 transition-all duration-300 ${
                            theme === t
                              ? "border-primary bg-primary/10"
                              : "border-border/30 hover:border-border/60 bg-secondary/20"
                          }`}
                        >
                          <div className={`w-full aspect-[4/3] rounded-xl mb-3 ${t === "dark" ? "bg-[hsl(240,10%,4%)]" : "bg-[hsl(0,0%,96%)]"}`}>
                            <div className="p-2 space-y-1.5">
                              <div className={`h-2 rounded-full w-3/4 ${t === "dark" ? "bg-[hsl(240,10%,14%)]" : "bg-[hsl(240,6%,85%)]"}`} />
                              <div className={`h-2 rounded-full w-1/2 ${t === "dark" ? "bg-[hsl(240,10%,14%)]" : "bg-[hsl(240,6%,85%)]"}`} />
                              <div className={`h-6 rounded-lg mt-1 ${t === "dark" ? "bg-[hsl(240,10%,8%)]" : "bg-[hsl(0,0%,100%)]"} border ${t === "dark" ? "border-[hsl(240,10%,14%)]" : "border-[hsl(240,6%,90%)]"}`} />
                            </div>
                          </div>
                          <p className="text-sm font-medium text-foreground capitalize">{t} Mode</p>
                          {theme === t && (
                            <motion.div
                              layoutId="themeIndicator"
                              className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                              transition={{ type: "spring", bounce: 0.2 }}
                            >
                              <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </motion.div>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;
