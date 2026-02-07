import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Flag, X } from "lucide-react";
import { toast } from "sonner";

interface ReportModalProps {
  postId: string;
  currentUserId: string;
  onClose: () => void;
}

const REASONS = [
  "Spam or misleading",
  "Harassment or bullying",
  "Hate speech",
  "Violence or threats",
  "Inappropriate content",
  "Other",
];

const ReportModal = ({ postId, currentUserId, onClose }: ReportModalProps) => {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    await supabase.from("reports").insert({
      reporter_id: currentUserId,
      post_id: postId,
      reason,
    });
    setSubmitting(false);
    toast.success("Report submitted. Thank you for keeping the community safe.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-2xl p-6 w-full max-w-sm mx-4 border border-border/30" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            Report Post
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2">
          {REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                reason === r
                  ? "bg-primary/20 text-foreground border border-primary/40"
                  : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!reason || submitting}
          className="w-full mt-4 px-4 py-2 rounded-full bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Submitting..." : "Submit Report"}
        </button>
      </div>
    </div>
  );
};

export default ReportModal;
