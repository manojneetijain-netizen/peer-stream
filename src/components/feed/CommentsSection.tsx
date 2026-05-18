import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, Trash2, CornerDownRight, Heart, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  author: { username: string | null; display_name: string | null; avatar_url: string | null };
  replies?: Comment[];
  like_count?: number;
  liked_by_me?: boolean;
}

interface CommentsSectionProps {
  postId: string;
  currentUserId: string;
  onUpdate: () => void;
}

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

const CommentsSection = ({ postId, currentUserId, onUpdate }: CommentsSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchComments = async () => {
    const { data: rawComments } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (!rawComments) return;

    const userIds = [...new Set(rawComments.map((c) => c.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    const enriched = rawComments.map((c) => {
      const p = profileMap.get(c.user_id);
      return {
        ...c,
        parent_id: (c as any).parent_id || null,
        author: {
          username: p?.username ?? null,
          display_name: p?.display_name ?? null,
          avatar_url: p?.avatar_url ?? null,
        },
      };
    });

    // Build threaded structure
    const rootComments: Comment[] = [];
    const childMap = new Map<string, Comment[]>();

    enriched.forEach((c) => {
      if (c.parent_id) {
        const existing = childMap.get(c.parent_id) || [];
        existing.push(c);
        childMap.set(c.parent_id, existing);
      } else {
        rootComments.push(c);
      }
    });

    rootComments.forEach((c) => {
      c.replies = childMap.get(c.id) || [];
    });

    setComments(rootComments);
  };

  useEffect(() => {
    fetchComments();
    // Real-time subscription
    const channel = supabase
      .channel(`comments-${postId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `post_id=eq.${postId}` }, () => {
        fetchComments();
        onUpdate();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [postId]);

  const addComment = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    await supabase.from("comments").insert({
      post_id: postId,
      user_id: currentUserId,
      content: text.trim(),
      ...(replyTo ? { parent_id: replyTo.id } : {}),
    });
    setText("");
    setReplyTo(null);
    setSubmitting(false);
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from("comments").delete().eq("id", commentId);
  };

  const handleReply = (id: string, name: string) => {
    setReplyTo({ id, name });
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const renderComment = (c: Comment, isReply = false) => {
    const initials = (c.author.display_name || c.author.username || "?").slice(0, 2).toUpperCase();
    const isOwner = c.user_id === currentUserId;
    const authorName = c.author.display_name || c.author.username || "Anonymous";

    return (
      <motion.div
        key={c.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`flex gap-2.5 group ${isReply ? "ml-9 mt-1" : ""}`}
      >
        {isReply && <CornerDownRight className="w-3 h-3 text-muted-foreground mt-3 shrink-0" />}
        <Link to={`/profile/${c.user_id}`} className="shrink-0">
          <Avatar className={isReply ? "w-6 h-6 mt-1" : "w-8 h-8"}>
            <AvatarImage src={c.author.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary text-foreground text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="inline-block bg-secondary/40 rounded-2xl px-3 py-2 max-w-[85%]">
            <Link to={`/profile/${c.user_id}`} className="text-xs font-semibold text-foreground hover:underline block mb-0.5">
              {authorName}
            </Link>
            <p className="text-sm text-foreground/90 leading-snug">{c.content}</p>
          </div>
          <div className="flex items-center gap-3 mt-1 ml-2">
            <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
            {!isReply && (
              <button
                onClick={() => handleReply(c.id, authorName)}
                className="text-[10px] font-semibold text-muted-foreground hover:text-primary transition-colors"
              >
                Reply
              </button>
            )}
            {isOwner && (
              <button
                onClick={() => deleteComment(c.id)}
                className="text-[10px] text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive transition-all"
                title="Delete"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/30 space-y-3">
      {/* Comment count header */}
      {comments.length > 0 && (
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
          {comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0)} Comments
        </p>
      )}

      <AnimatePresence initial={false}>
        {comments.map((c) => (
          <div key={c.id} className="space-y-1.5">
            {renderComment(c)}
            {c.replies && c.replies.length > 0 && (
              <div className="space-y-1.5">
                {c.replies.map((r) => renderComment(r, true))}
              </div>
            )}
          </div>
        ))}
      </AnimatePresence>

      {/* Reply banner */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 text-xs bg-primary/10 border border-primary/20 rounded-xl px-3 py-2"
          >
            <MessageCircle className="w-3 h-3 text-primary shrink-0" />
            <span className="text-muted-foreground">
              Replying to <strong className="text-foreground">{replyTo.name}</strong>
            </span>
            <button onClick={() => setReplyTo(null)} className="ml-auto text-muted-foreground hover:text-foreground transition-colors text-base leading-none">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="flex gap-2 items-center">
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && addComment()}
          placeholder={replyTo ? `Reply to ${replyTo.name}...` : "Add a comment..."}
          className="flex-1 px-3.5 py-2 rounded-full bg-secondary/50 border border-border/40 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
        />
        <motion.button
          onClick={addComment}
          disabled={submitting || !text.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity shrink-0"
        >
          <Send className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};

export default CommentsSection;
