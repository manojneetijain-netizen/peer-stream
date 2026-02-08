import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Upload, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReelUploaderProps {
  userId: string;
  onCreated: () => void;
}

const ReelUploader = ({ userId, onCreated }: ReelUploaderProps) => {
  const [open, setOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video must be under 100MB");
      return;
    }
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!videoFile) return;
    setSubmitting(true);

    const ext = videoFile.name.split(".").pop();
    const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("reel-videos").upload(path, videoFile);

    if (uploadError) {
      toast.error("Failed to upload video");
      setSubmitting(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("reel-videos").getPublicUrl(path);

    await supabase.from("posts").insert({
      user_id: userId,
      content: caption.trim() || "",
      video_url: publicUrl,
      type: "reel",
    } as any);

    toast.success("Reel published! 🎬");
    setCaption("");
    setVideoFile(null);
    setVideoPreview(null);
    setOpen(false);
    setSubmitting(false);
    onCreated();
  };

  const reset = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setCaption("");
    setOpen(false);
  };

  return (
    <>
      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 text-white shadow-xl flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* Upload modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && reset()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md island-card p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">Create Reel</h3>
                <button onClick={reset} className="p-1 text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {videoPreview ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-[50vh]">
                  <video src={videoPreview} controls className="w-full h-full object-contain" />
                  <button
                    onClick={() => { setVideoFile(null); setVideoPreview(null); }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full aspect-[9/16] max-h-[50vh] rounded-2xl border-2 border-dashed border-border/40 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  <Upload className="w-10 h-10" />
                  <span className="text-sm font-medium">Tap to select video</span>
                  <span className="text-xs text-muted-foreground">Max 100MB</span>
                </button>
              )}

              <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={handleFile} />

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption..."
                rows={2}
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none border-b border-border/30 pb-2"
              />

              <button
                onClick={handleSubmit}
                disabled={!videoFile || submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white font-semibold text-sm disabled:opacity-50 transition-opacity"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Share Reel
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ReelUploader;
