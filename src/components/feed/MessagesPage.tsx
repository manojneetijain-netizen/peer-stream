import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import OnlineIndicator from "./OnlineIndicator";
import TypingIndicator from "./TypingIndicator";
import AIAssistant from "./AIAssistant";
import { Send, ArrowLeft, PenSquare, Search, X, Trash2, MoreVertical, Check, CheckCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Conversation {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  last_message: string;
  last_time: string;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface MessagesPageProps {
  currentUserId: string;
  onBack: () => void;
  isOnline?: (userId: string) => boolean;
  isTypingTo?: (userId: string, recipientId: string) => boolean;
  setTyping?: (recipientId: string | null) => void;
}

const MessagesPage = ({ currentUserId, onBack, isOnline, isTypingTo, setTyping }: MessagesPageProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [showAI, setShowAI] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<{
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null>(null);

  const fetchConversations = useCallback(async () => {
    const { data: allMessages } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order("created_at", { ascending: false });

    if (!allMessages || allMessages.length === 0) { setConversations([]); return; }

    const convMap = new Map<string, { last: typeof allMessages[0]; unread: number }>();
    allMessages.forEach((m) => {
      const otherId = m.sender_id === currentUserId ? m.receiver_id : m.sender_id;
      if (!convMap.has(otherId)) convMap.set(otherId, { last: m, unread: 0 });
      if (m.receiver_id === currentUserId && !m.read) convMap.get(otherId)!.unread++;
    });

    const userIds = [...convMap.keys()];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    setConversations([...convMap.entries()].map(([userId, { last, unread }]) => {
      const p = profileMap.get(userId);
      return { user_id: userId, username: p?.username ?? null, display_name: p?.display_name ?? null, avatar_url: p?.avatar_url ?? null, last_message: last.content, last_time: last.created_at, unread };
    }));
  }, [currentUserId]);

  const fetchMessages = useCallback(async (otherUserId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
      .order("created_at", { ascending: true });
    setMessages(data || []);
    await supabase.from("messages").update({ read: true }).eq("sender_id", otherUserId).eq("receiver_id", currentUserId).eq("read", false);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [currentUserId]);

  useEffect(() => {
    fetchConversations();
    const channel = supabase
      .channel("conversations-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
        const msg = (payload.new || payload.old) as Message;
        if (msg && (msg.sender_id === currentUserId || msg.receiver_id === currentUserId)) {
          fetchConversations();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchConversations, currentUserId]);

  useEffect(() => {
    if (!selectedUser) return;
    fetchMessages(selectedUser);
    const channel = supabase
      .channel(`dm-${selectedUser}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const old = payload.old as any;
          if (old?.id) setMessages((prev) => prev.filter((m) => m.id !== old.id));
          return;
        }
        const msg = payload.new as Message;
        if ((msg.sender_id === currentUserId && msg.receiver_id === selectedUser) || (msg.sender_id === selectedUser && msg.receiver_id === currentUserId)) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedUser, fetchMessages, currentUserId]);

  useEffect(() => {
    return () => { setTyping?.(null); };
  }, [selectedUser, setTyping]);

  const handleTyping = (value: string) => {
    setText(value);
    if (selectedUser && setTyping) {
      setTyping(selectedUser);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTyping(null), 2000);
    }
  };

  const openConversation = (userId: string) => {
    const conv = conversations.find((c) => c.user_id === userId);
    setSelectedProfile(conv ? { display_name: conv.display_name, username: conv.username, avatar_url: conv.avatar_url } : null);
    setSelectedUser(userId);
  };

  const sendMessage = async () => {
    if (!text.trim() || !selectedUser) return;
    setSending(true);
    setTyping?.(null);
    await supabase.from("messages").insert({ sender_id: currentUserId, receiver_id: selectedUser, content: text.trim() });
    setText("");
    setSending(false);
  };

  const deleteMessage = async (msgId: string) => {
    setDeletingMsgId(msgId);
    await supabase.from("messages").delete().eq("id", msgId).eq("sender_id", currentUserId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    setDeletingMsgId(null);
    toast.success("Message deleted");
  };

  const deleteConversation = async (otherUserId: string) => {
    if (!confirm("Delete all your sent messages in this conversation?")) return;
    await supabase.from("messages").delete().eq("sender_id", currentUserId).eq("receiver_id", otherUserId);
    toast.success("Messages deleted");
    if (selectedUser === otherUserId) {
      setSelectedUser(null);
    }
    fetchConversations();
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  const otherIsTyping = selectedUser && isTypingTo ? isTypingTo(selectedUser, currentUserId) : false;

  // AI Assistant view
  if (showAI) {
    return <AIAssistant onBack={() => setShowAI(false)} />;
  }

  // Chat view
  if (selectedUser) {
    const initials = (selectedProfile?.display_name || selectedProfile?.username || "?").slice(0, 2).toUpperCase();
    return (
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        <div className="flex items-center gap-3 p-3 border-b border-border/20 glass-card">
          <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Link to={`/profile/${selectedUser}`} className="flex items-center gap-2 flex-1">
            <div className="relative">
              <Avatar className="w-8 h-8">
                <AvatarImage src={selectedProfile?.avatar_url || undefined} />
                <AvatarFallback className="bg-secondary text-foreground text-xs">{initials}</AvatarFallback>
              </Avatar>
              <OnlineIndicator isOnline={isOnline?.(selectedUser) ?? false} />
            </div>
            <div>
              <span className="text-sm font-medium text-foreground">
                {selectedProfile?.display_name || selectedProfile?.username || "User"}
              </span>
              {isOnline?.(selectedUser) && (
                <p className="text-[10px] text-accent">Online</p>
              )}
            </div>
          </Link>
          <div className="relative">
            <button onClick={() => setShowChatMenu(!showChatMenu)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
            {showChatMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowChatMenu(false)} />
                <div className="absolute right-0 top-8 z-50 glass-card rounded-xl border border-border/20 shadow-xl overflow-hidden min-w-[180px]">
                  <button
                    onClick={() => { deleteConversation(selectedUser); setShowChatMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete conversation
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={`flex ${m.sender_id === currentUserId ? "justify-end" : "justify-start"} group`}
              >
                {m.sender_id === currentUserId && (
                  <button
                    onClick={() => deleteMessage(m.id)}
                    disabled={deletingMsgId === m.id}
                    className="self-center mr-1.5 p-1 rounded-lg text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
                <div className={`flex flex-col ${m.sender_id === currentUserId ? "items-end" : "items-start"}`}>
                  <div
                    className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm ${
                      m.sender_id === currentUserId
                        ? "bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-br-sm shadow-sm"
                        : "glass-card text-foreground rounded-bl-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.sender_id === currentUserId && (
                    <div className="flex items-center gap-1 mt-1 mr-1">
                      <span className="text-[10px] text-muted-foreground">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {m.read ? (
                        <CheckCheck className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <Check className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {otherIsTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-border/20 glass-card">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => handleTyping(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Message..."
              className="flex-1 px-3.5 py-2 rounded-full bg-secondary/40 border border-border/30 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 backdrop-blur-sm"
            />
            <motion.button
              onClick={sendMessage}
              disabled={sending || !text.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // New message search
  const searchUsers = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) { setSearchResults([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url")
      .neq("user_id", currentUserId)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(10);
    setSearchResults(data || []);
  };

  const startConversation = (userId: string, profile: any) => {
    setSelectedProfile({ display_name: profile.display_name, username: profile.username, avatar_url: profile.avatar_url });
    setSelectedUser(userId);
    setShowNewMessage(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  // Conversations list
  return (
    <div>
      <div className="flex items-center justify-between p-3 border-b border-border/20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-sm font-semibold text-foreground">Messages</h2>
        </div>
        <button
          onClick={() => setShowNewMessage(true)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <PenSquare className="w-4 h-4" />
        </button>
      </div>

      {/* New message search modal */}
      {showNewMessage && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-background/60 backdrop-blur-md" onClick={() => { setShowNewMessage(false); setSearchQuery(""); setSearchResults([]); }}>
          <div className="glass-card rounded-2xl p-4 w-full max-w-sm mx-4 border border-border/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">New Message</h3>
              <button onClick={() => { setShowNewMessage(false); setSearchQuery(""); setSearchResults([]); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => searchUsers(e.target.value)}
                placeholder="Search users..."
                autoFocus
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-secondary/30 border border-border/30 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 backdrop-blur-sm"
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {searchResults.length === 0 && searchQuery.trim() && (
                <p className="text-xs text-muted-foreground text-center py-4">No users found</p>
              )}
              {!searchQuery.trim() && (
                <p className="text-xs text-muted-foreground text-center py-4">Search for a user to start a conversation</p>
              )}
              {searchResults.map((u) => {
                const initials = (u.display_name || u.username || "?").slice(0, 2).toUpperCase();
                return (
                  <button
                    key={u.user_id}
                    onClick={() => startConversation(u.user_id, u)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/30 transition-colors"
                  >
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback className="bg-secondary text-foreground text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground">{u.display_name || u.username || "Anonymous"}</p>
                      {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {conversations.length === 0 && !showNewMessage ? (
        <div>
          {/* Always show AI even when no conversations */}
          <div className="divide-y divide-border/20">
            <motion.button
              onClick={() => setShowAI(true)}
              whileHover={{ backgroundColor: "hsl(var(--secondary) / 0.2)" }}
              className="w-full flex items-center gap-3 p-3 transition-colors"
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-accent to-purple-500 flex items-center justify-center shadow-[0_0_14px_hsl(var(--primary)/0.5)]">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-background" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">Pulse AI</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">AI</span>
                </div>
                <p className="text-xs text-muted-foreground truncate">Your personal AI assistant</p>
              </div>
            </motion.button>
          </div>
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">No human messages yet</p>
            <button
              onClick={() => setShowNewMessage(true)}
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Start a conversation
            </button>
          </div>
        </div>

      ) : (
        <div className="divide-y divide-border/20">
          {/* Pulse AI pinned entry */}
          <motion.button
            onClick={() => setShowAI(true)}
            whileHover={{ backgroundColor: "hsl(var(--secondary) / 0.2)" }}
            className="w-full flex items-center gap-3 p-3 transition-colors"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-accent to-purple-500 flex items-center justify-center shadow-[0_0_14px_hsl(var(--primary)/0.5)]">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-background" />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">Pulse AI</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">AI</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">Your personal AI assistant</p>
            </div>
          </motion.button>

          {conversations.map((conv) => {
            const initials = (conv.display_name || conv.username || "?").slice(0, 2).toUpperCase();
            return (
              <div key={conv.user_id} className="flex items-center group">
                <motion.button
                  onClick={() => openConversation(conv.user_id)}
                  whileHover={{ backgroundColor: "hsl(var(--secondary) / 0.2)" }}
                  className="flex-1 flex items-center gap-3 p-3 transition-colors"
                >
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={conv.avatar_url || undefined} />
                      <AvatarFallback className="bg-secondary text-foreground text-sm">{initials}</AvatarFallback>
                    </Avatar>
                    <OnlineIndicator isOnline={isOnline?.(conv.user_id) ?? false} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{conv.display_name || conv.username || "User"}</span>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(conv.last_time)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                  </div>
                  {conv.unread > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-primary-foreground"
                    >
                      {conv.unread}
                    </motion.span>
                  )}
                </motion.button>
                <button
                  onClick={() => deleteConversation(conv.user_id)}
                  className="p-2 mr-2 rounded-lg text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                  title="Delete conversation"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
