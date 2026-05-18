import { useState, useRef, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { extractHashtags } from "@/components/feed/HashtagRenderer";
import PollCreator from "@/components/feed/PollCreator";
import PostScheduler from "@/components/feed/PostScheduler";
import VideoUploader from "@/components/feed/VideoUploader";
import AIComposer from "@/components/feed/AIComposer";
import { toast } from "sonner";
import {
  ArrowLeft, Upload, Image, Film, Monitor,
  Smile, AtSign, MapPin, UserPlus, Settings2,
  ChevronRight, Clock, X,
} from "lucide-react";

const CreatePostPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [pollData, setPollData] = useState<{ question: string; options: string[] } | null>(null);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const images = fileArray.filter((f) => f.type.startsWith("image/"));
    const video = fileArray.find((f) => f.type.startsWith("video/"));

    if (video) {
      setVideoFile(video);
      setVideoPreview(URL.createObjectURL(video));
    }
    if (images.length > 0) {
      const newFiles = [...imageFiles, ...images].slice(0, 10);
      setImageFiles(newFiles);
      setImagePreviews(newFiles.map((f) => URL.createObjectURL(f)));
    }
  }, [imageFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async () => {
    if (!user || (!content.trim() && imageFiles.length === 0 && !videoFile)) return;
    setSubmitting(true);

    let videoUrl: string | null = null;
    if (videoFile) {
      const ext = videoFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      await supabase.storage.from("post-videos").upload(path, videoFile);
      const { data: { publicUrl } } = supabase.storage.from("post-videos").getPublicUrl(path);
      videoUrl = publicUrl;
    }

    const uploadedUrls: string[] = [];
    for (const file of imageFiles) {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      await supabase.storage.from("post-images").upload(path, file);
      const { data: { publicUrl } } = supabase.storage.from("post-images").getPublicUrl(path);
      uploadedUrls.push(publicUrl);
    }

    const { data: post } = await (supabase
      .from("posts")
      .insert({
        user_id: user.id,
        content: content.trim(),
        image_url: uploadedUrls[0] || null,
        video_url: videoUrl,
        scheduled_at: scheduledAt?.toISOString() || null,
      } as any)
      .select("id")
      .single()) as { data: { id: string } | null };

    if (post && uploadedUrls.length > 0) {
      await supabase.from("post_images").insert(
        uploadedUrls.map((url, i) => ({ post_id: post.id, image_url: url, position: i }))
      );
    }

    if (post) {
      const tags = extractHashtags(content);
      for (const tag of tags) {
        const { data: existing } = await supabase.from("hashtags").select("id").eq("name", tag).single();
        let hashtagId: string;
        if (existing) {
          hashtagId = existing.id;
        } else {
          const { data: created } = await supabase.from("hashtags").insert({ name: tag }).select("id").single();
          if (!created) continue;
          hashtagId = created.id;
        }
        await supabase.from("post_hashtags").insert({ post_id: post.id, hashtag_id: hashtagId });
      }

      if (pollData) {
        const { data: poll } = await supabase.from("polls").insert({ post_id: post.id, question: pollData.question }).select("id").single();
        if (poll) {
          await supabase.from("poll_options").insert(
            pollData.options.map((text, i) => ({ poll_id: poll.id, text, position: i }))
          );
        }
      }
    }

    if (scheduledAt) {
      toast.success(`Post scheduled for ${scheduledAt.toLocaleString()}`);
    } else {
      toast.success("Pulse shared!");
    }
    navigate("/feed");
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const hasMedia = imagePreviews.length > 0 || videoPreview;
  const charCount = content.length;
  const maxChars = 2200;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 glass-surface border-b border-border/20">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-lg font-black text-foreground">Pulse</span>
            <span className="text-sm text-muted-foreground">|</span>
            <span className="text-sm font-medium text-muted-foreground">New Post</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Discard
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || (!content.trim() && !hasMedia)}
              className="px-5 py-2 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-bold hover:opacity-90 transition-all disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98]"
            >
              {submitting ? "Sharing..." : scheduledAt ? "Schedule" : "Share Post"}
            </button>
          </div>
        </div>
      </header>

      {/* Split layout */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full">
        {/* Left: Media upload area */}
        <div className="flex-1 p-6 flex flex-col">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex-1 rounded-2xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden ${
              isDragging
                ? "border-primary bg-primary/5"
                : hasMedia
                  ? "border-border/30 bg-secondary/10"
                  : "border-border/30 hover:border-border/50"
            }`}
          >
            {hasMedia ? (
              <div className="w-full h-full p-4">
                {videoPreview && (
                  <div className="relative mb-4">
                    <video src={videoPreview} controls className="w-full max-h-80 rounded-xl object-cover" />
                    <button
                      onClick={() => { setVideoFile(null); setVideoPreview(null); }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 text-foreground hover:bg-background"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {imagePreviews.map((preview, i) => (
                      <div key={i} className="relative group aspect-square">
                        <img src={preview} alt="" className="w-full h-full object-cover rounded-xl" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-2 right-2 p-1 rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {imageFiles.length < 10 && (
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-border/60 transition-all"
                      >
                        <Upload className="w-6 h-6 mb-1" />
                        <span className="text-xs">Add more</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto">
                  <Upload className="w-7 h-7 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Drag and drop media</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                    High-resolution photos or videos (MP4, MOV). Recommended aspect ratio 4:5 or 16:9. Up to 1GB per file.
                  </p>
                </div>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="px-6 py-2.5 rounded-xl bg-secondary/60 hover:bg-secondary text-foreground text-sm font-semibold transition-all flex items-center gap-2 mx-auto"
                >
                  <Monitor className="w-4 h-4" />
                  Select from Computer
                </button>
              </div>
            )}

            {/* Media type icons at bottom */}
            {!hasMedia && (
              <div className="absolute bottom-6 flex items-center gap-2">
                <button onClick={() => fileRef.current?.click()} className="p-2.5 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                  <Image className="w-5 h-5" />
                </button>
                <button className="p-2.5 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                  <Film className="w-5 h-5" />
                </button>
                <button className="p-2.5 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
                  <Monitor className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </div>

        {/* Right: Post details panel */}
        <div className="w-full lg:w-[380px] border-l border-border/20 p-6 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Post Details</h3>
            <span className="text-xs text-muted-foreground">STEP 1 OF 1</span>
          </div>
          <div className="w-full h-0.5 bg-secondary rounded-full">
            <div className="w-full h-full bg-primary rounded-full" />
          </div>

          {/* Caption */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Caption</label>
              <span className={`text-xs ${charCount > maxChars ? "text-destructive" : "text-muted-foreground"}`}>
                {charCount} / {maxChars}
              </span>
            </div>
            <div className="rounded-xl bg-secondary/30 border border-border/30">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind? Use #hashtags to reach more people..."
                rows={5}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none p-3"
              />
              <div className="flex items-center justify-end gap-2 px-3 pb-3">
                <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                  <Smile className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                  <AtSign className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* AI Writing Assistant */}
          <AIComposer currentContent={content} onApply={(text) => setContent(text)} />

          {/* Tag People */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2 block">Tag People</label>
            <div className="flex items-center gap-2 rounded-xl bg-secondary/30 border border-border/30 px-3 py-2.5">
              <UserPlus className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                placeholder="Search usernames..."
                className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          {/* Add Location */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2 block">Add Location</label>
            <div className="flex items-center gap-2 rounded-xl bg-secondary/30 border border-border/30 px-3 py-2.5">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                placeholder="Add a place..."
                className="flex-1 bg-transparent text-foreground text-sm placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          {/* Schedule & Poll */}
          {scheduledAt && (
            <div className="flex items-center gap-2 text-xs text-accent rounded-xl bg-accent/10 px-3 py-2.5">
              <Clock className="w-3.5 h-3.5" />
              Scheduled: {scheduledAt.toLocaleString()}
              <button onClick={() => setScheduledAt(null)} className="ml-auto text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Advanced Settings */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Advanced Settings</label>
              <Settings2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-0">
              <div className="flex items-center gap-2 py-3">
                <PollCreator onPollChange={setPollData} />
                <span className="text-sm text-foreground">Add a poll</span>
              </div>
              <div className="flex items-center gap-2 py-3 border-t border-border/20">
                <PostScheduler onSchedule={setScheduledAt} />
                <span className="text-sm text-foreground">Schedule post</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostPage;
