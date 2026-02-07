import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  author: { username: string | null; display_name: string | null; avatar_url: string | null };
}

interface CommentsSectionProps {
  postId: string;
  currentUserId: string;
  onUpdate: () => void;
}

const CommentsSection = ({ postId, currentUserId, onUpdate }: CommentsSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
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

    setComments(
      rawComments.map((c) => {
        const p = profileMap.get(c.user_id);
        return {
          ...c,
          author: {
            username: p?.username ?? null,
            display_name: p?.display_name ?? null,
            avatar_url: p?.avatar_url ?? null,
          },
        };
      })
    );
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
    });
    setText("");
    setSubmitting(false);
    fetchComments();
    onUpdate();
  };

  return (
    <div className="mt-3 pt-3 border-t border-border/30 space-y-3">
      {comments.map((c) => {
        const initials = (c.author.display_name || c.author.username || "?").slice(0, 2).toUpperCase();
        return (
          <div key={c.id} className="flex gap-2">
            <Link to={`/profile/${c.user_id}`}>
              <Avatar className="w-7 h-7">
                <AvatarImage src={c.author.avatar_url || undefined} />
                <AvatarFallback className="bg-secondary text-foreground text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/profile/${c.user_id}`} className="text-xs font-medium text-foreground hover:underline">
                {c.author.display_name || c.author.username || "Anonymous"}
              </Link>
              <p className="text-sm text-muted-foreground">{c.content}</p>
            </div>
          </div>
        );
      })}

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addComment()}
          placeholder="Add a comment..."
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
