import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { usePendingRequests } from "@/hooks/useFollowRequests";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
  ArrowLeft, User, Bell, Shield, Palette, HelpCircle,
  Heart, MessageCircle, UserPlus, Repeat2, Mail,
  Eye, Lock, ChevronRight, Globe, LogOut,
  Camera, Trash2, AlertTriangle,
} from "lucide-react";

type Tab = "profile" | "account" | "privacy" | "notifications" | "help";

interface Prefs {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  messages: boolean;
  reposts: boolean;
}

const tabs: { key: Tab; label: string; icon: typeof User }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "account", label: "Account", icon: Shield },
  { key: "privacy", label: "Privacy", icon: Lock },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "help", label: "Help & Support", icon: HelpCircle },
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

const Settings = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [profile, setProfile] = useState<any>(null);
  const [prefs, setPrefs] = useState<Prefs>({ likes: true, comments: true, follows: true, messages: true, reposts: true });
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const pendingRequests = usePendingRequests(user?.id || "");

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("id, user_id, username, display_name, avatar_url, cover_url, bio, is_verified, is_private, pinned_post_id, created_at, updated_at")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile(data as any);
          setDisplayName(data.display_name || "");
          setBio(data.bio || "");
          setUsername(data.username || "");
          setIsPrivate((data as any).is_private || false);
        }
      });
    supabase.rpc("get_my_private_profile" as any).then(({ data }) => {
      const row = Array.isArray(data) ? data[0] : null;
      if (row) {
        setFullName((row as any).full_name || "");
        setPhone((row as any).phone || "");
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
    await supabase.from("profiles").update({
      display_name: displayName,
      bio,
      username,
      full_name: fullName || null,
      phone: phone || null,
    } as any).eq("user_id", user.id);
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

  const bioCharCount = bio.length;
  const maxBio = 240;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left sidebar nav */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-border/20 py-6 px-3 sticky top-0 h-screen">
        <div className="mb-6 px-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <span className="text-xs font-black text-primary-foreground">P</span>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Pulse</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Settings</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                activeTab === t.key
                  ? "text-foreground bg-secondary/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
              }`}
            >
              <t.icon className={`w-4 h-4 ${activeTab === t.key ? "text-primary" : ""}`} />
              {t.label}
              {t.key === "notifications" && (
                <span className="ml-auto bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">3</span>
              )}
            </button>
          ))}
        </nav>

        {/* Plan info */}
        <div className="mt-auto space-y-3 px-1">
          <div className="rounded-xl bg-secondary/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Current Plan</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-foreground">Pulse Pro</p>
              <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-bold">ACTIVE</span>
            </div>
            <button className="mt-2 w-full text-xs font-medium px-3 py-1.5 rounded-lg bg-secondary/60 text-foreground hover:bg-secondary transition-colors">
              Manage Plan
            </button>
          </div>

          <div className="flex items-center gap-2 px-2">
            <Avatar className="w-7 h-7">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="bg-secondary text-foreground text-[10px]">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{profile?.display_name || "Anonymous"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass-surface border-b border-border/20">
        <div className="px-4 h-14 flex items-center gap-3">
          <Link to="/feed" className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-lg font-bold gradient-text">Settings</span>
        </div>
        {/* Mobile tab scrollbar */}
        <div className="flex overflow-x-auto px-4 pb-2 gap-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === t.key
                  ? "bg-primary/15 text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-w-0 md:py-8 md:px-10 px-4 py-6 mt-24 md:mt-0 max-w-3xl">
        <AnimatePresence mode="wait">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <motion.div key="profile" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="space-y-8">
              {/* Header */}
              <motion.div variants={itemVariants} className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
                  <p className="text-sm text-muted-foreground mt-1">Manage your public presence and account identity.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setDisplayName(profile?.display_name || "");
                      setBio(profile?.bio || "");
                      setUsername(profile?.username || "");
                    }}
                    className="px-4 py-2 rounded-lg border border-border/50 text-sm font-medium text-foreground hover:bg-secondary/30 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="px-5 py-2 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </motion.div>

              {/* Avatar section */}
              <motion.div variants={itemVariants} className="flex items-start gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 ring-2 ring-border/30">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-secondary text-foreground text-lg">{initials}</AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-1">Your Avatar</h3>
                  <p className="text-xs text-muted-foreground mb-3">High-resolution square images work best. Max size 2MB.</p>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 rounded-lg bg-secondary/60 text-foreground text-xs font-medium hover:bg-secondary transition-colors">
                      Upload New
                    </button>
                    <button className="px-3 py-1.5 text-destructive text-xs font-medium hover:underline">
                      Remove
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* Form fields */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Display Name</label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-secondary/30 border border-border/40 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Username</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                    <input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-secondary/30 border border-border/40 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, maxBio))}
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-xl bg-secondary/30 border border-border/40 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
                />
                <p className="text-xs text-muted-foreground text-right mt-1">{bioCharCount} / {maxBio} characters</p>
              </motion.div>

              {/* Divider */}
              <motion.div variants={itemVariants} className="border-t border-border/20" />

              {/* Linked Accounts */}
              <motion.div variants={itemVariants}>
                <h3 className="text-base font-semibold text-foreground mb-1">Linked Accounts</h3>
                <p className="text-sm text-muted-foreground mb-4">Connect your services for a seamless workflow.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-secondary/30 border border-border/30 p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold text-sm">G</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Google Account</p>
                      <p className="text-xs text-accent font-semibold">CONNECTED</p>
                    </div>
                    <button className="text-xs text-muted-foreground hover:text-foreground">Disconnect</button>
                  </div>
                  <div className="rounded-xl bg-secondary/30 border border-border/30 p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground font-bold text-sm">A</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Apple ID</p>
                      <p className="text-xs text-muted-foreground">NOT LINKED</p>
                    </div>
                    <button className="text-xs text-primary font-semibold hover:underline">Link Account</button>
                  </div>
                </div>
              </motion.div>

              {/* Divider */}
              <motion.div variants={itemVariants} className="border-t border-border/20" />

              {/* Privacy & Visibility */}
              <motion.div variants={itemVariants}>
                <h3 className="text-base font-semibold text-foreground mb-1">Privacy & Visibility</h3>
                <p className="text-sm text-muted-foreground mb-4">Control how you appear to the Pulse community.</p>
                <div className="space-y-4">
                  {[
                    {
                      title: "Public Profile",
                      desc: "Allow search engines and other users to find your profile.",
                      checked: !isPrivate,
                      onToggle: async () => {
                        const newVal = !isPrivate;
                        setIsPrivate(newVal);
                        await supabase.from("profiles").update({ is_private: newVal } as any).eq("user_id", user.id);
                        toast.success(newVal ? "Account set to private" : "Account set to public");
                      },
                    },
                    {
                      title: "Show Online Status",
                      desc: "Display a green pulse when you're active.",
                      checked: false,
                      onToggle: () => {},
                    },
                    {
                      title: "Usage Analytics",
                      desc: "Share anonymous data to help us improve Pulse performance.",
                      checked: true,
                      onToggle: () => {},
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <button
                        onClick={item.onToggle}
                        className={`w-10 rounded-full transition-all duration-300 relative shrink-0 ${item.checked ? "bg-primary" : "bg-secondary"}`}
                        style={{ width: 40, height: 22 }}
                      >
                        <motion.span
                          animate={{ x: item.checked ? 18 : 2 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="absolute top-0.5 w-[18px] h-[18px] rounded-full bg-foreground shadow-sm"
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Divider */}
              <motion.div variants={itemVariants} className="border-t border-border/20" />

              {/* Danger Zone */}
              <motion.div variants={itemVariants} className="rounded-2xl bg-destructive/5 border border-destructive/20 p-6">
                <h3 className="text-base font-semibold text-destructive mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Danger Zone
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <div className="flex gap-3">
                  <button className="px-4 py-2 rounded-lg border border-border/50 text-sm font-medium text-foreground hover:bg-secondary/30 transition-colors">
                    Deactivate Account
                  </button>
                  <button className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90 transition-all">
                    Delete permanently
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Account Tab */}
          {activeTab === "account" && (
            <motion.div key="account" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
              <motion.div variants={itemVariants}>
                <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage your account security and preferences.</p>
              </motion.div>
              <motion.div variants={itemVariants} className="rounded-xl bg-secondary/20 p-4">
                <p className="text-sm text-foreground font-medium">Email: {user.email}</p>
                <p className="text-xs text-muted-foreground mt-1">To change your email, please contact support.</p>
              </motion.div>
            </motion.div>
          )}

          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <motion.div key="privacy" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
              <motion.div variants={itemVariants}>
                <h1 className="text-2xl font-bold text-foreground">Privacy Controls</h1>
                <p className="text-sm text-muted-foreground mt-1">Manage your visibility and data.</p>
              </motion.div>

              {/* Private toggle */}
              <motion.div variants={itemVariants} className="flex items-center gap-3 py-3 px-4 rounded-xl bg-secondary/20">
                {isPrivate ? <Lock className="w-5 h-5 text-muted-foreground" /> : <Globe className="w-5 h-5 text-muted-foreground" />}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Private Account</p>
                  <p className="text-xs text-muted-foreground">
                    {isPrivate ? "Only approved followers can see your posts" : "Anyone can see your posts"}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const newVal = !isPrivate;
                    setIsPrivate(newVal);
                    await supabase.from("profiles").update({ is_private: newVal } as any).eq("user_id", user.id);
                    toast.success(newVal ? "Account set to private" : "Account set to public");
                  }}
                  className={`w-10 rounded-full transition-all duration-300 relative shrink-0 ${isPrivate ? "bg-primary" : "bg-secondary"}`}
                  style={{ width: 40, height: 22 }}
                >
                  <motion.span
                    animate={{ x: isPrivate ? 18 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-0.5 w-[18px] h-[18px] rounded-full bg-foreground shadow-sm"
                  />
                </button>
              </motion.div>

              {isPrivate && (
                <motion.div variants={itemVariants}>
                  <Link to="/follow-requests" className="flex items-center gap-3 py-3 px-4 rounded-xl bg-secondary/20 group">
                    <UserPlus className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Follow Requests</p>
                      <p className="text-xs text-muted-foreground">Review pending requests</p>
                    </div>
                    {pendingRequests.requests.length > 0 && (
                      <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {pendingRequests.requests.length}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </Link>
                </motion.div>
              )}

              {[
                { icon: Eye, title: "Profile Visibility", desc: isPrivate ? "Only followers see your profile" : "Visible to everyone", action: isPrivate ? "Private" : "Public" },
                { icon: Shield, title: "Blocked Users", desc: "Manage blocked accounts", action: "Manage" },
              ].map((item, i) => (
                <motion.div key={i} variants={itemVariants} className="flex items-center gap-3 py-3 px-4 rounded-xl bg-secondary/20 cursor-pointer group">
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-foreground">
                    {item.action}
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <motion.div key="notifs" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
              <motion.div variants={itemVariants}>
                <h1 className="text-2xl font-bold text-foreground">Notification Preferences</h1>
                <p className="text-sm text-muted-foreground mt-1">Choose what you want to be notified about.</p>
              </motion.div>
              {prefsLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : (
                <div className="space-y-3">
                  {notifItems.map(({ key, label, icon: Icon, desc }) => (
                    <motion.div key={key} variants={itemVariants} className="flex items-center gap-3 py-3 px-4 rounded-xl bg-secondary/20">
                      <Icon className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <button
                        onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))}
                        className={`w-10 rounded-full transition-all duration-300 relative shrink-0 ${prefs[key] ? "bg-primary" : "bg-secondary"}`}
                        style={{ width: 40, height: 22 }}
                      >
                        <motion.span
                          animate={{ x: prefs[key] ? 18 : 2 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="absolute top-0.5 w-[18px] h-[18px] rounded-full bg-foreground shadow-sm"
                        />
                      </button>
                    </motion.div>
                  ))}
                  <motion.div variants={itemVariants} className="pt-2">
                    <button onClick={saveNotifs} disabled={saving} className="px-6 py-2.5 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
                      {saving ? "Saving..." : "Save Preferences"}
                    </button>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {/* Help Tab */}
          {activeTab === "help" && (
            <motion.div key="help" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
              <motion.div variants={itemVariants}>
                <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
                <p className="text-sm text-muted-foreground mt-1">Need assistance? We're here to help.</p>
              </motion.div>
              <motion.div variants={itemVariants} className="rounded-xl bg-secondary/20 p-6 text-center">
                <HelpCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Contact us at <span className="text-primary font-medium">support@pulse.io</span>
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Settings;
