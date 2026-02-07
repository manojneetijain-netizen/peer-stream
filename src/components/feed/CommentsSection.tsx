import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, Trash2, CornerDownRight } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  author: { username: string | null; display_name: string | null; avatar_url: string | null };
  replies?: Comment[];
}

interface CommentsSectionProps {
  postId: string;
  currentUserId: string;
  onUpdate: () => void;
}

const CommentsSection = ({ postId, currentUserId, onUpdate }: CommentsSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    fetchComments();
    onUpdate();
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from("comments").delete().eq("id", commentId);
    fetchComments();
    onUpdate();
  };

  const renderComment = (c: Comment, isReply = false) => {
    const initials = (c.author.display_name || c.author.username || "?").slice(0, 2).toUpperCase();
    const isOwner = c.user_id === currentUserId;
    const authorName = c.author.display_name || c.author.username || "Anonymous";

    return (
      <div key={c.id} className={`flex gap-2 group ${isReply ? "ml-8" : ""}`}>
        {isReply && <CornerDownRight className="w-3 h-3 text-muted-foreground mt-2 shrink-0" />}
        <Link to={`/profile/${c.user_id}`}>
          <Avatar className={isReply ? "w-6 h-6" : "w-7 h-7"}>
            <AvatarImage src={c.author.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary text-foreground text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Link to={`/profile/${c.user_id}`} className="text-xs font-medium text-foreground hover:underline">
              {authorName}
            </Link>
            {!isReply && (
              <button
                onClick={() => setReplyTo({ id: c.id, name: authorName })}
                className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
              >
                Reply
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{c.content}</p>
        </div>
        {isOwner && (
          <button
            onClick={() => deleteComment(c.id)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
            title="Delete comment"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/30 space-y-3">
      {comments.map((c) => (
        <div key={c.id} className="space-y-2">
          {renderComment(c)}
          {c.replies?.map((r) => renderComment(r, true))}
        </div>
      ))}

      {replyTo && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-lg px-3 py-1.5">
          <CornerDownRight className="w-3 h-3" />
          <span>Replying to <strong className="text-foreground">{replyTo.name}</strong></span>
          <button onClick={() => setReplyTo(null)} className="ml-auto hover:text-foreground">✕</button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addComment()}
          placeholder={replyTo ? `Reply to ${replyTo.name}...` : "Add a comment..."}
          className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={addComment}
          disabled={submitting || !text.trim()}
          className="p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CommentsSection;
