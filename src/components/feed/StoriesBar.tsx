import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, X, Camera, Volume2, VolumeX } from "lucide-react";

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

const PHOTO_DURATION = 10000;

const StoryViewer = ({ stories, onClose }: { stories: Story[]; onClose: () => void }) => {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fading, setFading] = useState(false);
  const [muted, setMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const story = stories[index];
  const isVideo = story.image_url?.match(/\.(mp4|webm|mov)$/i);

  const goNext = useCallback(() => {
    if (index < stories.length - 1) {
      setIndex((i) => i + 1);
      setProgress(0);
    } else {
      setFading(true);
      setTimeout(onClose, 400);
    }
  }, [index, stories.length, onClose]);

  // Photo timer — reset on index change
  useEffect(() => {
    if (isVideo) return;
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      setProgress(Math.min(elapsed / PHOTO_DURATION, 1));
      if (elapsed >= PHOTO_DURATION) {
        clearInterval(timerRef.current);
        goNext();
      }
    }, 50);
    return () => clearInterval(timerRef.current);
  }, [isVideo, index, goNext]);

  const handleVideoEnd = () => goNext();

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
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
          onClick={() => { setFading(true); setTimeout(onClose, 400); }}
        >
          <div className="w-full h-full relative flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Segmented progress bars */}
            <div className="absolute top-0 left-0 right-0 z-20 px-3 pt-2 flex gap-1">
              {stories.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 bg-secondary/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-100"
                    style={{
                      width: i < index ? "100%" : i === index ? `${progress * 100}%` : "0%",
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="absolute top-4 right-2 z-20 flex gap-2">
              {isVideo && (
                <button
                  onClick={() => setMuted((m) => !m)}
                  className="p-2 rounded-full bg-background/50 text-foreground"
                >
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              )}
              <button
                onClick={() => { setFading(true); setTimeout(onClose, 400); }}
                className="p-2 rounded-full bg-background/50 text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={story.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="flex items-center gap-2 px-4 py-2 absolute top-8 left-0 right-12 z-10">
                  <Avatar className="w-8 h-8 ring-1 ring-white/30">
                    <AvatarImage src={story.author.avatar_url || undefined} />
                    <AvatarFallback className="bg-white/20 text-white text-xs">
                      {(story.author.display_name || "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-white drop-shadow">
                    {story.author.display_name || story.author.username}
                  </span>
                  <span className="text-xs text-white/60 ml-auto">
                    {index + 1}/{stories.length}
                  </span>
                </div>

                {story.image_url && (
                  isVideo ? (
                    <video
                      ref={videoRef}
                      key={story.id}
                      src={story.image_url}
                      autoPlay
                      playsInline
                      muted={muted}
                      onEnded={handleVideoEnd}
                      onTimeUpdate={handleVideoTimeUpdate}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img src={story.image_url} alt="Story" className="w-full h-full object-contain" />
                  )
                )}

                {story.content && (
                  <div className={`p-6 ${!story.image_url ? "flex-1 flex items-center justify-center" : "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent"}`}>
                    <p className="text-white text-center text-lg">{story.content}</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const StoriesBar = ({ currentUserId }: StoriesBarProps) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [viewingStories, setViewingStories] = useState<Story[] | null>(null);
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
      .order("created_at", { ascending: true });

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
            <button key={userId} onClick={() => setViewingStories(userStoryList)} className="flex flex-col items-center gap-1 flex-shrink-0">
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

      {viewingStories && (
        <StoryViewer stories={viewingStories} onClose={() => setViewingStories(null)} />
      )}

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
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => {
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
