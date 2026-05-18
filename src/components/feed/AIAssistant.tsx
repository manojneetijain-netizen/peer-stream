import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Send, Sparkles, RefreshCw, Copy, Check, Zap } from "lucide-react";
import { streamChat, ChatMessage } from "@/lib/openrouter";
import { toast } from "sonner";

interface AIAssistantProps { onBack: () => void; }

const SYSTEM_PROMPT = `You are Pulse AI — the friendly, witty, and intelligent assistant built into the Pulse social media platform. You help users with anything: writing posts, suggesting hashtags, creative ideas, answering questions, and general conversation. Keep responses concise, engaging, and natural. Use emojis occasionally to match the social media vibe.`;

const QUICK_PROMPTS = [
  { label: "Write a viral post", emoji: "🔥" },
  { label: "Suggest hashtags", emoji: "🏷️" },
  { label: "Caption idea", emoji: "✨" },
  { label: "Grow my followers", emoji: "📈" },
];

interface Message { id: string; role: "user" | "assistant"; content: string; }

const AIAssistant = ({ onBack }: AIAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "w", role: "assistant", content: "Hey! 👋 I'm **Pulse AI** — ask me anything. I can write posts, suggest hashtags, brainstorm ideas, or just chat!" },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text = input.trim()) => {
    if (!text || isStreaming) return;
    setInput("");
    const uid = `u-${Date.now()}`, aid = `a-${Date.now()}`;
    setMessages(p => [...p, { id: uid, role: "user", content: text }, { id: aid, role: "assistant", content: "" }]);
    setIsStreaming(true);
    try {
      const history: ChatMessage[] = messages.filter(m => m.id !== "w").map(m => ({ role: m.role, content: m.content }));
      history.push({ role: "user", content: text });
      await streamChat(history, { systemPrompt: SYSTEM_PROMPT, maxTokens: 512 },
        chunk => setMessages(p => p.map(m => m.id === aid ? { ...m, content: m.content + chunk } : m)));
    } catch (e: any) {
      toast.error(e.message);
      setMessages(p => p.filter(m => m.id !== aid));
    } finally { setIsStreaming(false); }
  };

  const copy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); toast.success("Copied!");
  };

  const renderMd = (t: string) =>
    t.split(/(\*\*[^*]+\*\*)/).map((p, i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i} className="font-bold">{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>
    );

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">

      {/* ── Header ── */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border/15 glass-card">
        <button onClick={onBack}
          className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary via-violet-500 to-accent flex items-center justify-center shadow-[0_0_20px_hsl(var(--primary)/0.5)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-accent animate-ping opacity-20" style={{ animationDuration: "3s" }} />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-background shadow-[0_0_8px_#10b981]" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-foreground leading-none">Pulse AI</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] text-emerald-400 font-semibold">Always online</p>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20">
          <Zap className="w-3 h-3 text-primary" />
          <span className="text-[10px] font-bold text-primary">AI</span>
        </div>

        <button onClick={() => setMessages([{ id: "w", role: "assistant", content: "Hey! 👋 I'm **Pulse AI** — what can I help you with?" }])}
          className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all" title="Clear chat">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} group`}>

              {/* AI avatar */}
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary via-violet-500 to-accent flex items-center justify-center mr-2.5 shrink-0 mt-0.5 shadow-[0_0_14px_hsl(var(--primary)/0.4)]">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              <div className={`flex flex-col max-w-[78%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-primary to-violet-600 text-white rounded-br-sm shadow-[0_4px_20px_hsl(var(--primary)/0.35)]"
                    : "glass-card text-foreground rounded-bl-sm border border-white/5"
                }`}>
                  {msg.content
                    ? renderMd(msg.content)
                    : msg.role === "assistant" && isStreaming && (
                      <div className="flex gap-1 py-0.5">
                        {[0, 1, 2].map(i => (
                          <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                    )}
                </div>

                {msg.role === "assistant" && msg.content && (
                  <button onClick={() => copy(msg.id, msg.content)}
                    className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-all hover:text-muted-foreground">
                    {copiedId === msg.id
                      ? <><Check className="w-3 h-3 text-emerald-400" />Copied</>
                      : <><Copy className="w-3 h-3" />Copy</>}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Quick prompts — only on welcome screen */}
        {messages.length === 1 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="grid grid-cols-2 gap-2 mt-2">
            {QUICK_PROMPTS.map((p) => (
              <button key={p.label} onClick={() => send(p.label)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-2xl glass-card border border-border/20 text-left hover:border-primary/30 hover:bg-primary/5 transition-all group">
                <span className="text-base">{p.emoji}</span>
                <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground transition-colors">{p.label}</span>
              </button>
            ))}
          </motion.div>
        )}

        <div ref={endRef} />
      </div>

      {/* ── Input ── */}
      <div className="shrink-0 px-4 py-3 border-t border-border/15 glass-card">
        <div className="flex gap-2 items-center p-2 rounded-2xl glass border border-border/20 focus-within:border-primary/30 transition-all">
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask Pulse AI anything..." disabled={isStreaming}
            className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground/40 px-2 disabled:opacity-50" />
          <motion.button onClick={() => send()} disabled={isStreaming || !input.trim()}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="p-2.5 rounded-xl bg-gradient-to-br from-primary to-violet-600 text-white disabled:opacity-40 transition-all shrink-0 shadow-[0_2px_12px_hsl(var(--primary)/0.4)]">
            {isStreaming ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </motion.button>
        </div>
        <p className="text-[10px] text-muted-foreground/30 text-center mt-2">Pulse AI · Powered by OpenRouter</p>
      </div>
    </div>
  );
};

export default AIAssistant;
