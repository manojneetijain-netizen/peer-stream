import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";
import { usePendingRequests } from "@/hooks/useFollowRequests";
import { toast } from "sonner";
import {
  User, Bell, Shield, Palette,
  Heart, MessageCircle, UserPlus, Repeat2, Mail,
  Eye, Lock, ChevronRight, Globe,
} from "lucide-react";

type Tab = "account" | "notifications" | "privacy" | "appearance";

interface Prefs {
  likes: boolean;
  comments: boolean;
  follows: boolean;
  messages: boolean;
  reposts: boolean;
}

interface ProfileSettingsProps {
  userId: string;
  userEmail: string;
  profile: any;
}

const tabs: { key: Tab; label: string; icon: typeof User }[] = [
  { key: "account", label: "Account", icon: User },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "privacy", label: "Privacy", icon: Shield },
  { key: "appearance", label: "Appearance", icon: Palette },
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

const ProfileSettings = ({ userId, userEmail, profile }: ProfileSettingsProps) => {
  const { theme, setTheme } = useTheme();
  const { requests } = usePendingRequests(userId);
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [prefs, setPrefs] = useState<Prefs>({ likes: true, comments: true, follows: true, messages: true, reposts: true });
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isPrivate, setIsPrivate] = useState(profile?.is_private || false);

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setUsername(profile.username || "");
      setIsPrivate((profile as any).is_private || false);
    }
  }, [profile]);

  useEffect(() => {
    supabase.rpc("get_my_private_profile" as any).then(({ data }) => {
      const row = Array.isArray(data) ? data[0] : null;
      if (row) {
        setFullName((row as any).full_name || "");
        setPhone((row as any).phone || "");
        setDob((row as any).date_of_birth || "");
        setGender((row as any).gender || "");
      }
    });
    supabase.from("notification_preferences").select("*").eq("user_id", userId).maybeSingle().then(({ data }) => {
      if (data) setPrefs({ likes: data.likes, comments: data.comments, follows: data.follows, messages: data.messages, reposts: data.reposts });
      setPrefsLoading(false);
    });
  }, [userId]);

  const saveProfile = async () => {
    setSaving(true);
    await supabase.from("profiles").update({
      display_name: displayName,
      bio,
      username,
      full_name: fullName || null,
      phone: phone || null,
      date_of_birth: dob || null,
      gender: gender || null,
    } as any).eq("user_id", userId);
    toast.success("Profile updated");
    setSaving(false);
  };

  const saveNotifs = async () => {
    setSaving(true);
    const { data: existing } = await supabase.from("notification_preferences").select("id").eq("user_id", userId).maybeSingle();
    if (existing) {
      await supabase.from("notification_preferences").update(prefs).eq("user_id", userId);
    } else {
      await supabase.from("notification_preferences").insert({ user_id: userId, ...prefs });
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass rounded-2xl overflow-hidden"
    >
      {/* Tab bar */}
      <div className="flex border-b border-border/20 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all duration-200 whitespace-nowrap relative ${
              activeTab === t.key
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {activeTab === t.key && (
              <motion.div
                layoutId="profileSettingsTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
              />
            )}
            <t.icon className={`w-4 h-4 ${activeTab === t.key ? "text-primary" : ""}`} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          {activeTab === "account" && (
            <motion.div key="account" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="space-y-5">
              <motion.div variants={itemVariants} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Full Name</label>
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Display Name</label>
                    <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Username</label>
                  <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Phone</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className="w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Date of Birth</label>
                    <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={`w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${!dob ? "text-muted-foreground" : "text-foreground"}`} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className={`w-full px-3 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${!gender ? "text-muted-foreground" : "text-foreground"}`}>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="non-binary">Non-binary</option>
                      <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Email: {userEmail}</p>
              </motion.div>
              <motion.div variants={itemVariants}>
                <button onClick={saveProfile} disabled={saving} className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </motion.div>
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div key="notifs" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="space-y-3">
              {prefsLoading ? (
                <p className="text-sm text-muted-foreground py-4">Loading...</p>
              ) : (
                <>
                  {notifItems.map(({ key, label, icon: Icon, desc }) => (
                    <motion.div key={key} variants={itemVariants} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-secondary/20 transition-all">
                      <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                      <button
                        onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))}
                        className={`w-10 h-5.5 rounded-full transition-all duration-300 relative shrink-0 ${prefs[key] ? "bg-primary" : "bg-secondary"}`}
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
                    <button onClick={saveNotifs} disabled={saving} className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                      {saving ? "Saving..." : "Save Preferences"}
                    </button>
                  </motion.div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === "privacy" && (
            <motion.div key="privacy" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="space-y-3">
              {/* Public/Private toggle */}
              <motion.div variants={itemVariants} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-secondary/20 transition-all">
                {isPrivate ? <Lock className="w-4 h-4 text-muted-foreground shrink-0" /> : <Globe className="w-4 h-4 text-muted-foreground shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Private Account</p>
                  <p className="text-xs text-muted-foreground">
                    {isPrivate ? "Only approved followers can see your posts" : "Anyone can see your posts and follow you"}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    const newVal = !isPrivate;
                    setIsPrivate(newVal);
                    await supabase.from("profiles").update({ is_private: newVal } as any).eq("user_id", userId);
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

              {/* Follow requests link */}
              {isPrivate && (
                <motion.div variants={itemVariants}>
                  <Link to="/follow-requests" className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-secondary/20 transition-all group">
                    <UserPlus className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Follow Requests</p>
                      <p className="text-xs text-muted-foreground">Review pending follow requests</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-foreground transition-colors">
                      {requests.length > 0 && (
                        <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{requests.length}</span>
                      )}
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </Link>
                </motion.div>
              )}

              {/* Other privacy items */}
              {[
                { icon: Eye, title: "Profile Visibility", desc: isPrivate ? "Only followers can see your full profile" : "Your profile is visible to everyone", action: isPrivate ? "Private" : "Public" },
                { icon: Lock, title: "Direct Messages", desc: "Anyone can send you messages", action: "Everyone" },
                { icon: Shield, title: "Blocked Users", desc: "Manage your blocked accounts", action: "Manage" },
              ].map((item, i) => (
                <motion.div key={i} variants={itemVariants} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-secondary/20 transition-all group cursor-pointer">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
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
            <motion.div key="appearance" variants={contentVariants} initial="initial" animate="animate" exit="exit" className="space-y-5">
              <motion.p variants={itemVariants} className="text-sm text-muted-foreground">Choose your preferred theme</motion.p>
              <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
                {(["dark", "light", "warm"] as const).map((t) => {
                  const previewBg = t === "dark" ? "bg-[hsl(240,10%,4%)]" : t === "light" ? "bg-[hsl(220,14%,92%)]" : "bg-[hsl(30,18%,90%)]";
                  const previewBar = t === "dark" ? "bg-[hsl(240,10%,14%)]" : t === "light" ? "bg-[hsl(220,12%,82%)]" : "bg-[hsl(30,14%,80%)]";
                  return (
                    <motion.button
                      key={t}
                      onClick={() => setTheme(t)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`relative rounded-2xl p-3 border-2 transition-all duration-300 ${
                        theme === t
                          ? "border-primary bg-primary/10"
                          : "border-border/30 hover:border-border/60 bg-secondary/20"
                      }`}
                    >
                      <div className={`w-full aspect-[4/3] rounded-xl mb-2 ${previewBg}`}>
                        <div className="p-2 space-y-1.5">
                          <div className={`h-2 rounded-full w-3/4 ${previewBar}`} />
                          <div className={`h-2 rounded-full w-1/2 ${previewBar}`} />
                        </div>
                      </div>
                      <p className="text-sm font-medium text-foreground capitalize">{t} Mode</p>
                      {theme === t && (
                        <motion.div
                          layoutId="profileThemeIndicator"
                          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                          transition={{ type: "spring", bounce: 0.2 }}
                        >
                          <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ProfileSettings;
