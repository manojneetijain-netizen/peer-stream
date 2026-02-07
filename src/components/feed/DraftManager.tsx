import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Trash2, Edit3, X } from "lucide-react";

interface Draft {
  id: string;
  content: string;
  image_urls: string[];
  poll_data: any;
  updated_at: string;
}

interface DraftManagerProps {
  currentUserId: string;
  onLoadDraft: (draft: Draft) => void;
  onClose: () => void;
}

const DraftManager = ({ currentUserId, onLoadDraft, onClose }: DraftManagerProps) => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("drafts")
        .select("*")
        .eq("user_id", currentUserId)
        .order("updated_at", { ascending: false });
      setDrafts(
        (data || []).map((d: any) => ({
          ...d,
          image_urls: d.image_urls || [],
        }))
      );
      setLoading(false);
    };
    fetch();
  }, [currentUserId]);

  const deleteDraft = async (id: string) => {
    await supabase.from("drafts").delete().eq("id", id);
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-2xl p-4 w-full max-w-sm mx-4 border border-border/30 max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Drafts
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-4">Loading...</p>
        ) : drafts.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No drafts saved</p>
        ) : (
          <div className="space-y-2">
            {drafts.map((d) => (
              <div key={d.id} className="flex items-start gap-2 p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-foreground truncate">{d.content || "(empty)"}</p>
                  <span className="text-[10px] text-muted-foreground">{timeAgo(d.updated_at)}</span>
                </div>
                <button
                  onClick={() => { onLoadDraft(d); onClose(); }}
                  className="p-1 rounded text-muted-foreground hover:text-foreground"
                  title="Load draft"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteDraft(d.id)}
                  className="p-1 rounded text-muted-foreground hover:text-destructive"
                  title="Delete draft"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DraftManager;
