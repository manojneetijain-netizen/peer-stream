import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Send } from "lucide-react";
import type { PostWithDetails } from "@/hooks/useFeed";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface QuoteRepostModalProps {
  post: PostWithDetails;
  currentUserId: string;
  onClose: () => void;
  onCreated: () => void;
}

const QuoteRepostModal = ({ post, currentUserId, onClose, onCreated }: QuoteRepostModalProps) => {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    await supabase.from("posts").insert({
      user_id: currentUserId,
      content: content.trim(),
      quoted_post_id: post.id,
    });
    setSubmitting(false);
    onClose();
    onCreated();
  };

  const initials = (post.author.display_name || post.author.username || "?").slice(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md glass rounded-2xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">Quote Repost</h3>
          <button onClick={onClose} className="p-1 rounded text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add your thoughts..."
          rows={3}
          className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-sm resize-none focus:outline-none"
          autoFocus
        />

        {/* Quoted post preview */}
        <div className="rounded-xl border border-border/40 p-3 bg-secondary/20">
          <div className="flex items-center gap-2 mb-1">
            <Avatar className="w-5 h-5">
              <AvatarImage src={post.author.avatar_url || undefined} />
              <AvatarFallback className="text-[10px] bg-secondary text-foreground">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-foreground">
              {post.author.display_name || post.author.username || "Anonymous"}
            </span>
            {post.author.username && <span className="text-xs text-muted-foreground">@{post.author.username}</span>}
          </div>
          {post.content && (
            <p className="text-xs text-muted-foreground line-clamp-3">{post.content}</p>
          )}
          {post.image_url && (
            <img src={post.image_url} alt="" className="mt-1.5 h-16 w-full object-cover rounded-lg" />
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pulse-blue to-pulse-cyan text-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Quote
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuoteRepostModal;
