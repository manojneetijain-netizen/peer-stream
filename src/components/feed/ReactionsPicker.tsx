import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const REACTIONS = ["❤️", "😂", "🔥", "👏", "😢", "😮"] as const;

interface ReactionsPickerProps {
  postId: string;
  currentUserId: string;
  myReaction: string | null;
  reactionCounts: Record<string, number>;
  onUpdate: () => void;
}

const ReactionsPicker = ({ postId, currentUserId, myReaction, reactionCounts, onUpdate }: ReactionsPickerProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const [currentReaction, setCurrentReaction] = useState(myReaction);

  const toggleReaction = async (emoji: string) => {
    if (currentReaction === emoji) {
      // Remove reaction
      await supabase.from("reactions").delete().eq("user_id", currentUserId).eq("post_id", postId);
      setCurrentReaction(null);
    } else if (currentReaction) {
      // Update reaction
      await supabase.from("reactions").update({ reaction_type: emoji }).eq("user_id", currentUserId).eq("post_id", postId);
      setCurrentReaction(emoji);
    } else {
      // Add reaction
      await supabase.from("reactions").insert({ user_id: currentUserId, post_id: postId, reaction_type: emoji });
      setCurrentReaction(emoji);
    }
    setShowPicker(false);
    onUpdate();
  };

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  // Show top 3 reactions
  const topReactions = Object.entries(reactionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="flex items-center gap-1 text-sm transition-colors group"
      >
        {currentReaction ? (
          <span className="text-base">{currentReaction}</span>
        ) : (
          <span className="text-muted-foreground group-hover:text-foreground">😊</span>
        )}
        {topReactions.length > 0 && (
          <span className="flex items-center gap-0.5">
            {topReactions.map(([emoji]) => (
              <span key={emoji} className="text-xs">{emoji}</span>
            ))}
          </span>
        )}
        {totalReactions > 0 && (
          <span className="text-xs text-muted-foreground">{totalReactions}</span>
        )}
      </button>

      {showPicker && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setShowPicker(false)} />
          <div className="absolute bottom-8 left-0 z-40 flex gap-1 p-2 glass rounded-full shadow-lg">
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => toggleReaction(emoji)}
                className={`text-lg p-1 rounded-full hover:bg-secondary/50 transition-transform hover:scale-125 ${currentReaction === emoji ? "bg-secondary/50 scale-110" : ""}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ReactionsPicker;
