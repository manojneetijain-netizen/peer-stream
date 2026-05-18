import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Heart, MessageCircle, Trash2, Repeat2, Bookmark, Pencil, Quote, Flag, Pin, BadgeCheck } from "lucide-react";
import type { PostWithDetails } from "@/hooks/useFeed";
import CommentsSection from "./CommentsSection";
import ReactionsPicker from "./ReactionsPicker";
import EditPostModal from "./EditPostModal";
import ImageCarousel from "./ImageCarousel";
import HashtagRenderer from "./HashtagRenderer";
import BlockMuteMenu from "./BlockMuteMenu";
import PollDisplay from "./PollDisplay";
import QuotedPostCard from "./QuotedPostCard";
import QuoteRepostModal from "./QuoteRepostModal";
import ShareMenu from "./ShareMenu";
import ReportModal from "./ReportModal";
import BookmarkFolders from "./BookmarkFolders";
import AudioPlayer from "./AudioPlayer";

interface PostCardProps {
  post: PostWithDetails;
  currentUserId: string;
  onUpdate: () => void;
  isBlocked?: boolean;
  isMuted?: boolean;
  onBlock?: () => void;
  onUnblock?: () => void;
  onMute?: () => void;
  onUnmute?: () => void;
  isPinned?: boolean;
  onPin?: () => void;
  onUnpin?: () => void;
  showVerified?: boolean;
}

const PostCard = ({ post, currentUserId, onUpdate, isBlocked, isMuted, onBlock, onUnblock, onMute, onUnmute, isPinned, onPin, onUnpin, showVerified }: PostCardProps) => {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [reposted, setReposted] = useState(post.reposted_by_me);
  const [repostsCount, setRepostsCount] = useState(post.reposts_count);
  const [bookmarked, setBookmarked] = useState(post.bookmarked_by_me);
  const [showComments, setShowComments] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showFolders, setShowFolders] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [authorVerified, setAuthorVerified] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const isOwner = post.user_id === currentUserId;
  const showBlockMute = !isOwner && onBlock && onUnblock && onMute && onUnmute;

  // Track view
  useEffect(() => {
    supabase.from("post_views").insert({ post_id: post.id, viewer_id: currentUserId });
  }, [post.id, currentUserId]);

  // Fetch multi-images & verified status
  useEffect(() => {
    const fetchImages = async () => {
      const { data } = await supabase
        .from("post_images")
        .select("image_url, position")
        .eq("post_id", post.id)
        .order("position", { ascending: true });

      if (data && data.length > 0) {
        setImages(data.map((d: any) => d.image_url));
      } else if (post.image_url) {
        setImages([post.image_url]);
      }
    };
    fetchImages();

    // Check verified
    supabase
      .from("profiles")
      .select("is_verified")
      .eq("user_id", post.user_id)
      .single()
      .then(({ data }) => {
        if (data && (data as any).is_verified) setAuthorVerified(true);
      });
  }, [post.id, post.image_url, post.user_id]);

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
    <div className={`island-card p-4 ${deleting ? "opacity-50 pointer-events-none" : ""}`}>
      {isPinned && (
        <div className="flex items-center gap-1 text-xs text-accent mb-2">
          <Pin className="w-3 h-3" /> Pinned post
        </div>
      )}
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to={`/profile/${post.user_id}`}>
          <Avatar className="w-10 h-10">
            <AvatarImage src={post.author.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary text-foreground text-sm">{initials}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <Link to={`/profile/${post.user_id}`} className="text-sm font-medium text-foreground hover:underline">
              {post.author.display_name || post.author.username || "Anonymous"}
            </Link>
            {authorVerified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
          </div>
          {post.author.username && (
            <p className="text-xs text-muted-foreground">@{post.author.username}</p>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
        {isOwner && (
          <div className="flex items-center gap-0.5">
            {onPin && (
              <button onClick={isPinned ? onUnpin : onPin} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors" title={isPinned ? "Unpin" : "Pin to profile"}>
                <Pin className={`w-3.5 h-3.5 ${isPinned ? "text-accent" : ""}`} />
              </button>
            )}
            <button onClick={() => setShowEdit(true)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors" title="Edit post">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={deletePost} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Delete post">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {!isOwner && (
          <button onClick={() => setShowReport(true)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Report">
            <Flag className="w-3.5 h-3.5" />
          </button>
        )}
        {showBlockMute && (
          <BlockMuteMenu userId={post.user_id} isBlocked={isBlocked || false} isMuted={isMuted || false} onBlock={onBlock!} onUnblock={onUnblock!} onMute={onMute!} onUnmute={onUnmute!} />
        )}
      </div>

      {/* Content */}
      <div className="relative">
        {(post as any).is_flagged && !revealed && (
          <div className="absolute inset-0 z-20 backdrop-blur-xl bg-background/40 flex flex-col items-center justify-center rounded-xl border border-destructive/20 p-4 min-h-[150px]">
            <Flag className="w-8 h-8 text-destructive mb-2" />
            <p className="text-sm font-semibold text-foreground mb-1">Sensitive Content</p>
            <p className="text-xs text-muted-foreground mb-3 text-center">This post was flagged by our automated moderation system.</p>
            <button onClick={() => setRevealed(true)} className="px-4 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-xs font-medium transition-colors">Show Anyway</button>
          </div>
        )}
        
        {post.content && <HashtagRenderer content={post.content} />}
        {images.length > 0 && <ImageCarousel images={images} />}
        {(post as any).video_url && (
          <div className="relative mt-3 w-full overflow-hidden rounded-xl bg-black/90">
            <video src={(post as any).video_url} muted loop playsInline autoPlay className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none" />
            <video src={(post as any).video_url} controls className="relative w-full max-h-[500px] object-contain z-10" />
          </div>
        )}
        
        {(post as any).audio_url && <AudioPlayer src={(post as any).audio_url} />}
        
        {(post as any).link_metadata && (
          <a href={(post as any).link_metadata.url} target="_blank" rel="noopener noreferrer" className="mt-3 block border border-border/50 rounded-xl overflow-hidden hover:border-border transition-colors group relative z-10">
            {(post as any).link_metadata.image && (
              <div className="w-full h-48 overflow-hidden bg-secondary">
                <img src={(post as any).link_metadata.image} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            )}
            <div className="p-3 bg-secondary/20">
              <h4 className="text-sm font-semibold text-foreground line-clamp-1">{(post as any).link_metadata.title || "Link"}</h4>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{(post as any).link_metadata.description}</p>
              <p className="text-[10px] text-muted-foreground mt-2 truncate">
                {(() => {
                  try { return new URL((post as any).link_metadata.url).hostname; } catch(e) { return (post as any).link_metadata.url; }
                })()}
              </p>
            </div>
          </a>
        )}
      </div>
      <PollDisplay postId={post.id} currentUserId={currentUserId} />
      {(post as any).quoted_post_id && <QuotedPostCard quotedPostId={(post as any).quoted_post_id} />}

      {/* Actions */}
      <div className="flex items-center gap-5 mt-4 pt-3 border-t border-border/30">
        <button onClick={toggleLike} className="flex items-center gap-1.5 text-sm transition-colors group">
          <Heart className={`w-5 h-5 transition-colors ${liked ? "fill-destructive text-destructive" : "text-muted-foreground group-hover:text-foreground"}`} />
          <span className={liked ? "text-destructive" : "text-muted-foreground group-hover:text-foreground"}>{likesCount}</span>
        </button>
        <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group">
          <MessageCircle className="w-5 h-5 group-hover:text-foreground" />
          <span>{post.comments_count}</span>
        </button>
        <button onClick={toggleRepost} className="flex items-center gap-1.5 text-sm transition-colors group">
          <Repeat2 className={`w-5 h-5 transition-colors ${reposted ? "text-accent" : "text-muted-foreground group-hover:text-foreground"}`} />
          <span className={reposted ? "text-accent" : "text-muted-foreground group-hover:text-foreground"}>{repostsCount}</span>
        </button>
        <button onClick={() => setShowQuote(true)} className="text-muted-foreground hover:text-foreground transition-colors group" title="Quote repost">
          <Quote className="w-5 h-5 group-hover:text-foreground" />
        </button>
        <ReactionsPicker postId={post.id} currentUserId={currentUserId} myReaction={post.my_reaction} reactionCounts={post.reaction_counts} onUpdate={onUpdate} />
        <div className="ml-auto flex items-center gap-4">
          <ShareMenu postId={post.id} />
          <button onClick={toggleBookmark} className="text-muted-foreground hover:text-foreground transition-colors group" onContextMenu={(e) => { e.preventDefault(); if (bookmarked) setShowFolders(true); }}>
            <Bookmark className={`w-5 h-5 ${bookmarked ? "fill-foreground text-foreground" : "group-hover:text-foreground"}`} />
          </button>
        </div>
      </div>

      {showComments && <CommentsSection postId={post.id} currentUserId={currentUserId} onUpdate={onUpdate} />}
      {showEdit && <EditPostModal postId={post.id} initialContent={post.content} onClose={() => setShowEdit(false)} onSaved={onUpdate} />}
      {showQuote && <QuoteRepostModal post={post} currentUserId={currentUserId} onClose={() => setShowQuote(false)} onCreated={onUpdate} />}
      {showReport && <ReportModal postId={post.id} currentUserId={currentUserId} onClose={() => setShowReport(false)} />}
      {showFolders && <BookmarkFolders currentUserId={currentUserId} postId={post.id} onFolderSelected={() => {}} onClose={() => setShowFolders(false)} />}
    </div>
  );
};

export default PostCard;
