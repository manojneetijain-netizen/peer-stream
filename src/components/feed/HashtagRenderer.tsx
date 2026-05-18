import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface HashtagRendererProps {
  content: string;
}

const MentionLink = ({ username, label }: { username: string; label: string }) => {
  const navigate = useNavigate();
  
  const handleClick = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("username", username)
      .maybeSingle();

    if (data?.user_id) {
      navigate(`/profile/${data.user_id}`);
    } else {
      toast.error(`User @${username} not found`);
    }
  };

  return (
    <span
      onClick={handleClick}
      className="text-accent hover:underline font-medium cursor-pointer"
    >
      {label}
    </span>
  );
};

const HashtagRenderer = ({ content }: HashtagRendererProps) => {
  // Split by hashtags and @mentions
  const parts = content.split(/(#\w+|@\w+)/g);

  return (
    <p className="mt-3 text-sm text-foreground whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith("#")) {
          const tag = part.slice(1).toLowerCase();
          return (
            <Link
              key={i}
              to={`/hashtag/${tag}`}
              className="text-primary hover:underline font-medium"
            >
              {part}
            </Link>
          );
        }
        if (part.startsWith("@")) {
          const username = part.slice(1);
          return (
            <MentionLink
              key={i}
              username={username}
              label={part}
            />
          );
        }
        return part;
      })}
    </p>
  );
};

export default HashtagRenderer;

// Utility to extract hashtags from content
export function extractHashtags(content: string): string[] {
  const matches = content.match(/#(\w+)/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}

// Utility to extract mentions from content
export function extractMentions(content: string): string[] {
  const matches = content.match(/@(\w+)/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.slice(1).toLowerCase()))];
}
