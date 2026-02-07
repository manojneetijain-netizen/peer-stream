import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Check } from "lucide-react";

interface EditPostModalProps {
  postId: string;
  initialContent: string;
  onClose: () => void;
  onSaved: () => void;
}

const EditPostModal = ({ postId, initialContent, onClose, onSaved }: EditPostModalProps) => {
  const [content, setContent] = useState(initialContent);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!content.trim()) return;
    setSaving(true);
    await supabase.from("posts").update({ content: content.trim() }).eq("id", postId);
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 flex items-center justify-center" onClick={onClose}>
      <div className="max-w-md w-full mx-4 glass rounded-2xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Edit Post</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-sm text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary border border-border"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-full bg-secondary text-foreground text-sm hover:bg-secondary/80">Cancel</button>
          <button
            onClick={save}
            disabled={saving || !content.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-pulse-blue to-pulse-cyan text-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;
