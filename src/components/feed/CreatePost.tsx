import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImagePlus, Send, X } from "lucide-react";

interface CreatePostProps {
  userId: string;
  onCreated: () => void;
}

const CreatePost = ({ userId, onCreated }: CreatePostProps) => {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!content.trim() && !imageFile) return;
    setSubmitting(true);

    let image_url: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${userId}/${Date.now()}.${ext}`;
      await supabase.storage.from("post-images").upload(path, imageFile);
      const { data: { publicUrl } } = supabase.storage.from("post-images").getPublicUrl(path);
      image_url = publicUrl;
    }

    await supabase.from("posts").insert({ user_id: userId, content: content.trim(), image_url });

    setContent("");
    removeImage();
    setSubmitting(false);
    onCreated();
  };

  return (
    <div className="glass rounded-2xl p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        rows={3}
        className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none"
      />
      {imagePreview && (
        <div className="relative mt-2 rounded-xl overflow-hidden">
          <img src={imagePreview} alt="Preview" className="w-full max-h-64 object-cover rounded-xl" />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 p-1 rounded-full bg-background/80 text-foreground hover:bg-background"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
        <button
          onClick={() => fileRef.current?.click()}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <ImagePlus className="w-5 h-5" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
        <button
          onClick={handleSubmit}
          disabled={submitting || (!content.trim() && !imageFile)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pulse-blue to-pulse-cyan text-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          Post
        </button>
      </div>
    </div>
  );
};

export default CreatePost;
