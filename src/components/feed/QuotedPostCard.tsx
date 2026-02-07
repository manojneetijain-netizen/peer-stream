import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface QuotedPostCardProps {
  quotedPostId: string;
}

const QuotedPostCard = ({ quotedPostId }: QuotedPostCardProps) => {
  const [post, setPost] = useState<any>(null);
  const [author, setAuthor] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("posts").select("*").eq("id", quotedPostId).maybeSingle();
      if (!data) return;
      setPost(data);
      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("user_id", data.user_id)
        .maybeSingle();
      setAuthor(profile);
    };
    fetch();
  }, [quotedPostId]);

  if (!post) return (
    <div className="mt-3 rounded-xl border border-border/40 p-3 bg-secondary/10">
      <p className="text-xs text-muted-foreground italic">Original post unavailable</p>
    </div>
  );

  const initials = (author?.display_name || author?.username || "?").slice(0, 2).toUpperCase();

  return (
    <Link to={`/profile/${post.user_id}`} className="block mt-3 rounded-xl border border-border/40 p-3 bg-secondary/10 hover:bg-secondary/20 transition-colors">
      <div className="flex items-center gap-2 mb-1">
        <Avatar className="w-5 h-5">
          <AvatarImage src={author?.avatar_url || undefined} />
          <AvatarFallback className="text-[10px] bg-secondary text-foreground">{initials}</AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium text-foreground">
          {author?.display_name || author?.username || "Anonymous"}
        </span>
        {author?.username && <span className="text-xs text-muted-foreground">@{author.username}</span>}
      </div>
      {post.content && <p className="text-xs text-muted-foreground line-clamp-3">{post.content}</p>}
      {post.image_url && <img src={post.image_url} alt="" className="mt-1.5 h-20 w-full object-cover rounded-lg" />}
    </Link>
  );
};

export default QuotedPostCard;
