import { useState } from "react";
import { Share2, Link2, Twitter, Copy, Check } from "lucide-react";

interface ShareMenuProps {
  postId: string;
}

const ShareMenu = ({ postId }: ShareMenuProps) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const postUrl = `${window.location.origin}/post/${postId}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}`, "_blank");
  };

  const shareNative = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Check out this post", url: postUrl });
    } else {
      copyLink();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-muted-foreground hover:text-foreground transition-colors group"
        title="Share"
      >
        <Share2 className="w-5 h-5 group-hover:text-foreground" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-8 right-0 z-50 w-48 glass rounded-xl border border-border/30 shadow-xl p-1">
            <button
              onClick={() => { copyLink(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-accent" /> : <Link2 className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button
              onClick={() => { shareTwitter(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
            >
              <Twitter className="w-4 h-4" />
              Share on X
            </button>
            <button
              onClick={() => { shareNative(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground hover:bg-secondary/50 rounded-lg transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share...
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ShareMenu;
