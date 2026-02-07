import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, X, Camera } from "lucide-react";
import { useRef } from "react";

interface Story {
  id: string;
  user_id: string;
  image_url: string | null;
  content: string | null;
  created_at: string;
  author: { username: string | null; display_name: string | null; avatar_url: string | null };
}

interface StoriesBarProps {
  currentUserId: string;
}

const StoriesBar = ({ currentUserId }: StoriesBarProps) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [viewingStory, setViewingStory] = useState<Story | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchStories = async () => {
    const { data } = await supabase
      .from("stories")
      .select("*")
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (!data || data.length === 0) { setStories([]); return; }

    const userIds = [...new Set(data.map((s) => s.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    setStories(
      data.map((s) => {
        const p = profileMap.get(s.user_id);
        return {
          ...s,
          author: {
            username: p?.username ?? null,
            display_name: p?.display_name ?? null,
            avatar_url: p?.avatar_url ?? null,
          },
        };
      })
    );
  };

  useEffect(() => { fetchStories(); }, []);

  // Group stories by user - show one circle per user
  const userStories = new Map<string, Story[]>();
  stories.forEach((s) => {
    const arr = userStories.get(s.user_id) || [];
    arr.push(s);
    userStories.set(s.user_id, arr);
  });

  const createStory = async () => {
    if (!content.trim() && !imageFile) return;
    setSubmitting(true);

    let image_url: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${currentUserId}/${Date.now()}.${ext}`;
      await supabase.storage.from("post-images").upload(path, imageFile);
      const { data: { publicUrl } } = supabase.storage.from("post-images").getPublicUrl(path);
      image_url = publicUrl;
    }

    await supabase.from("stories").insert({
      user_id: currentUserId,
      content: content.trim() || null,
      image_url,
    });

    setContent("");
    setImageFile(null);
    setImagePreview(null);
    setShowCreate(false);
    setSubmitting(false);
    fetchStories();
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto py-2 scrollbar-hide">
        {/* Add story button */}
        <button
          onClick={() => setShowCreate(true)}
          className="flex flex-col items-center gap-1 flex-shrink-0"
        >
          <div className="w-16 h-16 rounded-full bg-secondary/50 border-2 border-dashed border-border flex items-center justify-center">
            <Plus className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="text-[10px] text-muted-foreground">Your story</span>
        </button>

        {/* User story circles */}
        {[...userStories.entries()].map(([userId, userStoryList]) => {
          const first = userStoryList[0];
          const initials = (first.author.display_name || first.author.username || "?").slice(0, 2).toUpperCase();
          return (
            <button
              key={userId}
              onClick={() => setViewingStory(first)}
              className="flex flex-col items-center gap-1 flex-shrink-0"
            >
              <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-pulse-blue to-pulse-cyan">
                <Avatar className="w-full h-full border-2 border-background">
                  <AvatarImage src={first.author.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary text-foreground text-xs">{initials}</AvatarFallback>
                </Avatar>
              </div>
              <span className="text-[10px] text-muted-foreground truncate w-16 text-center">
                {userId === currentUserId ? "You" : first.author.display_name || first.author.username || "User"}
              </span>
            </button>
          );
        })}
      </div>

      {/* View story modal */}
      {viewingStory && (
        <div className="fixed inset-0 z-[100] bg-background/95 flex items-center justify-center" onClick={() => setViewingStory(null)}>
          <div className="max-w-sm w-full mx-4 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewingStory(null)} className="absolute top-2 right-2 z-10 p-2 rounded-full bg-background/50 text-foreground">
              <X className="w-5 h-5" />
            </button>
            <div className="glass rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 p-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={viewingStory.author.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary text-foreground text-xs">
                    {(viewingStory.author.display_name || "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">
                  {viewingStory.author.display_name || viewingStory.author.username}
                </span>
              </div>
              {viewingStory.image_url && (
                <img src={viewingStory.image_url} alt="Story" className="w-full aspect-[9/16] object-cover max-h-[70vh]" />
              )}
              {viewingStory.content && (
                <div className={`p-6 ${!viewingStory.image_url ? "min-h-[300px] flex items-center justify-center" : ""}`}>
                  <p className="text-foreground text-center text-lg">{viewingStory.content}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create story modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] bg-background/95 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="max-w-sm w-full mx-4 glass rounded-2xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Create Story</h3>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's happening right now?"
              rows={3}
              className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary border border-border"
            />
            {imagePreview && (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full rounded-lg max-h-48 object-cover" />
                <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-1 right-1 p-1 rounded-full bg-background/80 text-foreground">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex items-center justify-between">
              <button onClick={() => fileRef.current?.click()} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                <Camera className="w-5 h-5" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
              }} />
              <button
                onClick={createStory}
                disabled={submitting || (!content.trim() && !imageFile)}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-pulse-blue to-pulse-cyan text-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                Share Story
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StoriesBar;
