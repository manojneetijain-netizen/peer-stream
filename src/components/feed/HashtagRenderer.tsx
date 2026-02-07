import { Link } from "react-router-dom";

interface HashtagRendererProps {
  content: string;
}

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
            <span
              key={i}
              className="text-accent hover:underline font-medium cursor-pointer"
              onClick={() => {
                // Navigate to user search - for now link style
              }}
            >
              {part}
            </span>
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
