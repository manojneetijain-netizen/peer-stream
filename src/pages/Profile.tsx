import { useState, useRef } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useProfileStats, useIsFollowing } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Camera, Check, X } from "lucide-react";

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user, loading: authLoading } = useAuth();
  const targetId = userId || user?.id;
  const isOwnProfile = targetId === user?.id;

  const { profile, loading, refetch } = useProfile(targetId);
  const stats = useProfileStats(targetId);
  const { isFollowing, toggle: toggleFollow, loading: followLoading } = useIsFollowing(user?.id, targetId);

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (authLoading || loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const startEdit = () => {
    setDisplayName(profile?.display_name || "");
    setBio(profile?.bio || "");
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ display_name: displayName, bio })
      .eq("user_id", user.id);
    setEditing(false);
    refetch();
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
    setUploading(false);
    refetch();
  };

  const initials = (profile?.display_name || profile?.username || "?").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/feed" className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-lg font-bold gradient-text">Profile</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="glass rounded-2xl p-6">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xl bg-secondary text-foreground">{initials}</AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
                </>
              )}
            </div>

            {editing ? (
              <div className="mt-4 w-full max-w-xs space-y-3">
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Bio"
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                />
                <div className="flex gap-2 justify-center">
                  <button onClick={saveProfile} className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90"><Check className="w-4 h-4" /></button>
                  <button onClick={() => setEditing(false)} className="p-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80"><X className="w-4 h-4" /></button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="mt-4 text-xl font-semibold text-foreground">{profile?.display_name || profile?.username || "Anonymous"}</h2>
                {profile?.username && <p className="text-sm text-muted-foreground">@{profile.username}</p>}
                {profile?.bio && <p className="mt-2 text-sm text-muted-foreground text-center max-w-xs">{profile.bio}</p>}
              </>
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-6 pt-6 border-t border-border/30">
            {[
              { label: "Posts", value: stats.posts },
              { label: "Followers", value: stats.followers },
              { label: "Following", value: stats.following },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-lg font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex justify-center mt-6">
            {isOwnProfile ? (
              !editing && (
                <button onClick={startEdit} className="gradient-border rounded-full px-6 py-2 text-sm font-medium text-foreground hover:bg-secondary/50 transition-colors">
                  Edit Profile
                </button>
              )
            ) : (
              <button
                onClick={toggleFollow}
                disabled={followLoading}
                className={`rounded-full px-6 py-2 text-sm font-medium transition-colors ${
                  isFollowing
                    ? "bg-secondary text-foreground hover:bg-secondary/80"
                    : "bg-gradient-to-r from-pulse-blue to-pulse-cyan text-foreground hover:opacity-90"
                }`}
              >
                {isFollowing ? "Unfollow" : "Follow"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
