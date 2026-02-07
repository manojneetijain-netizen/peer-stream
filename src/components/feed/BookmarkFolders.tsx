import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FolderPlus, Folder, X, Check } from "lucide-react";

interface BookmarkFoldersProps {
  currentUserId: string;
  postId: string;
  onFolderSelected: (folderId: string | null) => void;
  onClose: () => void;
}

interface BookmarkFolder {
  id: string;
  name: string;
  created_at: string;
}

const BookmarkFolders = ({ currentUserId, postId, onFolderSelected, onClose }: BookmarkFoldersProps) => {
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("bookmark_folders")
        .select("*")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: true });
      setFolders((data as BookmarkFolder[]) || []);

      // Check current folder for this bookmark
      const { data: bm } = await supabase
        .from("bookmarks")
        .select("folder_id")
        .eq("user_id", currentUserId)
        .eq("post_id", postId)
        .maybeSingle();
      if (bm) setCurrentFolderId((bm as any).folder_id);
    };
    fetch();
  }, [currentUserId, postId]);

  const createFolder = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const { data } = await supabase
      .from("bookmark_folders")
      .insert({ user_id: currentUserId, name: newName.trim() })
      .select()
      .single();
    if (data) setFolders((prev) => [...prev, data as BookmarkFolder]);
    setNewName("");
    setCreating(false);
  };

  const selectFolder = async (folderId: string | null) => {
    await supabase
      .from("bookmarks")
      .update({ folder_id: folderId } as any)
      .eq("user_id", currentUserId)
      .eq("post_id", postId);
    onFolderSelected(folderId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-2xl p-4 w-full max-w-xs mx-4 border border-border/30" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Move to folder</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>

        <button
          onClick={() => selectFolder(null)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
            !currentFolderId ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-secondary/50"
          }`}
        >
          <Folder className="w-4 h-4" />
          Unsorted
          {!currentFolderId && <Check className="w-3 h-3 ml-auto" />}
        </button>

        {folders.map((f) => (
          <button
            key={f.id}
            onClick={() => selectFolder(f.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
              currentFolderId === f.id ? "bg-primary/20 text-foreground" : "text-muted-foreground hover:bg-secondary/50"
            }`}
          >
            <Folder className="w-4 h-4" />
            {f.name}
            {currentFolderId === f.id && <Check className="w-3 h-3 ml-auto" />}
          </button>
        ))}

        <div className="flex gap-2 mt-3 pt-3 border-t border-border/30">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New folder..."
            className="flex-1 px-2 py-1.5 rounded-lg bg-secondary/50 border border-border text-foreground text-xs focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && createFolder()}
          />
          <button
            onClick={createFolder}
            disabled={!newName.trim() || creating}
            className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookmarkFolders;
