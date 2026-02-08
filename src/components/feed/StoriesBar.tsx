import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, X, Camera } from "lucide-react";

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

const PHOTO_DURATION = 10000; // 10 seconds

const StoryViewer = ({ story, onClose }: { story: Story; onClose: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const isVideo = story.image_url?.match(/\.(mp4|webm|mov)$/i);

  const dismiss = useCallback(() => {
    setFading(true);
    setTimeout(onClose, 400);
  }, [onClose]);

  // Photo timer
  useEffect(() => {
    if (isVideo) return;
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(elapsed / PHOTO_DURATION, 1));
      if (elapsed >= PHOTO_DURATION) {
        clearInterval(timerRef.current);
        dismiss();
      }
    }, 50);
    return () => clearInterval(timerRef.current);
  }, [isVideo, dismiss]);

  // Video end handler
  const handleVideoEnd = () => dismiss();

  const handleVideoTimeUpdate = () => {
    const v = videoRef.current;
    if (v && v.duration) setProgress(v.currentTime / v.duration);
  };

  return (
    <AnimatePresence>
      {!fading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] bg-background/95 flex items-center justify-center"
          onClick={dismiss}
        >
          <div className="max-w-sm w-full mx-4 relative" onClick={(e) => e.stopPropagation()}>
            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 z-20 px-3 pt-2">
              <div className="h-0.5 w-full bg-secondary/40 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.05 }}
                />
              </div>
            </div>

            <button onClick={dismiss} className="absolute top-4 right-2 z-20 p-2 rounded-full bg-background/50 text-foreground">
              <X className="w-5 h-5" />
            </button>

            <div className="glass rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 p-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={story.author.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary text-foreground text-xs">
                    {(story.author.display_name || "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">
                  {story.author.display_name || story.author.username}
                </span>
              </div>

              {story.image_url && (
                isVideo ? (
                  <video
                    ref={videoRef}
                    src={story.image_url}
                    autoPlay
                    playsInline
                    muted
                    onEnded={handleVideoEnd}
                    onTimeUpdate={handleVideoTimeUpdate}
                    className="w-full aspect-[9/16] object-cover max-h-[70vh]"
                  />
                ) : (
                  <img src={story.image_url} alt="Story" className="w-full aspect-[9/16] object-cover max-h-[70vh]" />
                )
              )}

              {story.content && (
                <div className={`p-6 ${!story.image_url ? "min-h-[300px] flex items-center justify-center" : ""}`}>
                  <p className="text-foreground text-center text-lg">{story.content}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

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
        <button onClick={() => setShowCreate(true)} className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-secondary/50 border-2 border-dashed border-border flex items-center justify-center">
            <Plus className="w-5 h-5 text-muted-foreground" />
          </div>
          <span className="text-[10px] text-muted-foreground">Your story</span>
        </button>

        {[...userStories.entries()].map(([userId, userStoryList]) => {
          const first = userStoryList[0];
          const initials = (first.author.display_name || first.author.username || "?").slice(0, 2).toUpperCase();
          return (
            <button key={userId} onClick={() => setViewingStory(first)} className="flex flex-col items-center gap-1 flex-shrink-0">
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

      {/* Story viewer with auto-fade */}
      {viewingStory && (
        <StoryViewer story={viewingStory} onClose={() => setViewingStory(null)} />
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
