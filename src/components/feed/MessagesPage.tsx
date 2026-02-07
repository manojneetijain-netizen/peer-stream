import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Send, ArrowLeft } from "lucide-react";

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
}

const MessagesPage = ({ currentUserId, onBack }: MessagesPageProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
      if (!convMap.has(otherId)) {
        convMap.set(otherId, { last: m, unread: 0 });
      }
      if (m.receiver_id === currentUserId && !m.read) {
        const entry = convMap.get(otherId)!;
        entry.unread++;
      }
    });

    const userIds = [...convMap.keys()];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, display_name, avatar_url")
      .in("user_id", userIds);

    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));

    const convList: Conversation[] = [...convMap.entries()].map(([userId, { last, unread }]) => {
      const p = profileMap.get(userId);
      return {
        user_id: userId,
        username: p?.username ?? null,
        display_name: p?.display_name ?? null,
        avatar_url: p?.avatar_url ?? null,
        last_message: last.content,
        last_time: last.created_at,
        unread,
      };
    });

    setConversations(convList);
  }, [currentUserId]);

  const fetchMessages = useCallback(async (otherUserId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`
      )
      .order("created_at", { ascending: true });

    setMessages(data || []);

    // Mark received messages as read
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", otherUserId)
      .eq("receiver_id", currentUserId)
      .eq("read", false);

    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [currentUserId]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (!selectedUser) return;
    fetchMessages(selectedUser);

    const channel = supabase
      .channel(`dm-${selectedUser}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as Message;
        if (
          (msg.sender_id === currentUserId && msg.receiver_id === selectedUser) ||
          (msg.sender_id === selectedUser && msg.receiver_id === currentUserId)
        ) {
          setMessages((prev) => [...prev, msg]);
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedUser, fetchMessages, currentUserId]);

  const openConversation = (userId: string) => {
    const conv = conversations.find((c) => c.user_id === userId);
    setSelectedProfile(conv ? { display_name: conv.display_name, username: conv.username, avatar_url: conv.avatar_url } : null);
    setSelectedUser(userId);
  };

  const sendMessage = async () => {
    if (!text.trim() || !selectedUser) return;
    setSending(true);
    await supabase.from("messages").insert({
      sender_id: currentUserId,
      receiver_id: selectedUser,
      content: text.trim(),
    });
    setText("");
    setSending(false);
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

  // Chat view
  if (selectedUser) {
    const initials = (selectedProfile?.display_name || selectedProfile?.username || "?").slice(0, 2).toUpperCase();
    return (
      <div className="flex flex-col h-[calc(100vh-3.5rem)]">
        <div className="flex items-center gap-3 p-3 border-b border-border/30 glass">
          <button onClick={() => setSelectedUser(null)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Link to={`/profile/${selectedUser}`} className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={selectedProfile?.avatar_url || undefined} />
              <AvatarFallback className="bg-secondary text-foreground text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground">
              {selectedProfile?.display_name || selectedProfile?.username || "User"}
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender_id === currentUserId ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                  m.sender_id === currentUserId
                    ? "bg-gradient-to-r from-pulse-blue to-pulse-cyan text-foreground rounded-br-sm"
                    : "bg-secondary text-foreground rounded-bl-sm"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t border-border/30 glass">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Message..."
              className="flex-1 px-3 py-2 rounded-full bg-secondary/50 border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !text.trim()}
              className="p-2 rounded-full bg-gradient-to-r from-pulse-blue to-pulse-cyan text-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Conversations list
  return (
    <div>
      <div className="flex items-center gap-3 p-3 border-b border-border/30">
        <button onClick={onBack} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h2 className="text-sm font-semibold text-foreground">Messages</h2>
      </div>
      {conversations.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          No messages yet. Visit a profile and send a message!
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {conversations.map((conv) => {
            const initials = (conv.display_name || conv.username || "?").slice(0, 2).toUpperCase();
            return (
              <button
                key={conv.user_id}
                onClick={() => openConversation(conv.user_id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-secondary/30 transition-colors"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={conv.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary text-foreground text-sm">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{conv.display_name || conv.username || "User"}</span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(conv.last_time)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.last_message}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-gradient-to-r from-pulse-blue to-pulse-cyan text-[10px] font-bold flex items-center justify-center text-foreground">
                    {conv.unread}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
