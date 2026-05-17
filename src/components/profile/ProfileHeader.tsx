import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Camera, ImagePlus, BadgeCheck, Check, X, BarChart3, Calendar, Phone, Lock, Clock } from "lucide-react";
import { format } from "date-fns";
import type { Profile } from "@/hooks/useProfile";

interface ProfileHeaderProps {
  profile: Profile | null;
  stats: { posts: number; followers: number; following: number };
  isOwnProfile: boolean;
  isFollowing: boolean;
  followLoading: boolean;
  toggleFollow: () => void;
  currentUserId: string;
  targetId: string;
  refetch: () => void;
  followRequestStatus?: "none" | "pending" | "accepted" | "rejected";
  onSendFollowRequest?: () => void;
  onCancelFollowRequest?: () => void;
  followRequestLoading?: boolean;
}

const ProfileHeader = ({
  profile,
  stats,
  isOwnProfile,
  isFollowing,
  followLoading,
  toggleFollow,
  currentUserId,
  targetId,
  refetch,
  followRequestStatus = "none",
  onSendFollowRequest,
  onCancelFollowRequest,
  followRequestLoading = false,
}: ProfileHeaderProps) => {
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const initials = (profile?.display_name || profile?.username || "?").slice(0, 2).toUpperCase();
  const isPrivate = (profile as any)?.is_private === true;

  const startEdit = () => {
    setDisplayName(profile?.display_name || "");
    setBio(profile?.bio || "");
    setEditing(true);
  };

  const saveProfile = async () => {
    await supabase.from("profiles").update({ display_name: displayName, bio }).eq("user_id", currentUserId);
    setEditing(false);
    refetch();
  };

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${currentUserId}/avatar.${ext}`;
    await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", currentUserId);
    setUploading(false);
    refetch();
  };

  const uploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    const ext = file.name.split(".").pop();
    const path = `${currentUserId}/cover.${ext}`;
    await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ cover_url: publicUrl }).eq("user_id", currentUserId);
    setUploadingCover(false);
    refetch();
  };

  // Determine follow button behavior for non-own profiles
  const renderFollowButton = () => {
    if (isFollowing) {
      return (
        <button
          onClick={toggleFollow}
          disabled={followLoading}
          className="rounded-full px-6 py-2 text-sm font-medium transition-all bg-secondary text-foreground hover:bg-destructive/20 hover:text-destructive"
        >
          Unfollow
        </button>
      );
    }

    if (isPrivate) {
      if (followRequestStatus === "pending") {
        return (
          <button
            onClick={onCancelFollowRequest}
            disabled={followRequestLoading}
            className="rounded-full px-6 py-2 text-sm font-medium transition-all bg-secondary text-foreground hover:bg-destructive/20 hover:text-destructive flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            Requested
          </button>
        );
      }
      return (
        <button
          onClick={onSendFollowRequest}
          disabled={followRequestLoading}
          className="rounded-full px-6 py-2 text-sm font-medium transition-all bg-primary text-primary-foreground hover:opacity-90 flex items-center gap-1.5"
        >
          <Lock className="w-3.5 h-3.5" />
          Request Follow
        </button>
      );
    }

    return (
      <button
        onClick={toggleFollow}
        disabled={followLoading}
        className="rounded-full px-6 py-2 text-sm font-medium transition-all bg-primary text-primary-foreground hover:opacity-90"
      >
        Follow
      </button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl overflow-hidden"
    >
      {/* Cover */}
      <div className="relative h-44 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20">
        {profile?.cover_url && (
          <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
        )}
        {isOwnProfile && (
          <>
            <button
              onClick={() => coverRef.current?.click()}
              disabled={uploadingCover}
              className="absolute top-3 right-3 p-2 rounded-full bg-background/60 backdrop-blur-sm text-foreground hover:bg-background/80 transition-colors"
            >
              <ImagePlus className="w-4 h-4" />
            </button>
            <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={uploadCover} />
          </>
        )}
      </div>

      <div className="px-6 pb-6 -mt-14">
        {/* Avatar */}
        <div className="flex items-end justify-between mb-4">
          <div className="relative">
            <Avatar className="w-28 h-28 border-4 border-background ring-2 ring-primary/20">
              <AvatarImage src={profile?.avatar_url || undefined} />
              <AvatarFallback className="text-2xl bg-secondary text-foreground">{initials}</AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <>
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-1 right-1 p-1.5 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-16">
            {isOwnProfile ? (
              <>
                {!editing && (
                  <button
                    onClick={startEdit}
                    className="px-5 py-2 rounded-full text-sm font-medium border border-border/50 text-foreground hover:bg-secondary/50 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
                <Link
                  to="/analytics"
                  className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-foreground bg-secondary/40 hover:bg-secondary/60 transition-colors"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Analytics
                </Link>
              </>
            ) : (
              renderFollowButton()
            )}
          </div>
        </div>

        {/* Name / bio */}
        {editing ? (
          <div className="space-y-3 max-w-sm">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display name"
              className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Bio"
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-secondary/40 border border-border/50 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={saveProfile} className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setEditing(false)} className="p-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xl font-bold text-foreground">
                {profile?.display_name || profile?.username || "Anonymous"}
              </h1>
              {profile?.is_verified && <BadgeCheck className="w-5 h-5 text-primary" />}
              {isPrivate && (
                <span title="Private account"><Lock className="w-4 h-4 text-muted-foreground" /></span>
              )}
            </div>
            {profile?.username && (
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
            )}
            {profile?.bio && (
              <p className="mt-2 text-sm text-muted-foreground max-w-md">{profile.bio}</p>
            )}

            {/* Extra info badges — only visible to the profile owner */}
            {isOwnProfile && (
              <div className="flex flex-wrap gap-3 mt-3">
                {(profile as any)?.date_of_birth && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/40 px-2.5 py-1 rounded-full">
                    <Calendar className="w-3 h-3" />
                    {format(new Date((profile as any).date_of_birth), "MMM d, yyyy")}
                  </span>
                )}
                {(profile as any)?.gender && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/40 px-2.5 py-1 rounded-full capitalize">
                    {(profile as any).gender}
                  </span>
                )}
                {(profile as any)?.phone && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/40 px-2.5 py-1 rounded-full">
                    <Phone className="w-3 h-3" />
                    {(profile as any).phone}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-6 mt-5 pt-5 border-t border-border/20">
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{stats.posts}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <Link to={`/profile/${targetId}/followers`} className="text-center hover:opacity-80 transition-opacity">
            <p className="text-lg font-bold text-foreground">{stats.followers}</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </Link>
          <Link to={`/profile/${targetId}/following`} className="text-center hover:opacity-80 transition-opacity">
            <p className="text-lg font-bold text-foreground">{stats.following}</p>
            <p className="text-xs text-muted-foreground">Following</p>
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileHeader;
