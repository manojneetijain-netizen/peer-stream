import { useState, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import MobileBottomNav from "@/components/feed/MobileBottomNav";
import { ArrowLeft, Plus, List, Trash2, UserPlus, UserMinus, X, Users } from "lucide-react";

interface UserList {
  id: string;
  name: string;
  description: string;
  created_at: string;
  member_count?: number;
}

interface ListMember {
  member_id: string;
  profile?: { username: string | null; display_name: string | null; avatar_url: string | null };
}

const UserLists = () => {
  const { user, loading: authLoading } = useAuth();
  const [lists, setLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [selectedList, setSelectedList] = useState<UserList | null>(null);
  const [members, setMembers] = useState<ListMember[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);

  const fetchLists = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("user_lists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const listsData = (data || []) as UserList[];

    // Get member counts
    for (const list of listsData) {
      const { count } = await supabase
        .from("user_list_members")
        .select("id", { count: "exact", head: true })
        .eq("list_id", list.id);
      list.member_count = count || 0;
    }

    setLists(listsData);
    setLoading(false);
  };

  useEffect(() => { fetchLists(); }, [user]);

  const fetchMembers = async (listId: string) => {
    const { data } = await supabase
      .from("user_list_members")
      .select("member_id")
      .eq("list_id", listId);

    if (!data || data.length === 0) { setMembers([]); return; }

    const memberIds = data.map((d) => d.member_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url")
      .in("user_id", memberIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
    setMembers(data.map((d) => ({ member_id: d.member_id, profile: profileMap.get(d.member_id) })));
  };

  const fetchFollowing = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    const ids = (data || []).map((f) => f.following_id);
    if (ids.length === 0) { setFollowing([]); return; }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url")
      .in("user_id", ids);

    setFollowing(profiles || []);
  };

  const createList = async () => {
    if (!user || !newName.trim()) return;
    await supabase.from("user_lists").insert({ user_id: user.id, name: newName.trim(), description: newDesc.trim() });
    setNewName(""); setNewDesc(""); setShowCreate(false);
    fetchLists();
  };

  const deleteList = async (id: string) => {
    if (!confirm("Delete this list?")) return;
    await supabase.from("user_lists").delete().eq("id", id);
    if (selectedList?.id === id) setSelectedList(null);
    fetchLists();
  };

  const openList = (list: UserList) => {
    setSelectedList(list);
    fetchMembers(list.id);
  };

  const addMember = async (memberId: string) => {
    if (!selectedList) return;
    await supabase.from("user_list_members").insert({ list_id: selectedList.id, member_id: memberId });
    fetchMembers(selectedList.id);
    fetchLists();
  };

  const removeMember = async (memberId: string) => {
    if (!selectedList) return;
    await supabase.from("user_list_members").delete().eq("list_id", selectedList.id).eq("member_id", memberId);
    fetchMembers(selectedList.id);
    fetchLists();
  };

  if (authLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const memberIds = new Set(members.map((m) => m.member_id));
  const addableUsers = following.filter((f) => !memberIds.has(f.user_id));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass border-b border-border/30">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/feed" className="p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          {selectedList ? (
            <button onClick={() => setSelectedList(null)} className="text-muted-foreground hover:text-foreground text-sm">← Back</button>
          ) : null}
          <Users className="w-4 h-4 text-foreground" />
          <span className="text-lg font-bold gradient-text">{selectedList ? selectedList.name : "Lists"}</span>
          {!selectedList && (
            <button onClick={() => setShowCreate(true)} className="ml-auto p-2 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground">
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-20 lg:pb-6 space-y-4">
        {selectedList ? (
          <>
            {selectedList.description && (
              <p className="text-sm text-muted-foreground">{selectedList.description}</p>
            )}
            <button
              onClick={() => { setShowAddMember(true); fetchFollowing(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
            >
              <UserPlus className="w-4 h-4" /> Add Member
            </button>

            {members.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-center">
                <p className="text-muted-foreground text-sm">No members yet. Add people you follow!</p>
              </div>
            ) : (
              <div className="glass rounded-2xl divide-y divide-border/30">
                {members.map((m) => {
                  const initials = (m.profile?.display_name || m.profile?.username || "?").slice(0, 2).toUpperCase();
                  return (
                    <div key={m.member_id} className="flex items-center gap-3 p-3">
                      <Link to={`/profile/${m.member_id}`}>
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={m.profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-secondary text-foreground text-xs">{initials}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/profile/${m.member_id}`} className="text-sm font-medium text-foreground hover:underline">
                          {m.profile?.display_name || m.profile?.username || "Anonymous"}
                        </Link>
                        {m.profile?.username && <p className="text-xs text-muted-foreground">@{m.profile.username}</p>}
                      </div>
                      <button onClick={() => removeMember(m.member_id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add member modal */}
            {showAddMember && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={() => setShowAddMember(false)}>
                <div className="glass rounded-2xl p-4 w-full max-w-sm mx-4 border border-border/30 max-h-96 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">Add from following</h3>
                    <button onClick={() => setShowAddMember(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                  {addableUsers.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">All followed users are already in this list</p>
                  ) : (
                    addableUsers.map((u) => {
                      const initials = (u.display_name || u.username || "?").slice(0, 2).toUpperCase();
                      return (
                        <div key={u.user_id} className="flex items-center gap-3 py-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={u.avatar_url || undefined} />
                            <AvatarFallback className="bg-secondary text-foreground text-xs">{initials}</AvatarFallback>
                          </Avatar>
                          <span className="flex-1 text-sm text-foreground truncate">{u.display_name || u.username}</span>
                          <button onClick={() => addMember(u.user_id)} className="text-xs px-3 py-1 rounded-full bg-primary text-primary-foreground hover:opacity-90">Add</button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {loading ? (
              <div className="text-center py-12 text-sm text-muted-foreground">Loading lists...</div>
            ) : lists.length === 0 ? (
              <div className="glass rounded-2xl p-6 text-center">
                <h2 className="text-xl font-semibold text-foreground mb-2">No lists yet</h2>
                <p className="text-muted-foreground text-sm">Create lists to organize people you follow!</p>
              </div>
            ) : (
              <div className="glass rounded-2xl divide-y divide-border/30">
                {lists.map((list) => (
                  <div key={list.id} className="flex items-center gap-3 p-4 hover:bg-secondary/20 transition-colors cursor-pointer" onClick={() => openList(list)}>
                    <List className="w-5 h-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{list.name}</p>
                      <p className="text-xs text-muted-foreground">{list.member_count || 0} members</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteList(list.id); }}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Create list modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
            <div className="glass rounded-2xl p-5 w-full max-w-sm mx-4 border border-border/30" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-foreground mb-4">Create List</h3>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="List name"
                className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground text-sm mb-3 focus:outline-none"
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border text-foreground text-sm mb-4 focus:outline-none resize-none"
              />
              <div className="flex gap-2">
                <button onClick={createList} disabled={!newName.trim()} className="flex-1 px-4 py-2 rounded-full bg-gradient-to-r from-pulse-blue to-pulse-cyan text-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  Create
                </button>
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-full bg-secondary text-foreground text-sm hover:bg-secondary/80">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <MobileBottomNav />
    </div>
  );
};

export default UserLists;
