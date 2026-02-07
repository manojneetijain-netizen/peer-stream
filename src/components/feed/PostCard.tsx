import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Trash2, Repeat2, Bookmark, Pencil } from "lucide-react";
import type { PostWithDetails } from "@/hooks/useFeed";
import CommentsSection from "./CommentsSection";
import ReactionsPicker from "./ReactionsPicker";
import EditPostModal from "./EditPostModal";

interface PostCardProps {
  post: PostWithDetails;
  currentUserId: string;
  onUpdate: () => void;
}

const PostCard = ({ post, currentUserId, onUpdate }: PostCardProps) => {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [reposted, setReposted] = useState(post.reposted_by_me);
  const [repostsCount, setRepostsCount] = useState(post.reposts_count);
  const [bookmarked, setBookmarked] = useState(post.bookmarked_by_me);
  const [showComments, setShowComments] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = post.user_id === currentUserId;

  const toggleLike = async () => {
    if (liked) {
      await supabase.from("likes").delete().eq("user_id", currentUserId).eq("post_id", post.id);
      setLiked(false);
      setLikesCount((c) => c - 1);
    } else {
      await supabase.from("likes").insert({ user_id: currentUserId, post_id: post.id });
      setLiked(true);
      setLikesCount((c) => c + 1);
    }
  };

  const toggleRepost = async () => {
    if (reposted) {
      await supabase.from("reposts").delete().eq("user_id", currentUserId).eq("post_id", post.id);
      setReposted(false);
      setRepostsCount((c) => c - 1);
    } else {
      await supabase.from("reposts").insert({ user_id: currentUserId, post_id: post.id });
      setReposted(true);
      setRepostsCount((c) => c + 1);
    }
  };

  const toggleBookmark = async () => {
    if (bookmarked) {
      await supabase.from("bookmarks").delete().eq("user_id", currentUserId).eq("post_id", post.id);
      setBookmarked(false);
    } else {
      await supabase.from("bookmarks").insert({ user_id: currentUserId, post_id: post.id });
      setBookmarked(true);
    }
  };

  const deletePost = async () => {
    if (!confirm("Delete this post?")) return;
    setDeleting(true);
    await supabase.from("likes").delete().eq("post_id", post.id);
    await supabase.from("comments").delete().eq("post_id", post.id);
    await supabase.from("reposts").delete().eq("post_id", post.id);
    await supabase.from("reactions").delete().eq("post_id", post.id);
    await supabase.from("bookmarks").delete().eq("post_id", post.id);
    await supabase.from("posts").delete().eq("id", post.id);
    onUpdate();
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const initials = (post.author.display_name || post.author.username || "?").slice(0, 2).toUpperCase();

  return (
    <div className={`glass rounded-2xl p-4 ${deleting ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to={`/profile/${post.user_id}`}>
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.author.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary text-foreground text-sm">{initials}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link to={`/profile/${post.user_id}`} className="text-sm font-medium text-foreground hover:underline">
            {post.author.display_name || post.author.username || "Anonymous"}
          </Link>
          {post.author.username && (
            <p className="text-xs text-muted-foreground">@{post.author.username}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
        {isOwner && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setShowEdit(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              title="Edit post"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={deletePost}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete post"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <p className="mt-3 text-sm text-foreground whitespace-pre-wrap">{post.content}</p>

      {post.image_url && (
        <img src={post.image_url} alt="Post" className="mt-3 rounded-xl w-full max-h-96 object-cover" />
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/30">
        <button onClick={toggleLike} className="flex items-center gap-1.5 text-sm transition-colors group">
          <Heart className={`w-4 h-4 transition-colors ${liked ? "fill-destructive text-destructive" : "text-muted-foreground group-hover:text-foreground"}`} />
          <span className={liked ? "text-destructive" : "text-muted-foreground group-hover:text-foreground"}>{likesCount}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <MessageCircle className="w-4 h-4" />
          <span>{post.comments_count}</span>
        </button>
        <button onClick={toggleRepost} className="flex items-center gap-1.5 text-sm transition-colors group">
          <Repeat2 className={`w-4 h-4 transition-colors ${reposted ? "text-accent" : "text-muted-foreground group-hover:text-foreground"}`} />
          <span className={reposted ? "text-accent" : "text-muted-foreground group-hover:text-foreground"}>{repostsCount}</span>
        </button>
        <ReactionsPicker
          postId={post.id}
          currentUserId={currentUserId}
          myReaction={post.my_reaction}
          reactionCounts={post.reaction_counts}
          onUpdate={onUpdate}
        />
        <button onClick={toggleBookmark} className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
          <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-foreground text-foreground" : ""}`} />
        </button>
      </div>

      {showComments && (
        <CommentsSection postId={post.id} currentUserId={currentUserId} onUpdate={onUpdate} />
      )}

      {showEdit && (
        <EditPostModal
          postId={post.id}
          initialContent={post.content}
          onClose={() => setShowEdit(false)}
          onSaved={onUpdate}
        />
      )}
    </div>
  );
};

export default PostCard;
