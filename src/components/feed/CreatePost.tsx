import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImagePlus, Send, X, FileText, Clock, Save } from "lucide-react";
import { extractHashtags } from "./HashtagRenderer";
import PollCreator from "./PollCreator";
import PostScheduler from "./PostScheduler";
import DraftManager from "./DraftManager";
import VideoUploader from "./VideoUploader";
import { toast } from "sonner";

interface CreatePostProps {
  userId: string;
  onCreated: () => void;
}

const CreatePost = ({ userId, onCreated }: CreatePostProps) => {
  const [content, setContent] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [pollData, setPollData] = useState<{ question: string; options: string[] } | null>(null);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null);
  const [showDrafts, setShowDrafts] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newFiles = [...imageFiles, ...files].slice(0, 10);
    setImageFiles(newFiles);
    setImagePreviews(newFiles.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newFiles.map((f) => URL.createObjectURL(f)));
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeAllImages = () => {
    setImageFiles([]);
    setImagePreviews([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const saveDraft = async () => {
    await supabase.from("drafts").insert({
      user_id: userId,
      content: content.trim(),
      image_urls: [],
      poll_data: pollData,
    });
    toast.success("Draft saved");
  };

  const loadDraft = (draft: any) => {
    setContent(draft.content || "");
    setPollData(draft.poll_data || null);
  };

  const handleSubmit = async () => {
    if (!content.trim() && imageFiles.length === 0 && !videoFile) return;
    setSubmitting(true);

    // Upload video if present
    let videoUrl: string | null = null;
    if (videoFile) {
      const ext = videoFile.name.split(".").pop();
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      await supabase.storage.from("post-videos").upload(path, videoFile);
      const { data: { publicUrl } } = supabase.storage.from("post-videos").getPublicUrl(path);
      videoUrl = publicUrl;
    }
    setSubmitting(true);

    // Upload images
    const uploadedUrls: string[] = [];
    for (const file of imageFiles) {
      const ext = file.name.split(".").pop();
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      await supabase.storage.from("post-images").upload(path, file);
      const { data: { publicUrl } } = supabase.storage.from("post-images").getPublicUrl(path);
      uploadedUrls.push(publicUrl);
    }

    // Create post
    const { data: post } = await (supabase
      .from("posts")
      .insert({
        user_id: userId,
        content: content.trim(),
        image_url: uploadedUrls[0] || null,
        video_url: videoUrl,
        scheduled_at: scheduledAt?.toISOString() || null,
      } as any)
      .select("id")
      .single()) as { data: { id: string } | null };

    if (post && uploadedUrls.length > 0) {
      const imageRows = uploadedUrls.map((url, i) => ({
        post_id: post.id,
        image_url: url,
        position: i,
      }));
      await supabase.from("post_images").insert(imageRows);
    }

    // Extract and save hashtags
    if (post) {
      const tags = extractHashtags(content);
      for (const tag of tags) {
        const { data: existing } = await supabase
          .from("hashtags")
          .select("id")
          .eq("name", tag)
          .single();

        let hashtagId: string;
        if (existing) {
          hashtagId = existing.id;
        } else {
          const { data: created } = await supabase
            .from("hashtags")
            .insert({ name: tag })
            .select("id")
            .single();
          if (!created) continue;
          hashtagId = created.id;
        }

        await supabase.from("post_hashtags").insert({
          post_id: post.id,
          hashtag_id: hashtagId,
        });
      }

      // Create poll if present
      if (pollData) {
        const { data: poll } = await supabase
          .from("polls")
          .insert({ post_id: post.id, question: pollData.question })
          .select("id")
          .single();
        if (poll) {
          const optionRows = pollData.options.map((text, i) => ({
            poll_id: poll.id,
            text,
            position: i,
          }));
          await supabase.from("poll_options").insert(optionRows);
        }
      }
    }

    if (scheduledAt) {
      toast.success(`Post scheduled for ${scheduledAt.toLocaleString()}`);
    }

    setContent("");
    removeAllImages();
    setPollData(null);
    setScheduledAt(null);
    setVideoFile(null);
    setVideoPreview(null);
    setSubmitting(false);
    onCreated();
  };

  return (
    <div className="glass rounded-2xl p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind? Use #hashtags and @mentions!"
        rows={3}
        className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none"
      />
      {imagePreviews.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
          {imagePreviews.map((preview, i) => (
            <div key={i} className="relative shrink-0">
              <img src={preview} alt={`Preview ${i + 1}`} className="h-24 w-24 object-cover rounded-xl" />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1 -right-1 p-0.5 rounded-full bg-background/80 text-foreground hover:bg-background"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
      {scheduledAt && (
        <div className="mt-2 flex items-center gap-2 text-xs text-accent">
          <Clock className="w-3 h-3" />
          Scheduled: {scheduledAt.toLocaleString()}
        </div>
      )}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
        <div className="flex items-center gap-1">
          <button
            onClick={() => fileRef.current?.click()}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <ImagePlus className="w-5 h-5" />
          </button>
          <PollCreator onPollChange={setPollData} />
          <PostScheduler onSchedule={setScheduledAt} />
          <VideoUploader
            onVideoSelected={(f) => { setVideoFile(f); setVideoPreview(f ? URL.createObjectURL(f) : null); }}
            preview={videoPreview}
          />
          <button
            onClick={saveDraft}
            disabled={!content.trim()}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors disabled:opacity-30"
            title="Save draft"
          >
            <Save className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowDrafts(true)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            title="Load draft"
          >
            <FileText className="w-5 h-5" />
          </button>
          {imageFiles.length > 0 && (
            <span className="text-xs text-muted-foreground">{imageFiles.length}/10</span>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImages} />
        <button
          onClick={handleSubmit}
          disabled={submitting || (!content.trim() && imageFiles.length === 0 && !videoFile)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pulse-blue to-pulse-cyan text-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {scheduledAt ? "Schedule" : "Post"}
        </button>
      </div>
      {showDrafts && <DraftManager currentUserId={userId} onLoadDraft={loadDraft} onClose={() => setShowDrafts(false)} />}
    </div>
  );
};

export default CreatePost;
