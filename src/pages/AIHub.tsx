import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { streamChat, ChatMessage, AGENT_MODELS } from "@/lib/openrouter";
import { toast } from "sonner";
import FeedSidebar from "@/components/feed/FeedSidebar";
import GradientBackground from "@/components/feed/GradientBackground";
import MobileBottomNav from "@/components/feed/MobileBottomNav";
import {
  Sparkles, Send, RefreshCw, ArrowLeft, Copy, Check,
  Search, Clock, ChevronRight, Code2, Pencil, TrendingUp, Bot, Zap, X,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Agent {
  id: string; name: string; emoji: string; tagline: string;
  description: string; gradient: string; glowColor: string;
  iconBg: string; model: string; systemPrompt: string; starters: string[];
  Icon: React.ElementType;
}
interface Msg { id: string; role: "user" | "assistant"; content: string; }
interface HistoryItem { agentId: string; agentName: string; firstMessage: string; timestamp: number; iconBg: string; }

// ── Agents ────────────────────────────────────────────────────────────────────
const AGENTS: Agent[] = [
  {
    id: "techWizard", name: "Tech Wizard", emoji: "🧙‍♂️",
    tagline: "ENGINEER • DEBUGGER • ARCHITECT",
    description: "Write code, debug errors, explain complex concepts, and architect solutions across any tech stack.",
    gradient: "from-blue-500 to-indigo-600", glowColor: "rgba(99,102,241,0.3)",
    iconBg: "bg-gradient-to-br from-blue-500 to-indigo-600",
    model: AGENT_MODELS.techWizard, Icon: Code2,
    systemPrompt: "You are Tech Wizard, an elite software engineer. Give concise, working code with markdown code blocks.",
    starters: ["Debug my React hook", "Explain async/await", "Design a REST API", "Write a SQL query"],
  },
  {
    id: "creativeWriter", name: "Creative Writer", emoji: "✍️",
    tagline: "COPYWRITER • POET • STORYTELLER",
    description: "Craft viral captions, compelling stories, poetry, song lyrics, and unforgettable marketing copy.",
    gradient: "from-pink-500 to-rose-600", glowColor: "rgba(236,72,153,0.3)",
    iconBg: "bg-gradient-to-br from-pink-500 to-rose-600",
    model: AGENT_MODELS.creativeWriter, Icon: Pencil,
    systemPrompt: "You are Creative Writer, a master of social media copy and storytelling. Be vivid and engaging. Give only the content.",
    starters: ["Viral Instagram caption", "Poem about city lights", "Story opening line", "Product tagline"],
  },
  {
    id: "pulseHelper", name: "Pulse Helper", emoji: "💡",
    tagline: "GROWTH • STRATEGY • ANALYTICS",
    description: "Grow your audience, decode analytics, build content calendars, and master social media marketing.",
    gradient: "from-amber-400 to-orange-500", glowColor: "rgba(249,115,22,0.3)",
    iconBg: "bg-gradient-to-br from-amber-400 to-orange-500",
    model: AGENT_MODELS.pulseHelper, Icon: TrendingUp,
    systemPrompt: "You are Pulse Helper, a social media growth expert. Give practical, actionable advice.",
    starters: ["Grow my followers", "Best posting time", "Week content plan", "Hashtag strategy"],
  },
  {
    id: "aiAssistant", name: "General AI", emoji: "🤖",
    tagline: "KNOWLEDGE • RESEARCH • CONVERSATION",
    description: "Your all-purpose AI — trivia, analysis, translation, summarization, advice, or great conversation.",
    gradient: "from-emerald-400 to-teal-600", glowColor: "rgba(20,184,166,0.3)",
    iconBg: "bg-gradient-to-br from-emerald-400 to-teal-600",
    model: AGENT_MODELS.aiAssistant, Icon: Bot,
    systemPrompt: "You are a brilliant, knowledgeable, and warm AI assistant. Answer accurately and conversationally.",
    starters: ["Explain quantum physics", "Translate to Japanese", "Summarize a concept", "Recipe suggestions"],
  },
];

const HISTORY_KEY = "pulse_ai_history";

const readHistory = (): HistoryItem[] => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
  catch { return []; }
};

const saveHistory = (item: HistoryItem) => {
  const existing = readHistory().filter(h => h.agentId !== item.agentId);
  localStorage.setItem(HISTORY_KEY, JSON.stringify([item, ...existing].slice(0, 10)));
};

const timeAgo = (ts: number) => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
};

// ── Chat overlay ──────────────────────────────────────────────────────────────
const ChatOverlay = ({ agent, onClose, onFirstMessage }: { agent: Agent; onClose: () => void; onFirstMessage: () => void }) => {
  const [messages, setMessages] = useState<Msg[]>([
    { id: "w", role: "assistant", content: `Hey! I'm **${agent.name}** — ${agent.description}\n\nHow can I help you today?` },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const endRef = { current: null as HTMLDivElement | null };

  const scrollBottom = () => endRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollBottom, [messages]);

  const send = async (text = input.trim()) => {
    if (!text || streaming) return;
    setInput("");
    // Record first real user message
    const isFirst = messages.filter(m => m.role === "user").length === 0;
    if (isFirst) onFirstMessage();
    const uid = `u-${Date.now()}`, aid = `a-${Date.now()}`;
    setMessages(p => [...p, { id: uid, role: "user", content: text }, { id: aid, role: "assistant", content: "" }]);
    setStreaming(true);
    try {
      const history: ChatMessage[] = messages.filter(m => m.id !== "w").map(m => ({ role: m.role, content: m.content }));
      history.push({ role: "user", content: text });
      await streamChat(history, { model: agent.model, systemPrompt: agent.systemPrompt, maxTokens: 4096 },
        chunk => setMessages(p => p.map(m => m.id === aid ? { ...m, content: m.content + chunk } : m)));
    } catch (e: any) { toast.error(e.message); setMessages(p => p.filter(m => m.id !== aid)); }
    finally { setStreaming(false); }
  };

  const copy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); toast.success("Copied!");
  };

  const renderMd = (t: string) =>
    t.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
      if (p.startsWith("`") && p.endsWith("`")) return <code key={i} className="px-1.5 py-0.5 rounded bg-secondary/80 text-xs font-mono">{p.slice(1, -1)}</code>;
      return <span key={i} className="whitespace-pre-wrap">{p}</span>;
    });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xl p-4"
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-2xl h-[80vh] flex flex-col island-card overflow-hidden"
      >
        {/* Header */}
        <div className={`shrink-0 flex items-center gap-3 px-5 py-4 border-b border-border/15`}>
          <div className={`w-10 h-10 rounded-2xl ${agent.iconBg} flex items-center justify-center text-lg shadow-lg`}
            style={{ boxShadow: `0 4px 16px ${agent.glowColor}` }}>
            <agent.Icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-black text-foreground">{agent.name}</p>
            <p className={`text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r ${agent.gradient} bg-clip-text text-transparent`}>
              {agent.tagline}
            </p>
          </div>
          <button onClick={() => setMessages([{ id: "w", role: "assistant", content: `Chat cleared! How can I help?` }])}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all" title="Clear">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} group`}>
                {msg.role === "assistant" && (
                  <div className={`w-8 h-8 rounded-xl ${agent.iconBg} flex items-center justify-center mr-2.5 shrink-0 mt-0.5`}
                    style={{ boxShadow: `0 2px 10px ${agent.glowColor}` }}>
                    <agent.Icon className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`flex flex-col max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? `bg-gradient-to-br ${agent.gradient} text-white rounded-br-sm`
                      : "glass-card text-foreground rounded-bl-sm border border-border/20"
                  }`} style={msg.role === "user" ? { boxShadow: `0 4px 16px ${agent.glowColor}` } : {}}>
                    {msg.content ? renderMd(msg.content) : (
                      streaming && msg.role === "assistant" && (
                        <div className="flex gap-1 py-0.5">
                          {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                        </div>
                      )
                    )}
                  </div>
                  {msg.role === "assistant" && msg.content && (
                    <button onClick={() => copy(msg.id, msg.content)}
                      className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-all hover:text-muted-foreground">
                      {copiedId === msg.id ? <><Check className="w-3 h-3 text-green-400"/>Copied</> : <><Copy className="w-3 h-3"/>Copy</>}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {messages.length === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className="grid grid-cols-2 gap-2 mt-2">
              {agent.starters.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="px-3 py-2.5 rounded-xl glass-card border border-border/20 text-left text-xs font-medium text-foreground/80 hover:border-primary/30 hover:text-foreground transition-all hover:scale-[1.02]">
                  {s} →
                </button>
              ))}
            </motion.div>
          )}
          <div ref={el => { endRef.current = el; }} />
        </div>

        {/* Input */}
        <div className="shrink-0 px-4 pb-4 pt-3 border-t border-border/15">
          <div className="flex gap-2 items-center p-2 pl-4 rounded-2xl glass border border-border/20 focus-within:border-primary/30 transition-all">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder={`Message ${agent.name}...`} disabled={streaming} autoFocus
              className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/40 disabled:opacity-50" />
            <motion.button onClick={() => send()} disabled={streaming || !input.trim()}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className={`p-2.5 rounded-xl bg-gradient-to-br ${agent.gradient} text-white disabled:opacity-40 shrink-0`}
              style={{ boxShadow: input.trim() ? `0 4px 14px ${agent.glowColor}` : undefined }}>
              {streaming ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </motion.button>
          </div>
          <p className="text-[10px] text-muted-foreground/40 text-center mt-2 flex items-center justify-center gap-1.5">
            <Sparkles className="w-2.5 h-2.5 text-primary/60" />
            <span>Pulse Intelligence · Responses may vary</span>
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ── Agent card ────────────────────────────────────────────────────────────────
const AgentCard = ({ agent, onClick, index }: { agent: Agent; onClick: () => void; index: number }) => (
  <motion.button onClick={onClick}
    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -4 }} whileTap={{ scale: 0.99 }}
    className="island-card p-5 text-left w-full group relative overflow-hidden rounded-2xl"
  >
    {/* Top gradient line */}
    <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${agent.gradient}`} />
    {/* Hover glow halo */}
    <div className={`absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br ${agent.gradient}`}
      style={{ filter: "blur(24px)", opacity: 0, mixBlendMode: "screen" }} />
    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      style={{ background: `radial-gradient(600px circle at 50% 0%, ${agent.glowColor}, transparent 40%)` }}
    />

    <div className="relative flex items-start gap-4">
      {/* Icon */}
      <div className={`w-12 h-12 rounded-2xl ${agent.iconBg} flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3`}
        style={{ boxShadow: `0 8px 24px ${agent.glowColor}` }}>
        <agent.Icon className="w-6 h-6 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <h3 className="text-base font-black text-foreground">{agent.name}</h3>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all shrink-0" />
        </div>
        <p className={`text-[10px] font-black uppercase tracking-widest mb-2.5 bg-gradient-to-r ${agent.gradient} bg-clip-text text-transparent`}>
          {agent.tagline}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">{agent.description}</p>
        {/* Starters */}
        <div className="flex flex-wrap gap-1.5">
          {agent.starters.map(s => (
            <span key={s} className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-secondary/50 text-muted-foreground border border-border/20 group-hover:border-border/40 transition-colors">
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  </motion.button>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const AIHub = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from localStorage on mount
  useEffect(() => { setHistory(readHistory()); }, []);

  const recordUsage = (agent: Agent) => {
    const item: HistoryItem = {
      agentId: agent.id,
      agentName: agent.name,
      firstMessage: new Date().toLocaleString(),
      timestamp: Date.now(),
      iconBg: agent.iconBg,
    };
    saveHistory(item);
    setHistory(readHistory());
  };

  useEffect(() => {
    if (!user?.id) return;
    supabase.from("profiles").select("display_name, username, avatar_url").eq("user_id", user.id).single()
      .then(({ data }) => setProfile(data));
  }, [user?.id]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const filtered = search.trim()
    ? AGENTS.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase()))
    : AGENTS;

  return (
    <div className="min-h-screen flex bg-background">
      <GradientBackground />

      {/* ── Left Sidebar ── */}
      <div className="hidden lg:block">
        <div className="fixed top-0 left-0 h-screen py-4 pl-4 z-40">
          <div className="island-sidebar h-full">
            <FeedSidebar currentUserId={user.id} onMessagesClick={() => navigate("/feed")} profile={profile} />
          </div>
        </div>
        <div className="w-[272px] shrink-0" />
      </div>

      {/* ── Mobile header ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-surface">
        <div className="px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-black gradient-text">AI Hub</span>
          <div className="w-8" />
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 mt-14 lg:mt-0 pb-24 lg:pb-0">
        <div className="max-w-[1100px] mx-auto px-4 lg:px-6 py-6 lg:py-8 flex gap-6">

          {/* Center column */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Page header */}
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_4px_16px_hsl(var(--primary)/0.4)]">
                  <Sparkles className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-foreground tracking-tight uppercase">AI Hub</h1>
                  <p className="text-xs text-muted-foreground">Your Intelligence Dashboard</p>
                </div>
              </div>
            </motion.div>

            {/* Welcome banner */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="island-card p-7 relative overflow-hidden">
              {/* Layered ambient glows */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-primary/30 via-accent/20 to-transparent rounded-full blur-3xl"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-12 -left-12 w-44 h-44 bg-gradient-to-br from-violet-500/20 to-primary/10 rounded-full blur-3xl"
              />
              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{ backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px w-8 bg-gradient-to-r from-transparent to-primary/60" />
                  <span className="text-[10px] font-black tracking-[0.2em] uppercase text-primary/80">Intelligence Suite</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-foreground mb-2 leading-tight">
                  Welcome to your <span className="bg-gradient-to-r from-primary via-accent to-violet-500 bg-clip-text text-transparent">AI Hub</span>
                </h2>
                <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
                  Four specialized minds, one streamlined workspace. Pick an assistant and start creating.
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-5">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/25 backdrop-blur-sm">
                    <span className="relative flex w-1.5 h-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping" />
                      <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-green-500" />
                    </span>
                    <span className="text-[11px] font-bold text-green-400">4 agents online</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/25 backdrop-blur-sm">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-[11px] font-bold text-primary">Pulse Intelligence</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 backdrop-blur-sm">
                    <Sparkles className="w-3 h-3 text-violet-400" />
                    <span className="text-[11px] font-bold text-violet-400">Real-time</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Agent grid — 2×2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((agent, i) => (
                <AgentCard key={agent.id} agent={agent} index={i} onClick={() => setActiveAgent(agent)} />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-2 text-center py-16 text-muted-foreground">
                  <Bot className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No agents match your search</p>
                </div>
              )}
            </div>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="text-center text-[11px] text-muted-foreground/40 pb-2">
              AI responses may contain inaccuracies. Always verify critical information.
            </motion.p>
          </div>

          {/* ── Right sidebar ── */}
          <div className="hidden xl:block w-72 shrink-0 space-y-5 pt-0">
            {/* Search */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search AI tools..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass-card border border-border/20 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/30 transition-all" />
              </div>
            </motion.div>

            {/* Recent Activity — only shown when real history exists */}
            <AnimatePresence>
              {history.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.2 }}
                  className="island-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-black text-foreground">Recent Activity</h3>
                  </div>
                  <div className="space-y-3">
                    {history.slice(0, 5).map((item, i) => (
                      <motion.div key={item.agentId + item.timestamp} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-start gap-3 group cursor-pointer"
                        onClick={() => { const a = AGENTS.find(ag => ag.id === item.agentId); if (a) setActiveAgent(a); }}>
                        <div className={`w-8 h-8 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Sparkles className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-snug truncate">
                            Chatted with {item.agentName}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(item.timestamp)}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  {history.length > 5 && (
                    <p className="mt-3 text-[11px] text-muted-foreground/50">{history.length - 5} more sessions</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick tips */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              className="island-card p-5">
              <h3 className="text-sm font-black text-foreground mb-3">Pro Tips 💡</h3>
              <div className="space-y-2.5">
                {[
                  "Be specific in your prompts for better results",
                  "Use Tech Wizard for code reviews",
                  "Creative Writer works great for captions",
                ].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Chat overlay */}
      <AnimatePresence>
        {activeAgent && <ChatOverlay agent={activeAgent} onClose={() => setActiveAgent(null)} onFirstMessage={() => recordUsage(activeAgent)} />}
      </AnimatePresence>

      <MobileBottomNav />
    </div>
  );
};

export default AIHub;
