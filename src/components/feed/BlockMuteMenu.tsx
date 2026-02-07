import { useState } from "react";
import { MoreHorizontal, ShieldBan, VolumeX, Volume2, ShieldCheck } from "lucide-react";

interface BlockMuteMenuProps {
  userId: string;
  isBlocked: boolean;
  isMuted: boolean;
  onBlock: () => void;
  onUnblock: () => void;
  onMute: () => void;
  onUnmute: () => void;
}

const BlockMuteMenu = ({ userId, isBlocked, isMuted, onBlock, onUnblock, onMute, onUnmute }: BlockMuteMenuProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-50 w-48 glass rounded-xl border border-border/30 shadow-xl overflow-hidden">
            <button
              onClick={() => { isMuted ? onUnmute() : onMute(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
            >
              {isMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {isMuted ? "Unmute user" : "Mute user"}
            </button>
            <button
              onClick={() => {
                if (isBlocked) {
                  onUnblock();
                } else if (confirm("Block this user? They won't be able to see your profile or interact with you.")) {
                  onBlock();
                }
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors ${isBlocked ? "text-foreground hover:bg-secondary/50" : "text-destructive hover:bg-destructive/10"}`}
            >
              {isBlocked ? <ShieldCheck className="w-4 h-4" /> : <ShieldBan className="w-4 h-4" />}
              {isBlocked ? "Unblock user" : "Block user"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BlockMuteMenu;
