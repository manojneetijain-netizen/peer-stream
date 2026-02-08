import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2 } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

interface ReelCommentsSheetProps {
  open: boolean;
  onClose: () => void;
  postId: string;
  currentUserId?: string;
}

const ReelCommentsSheet = ({ open, onClose, postId, currentUserId }: ReelCommentsSheetProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    fetchComments();
    inputRef.current?.focus();
  }, [open, postId]);

  const fetchComments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("comments")
      .select("id, content, created_at, user_id")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (!data) {
      setComments([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(data.map((c) => c.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, username, avatar_url")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    setComments(
      data.map((c) => ({
        ...c,
        profiles: profileMap.get(c.user_id) || undefined,
      }))
    );
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!text.trim() || !currentUserId) return;
    setSubmitting(true);
    await supabase.from("comments").insert({
      post_id: postId,
      user_id: currentUserId,
      content: text.trim(),
    });
    setText("");
    setSubmitting(false);
    fetchComments();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-xl rounded-t-3xl max-h-[60vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex items-center justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-white/10">
              <h3 className="text-white font-semibold text-sm">Comments</h3>
              <button onClick={onClose} className="p-1 text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 text-white/50 animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-white/40 text-sm py-8">No comments yet. Be the first!</p>
              ) : (
                comments.map((comment) => {
                  const initials = (comment.profiles?.display_name || comment.profiles?.username || "?").slice(0, 2).toUpperCase();
                  return (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarImage src={comment.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gray-700 text-white text-[10px]">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-white text-xs font-semibold">
                            {comment.profiles?.display_name || comment.profiles?.username || "User"}
                          </span>
                          <span className="text-white/30 text-[10px]">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-white/80 text-sm mt-0.5">{comment.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            {currentUserId && (
              <div className="px-4 py-3 border-t border-white/10 flex items-center gap-3">
                <input
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Add a comment..."
                  className="flex-1 bg-white/10 text-white placeholder:text-white/30 text-sm rounded-full px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!text.trim() || submitting}
                  className="p-2 text-blue-400 disabled:text-white/20 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReelCommentsSheet;
