import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronDown, Wand2, RefreshCw, Check, Copy } from "lucide-react";
import { streamChat } from "@/lib/openrouter";
import { toast } from "sonner";

interface AIComposerProps { currentContent: string; onApply: (text: string) => void; }

const TONES = [
  { label: "Viral 🔥", value: "viral and engaging, designed for maximum likes/shares" },
  { label: "Pro 💼", value: "professional and polished" },
  { label: "Funny 😂", value: "funny and witty" },
  { label: "Inspire ✨", value: "motivational and uplifting" },
  { label: "Chill 😎", value: "casual and conversational" },
];

const ACTIONS = [
  { id: "write", label: "Write", icon: "✍️" },
  { id: "enhance", label: "Enhance", icon: "⚡" },
  { id: "hashtags", label: "Hashtags", icon: "🏷️" },
  { id: "shorten", label: "Shorten", icon: "✂️" },
];

const buildPrompt = (actionId: string, tone: string, content: string) => {
  switch (actionId) {
    case "write": return `Write a social media caption that is ${tone}. ${content ? `Topic: ${content}` : "Make it interesting."} Include 3-5 hashtags. Max 200 chars of main text.`;
    case "enhance": return `Rewrite this caption to sound ${tone}: "${content || "Add content first!"}". Make it more engaging. Include hashtags.`;
    case "hashtags": return `List 10 trending hashtags for: "${content || "general lifestyle post"}". One per line. No explanations.`;
    case "shorten": return `Shorten to under 100 chars: "${content}". Keep the core message.`;
    default: return `Improve: "${content}"`;
  }
};

const AIComposer = ({ currentContent, onApply }: AIComposerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tone, setTone] = useState(TONES[0]);
  const [action, setAction] = useState(ACTIONS[0]);
  const [result, setResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [applied, setApplied] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setIsGenerating(true);
    setResult("");
    setApplied(false);
    try {
      await streamChat(
        [{ role: "user", content: buildPrompt(action.id, tone.value, currentContent) }],
        { systemPrompt: "You are a social media copywriter. Be concise. Give only the content, no intro or explanation.", maxTokens: 300, temperature: 0.9 },
        chunk => setResult(p => p + chunk)
      );
    } catch (e: any) { toast.error(e.message); }
    finally { setIsGenerating(false); }
  };

  const handleApply = () => {
    onApply(result); setApplied(true);
    toast.success("Caption applied! ✨");
    setTimeout(() => setApplied(false), 2500);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success("Copied!");
  };

  const showTone = !["hashtags", "shorten"].includes(action.id);

  return (
    <div className={`rounded-2xl overflow-hidden border transition-all duration-300 ${isOpen ? "border-primary/30 shadow-[0_0_30px_hsl(var(--primary)/0.12)]" : "border-border/20"}`}>
      {/* Toggle header */}
      <button onClick={() => setIsOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 transition-all duration-200 ${isOpen ? "bg-primary/8" : "bg-secondary/20 hover:bg-secondary/30"}`}>
        <div className="flex items-center gap-3">
          {/* AI glow icon */}
          <div className={`relative w-7 h-7 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shadow-[0_0_12px_hsl(var(--primary)/0.5)] transition-all ${isOpen ? "scale-105" : ""}`}>
            <Sparkles className="w-3.5 h-3.5 text-white" />
            {isOpen && <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary to-violet-500 animate-ping opacity-20" style={{ animationDuration: "2s" }} />}
          </div>
          <div className="text-left">
            <span className="text-sm font-black text-foreground">AI Writing Assistant</span>
            {!isOpen && <p className="text-[10px] text-muted-foreground">Click to generate captions with AI</p>}
          </div>
        </div>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-3 space-y-4 border-t border-border/15 bg-secondary/5">

              {/* Action tabs */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2.5">What to do</p>
                <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-secondary/30 border border-border/20">
                  {ACTIONS.map(a => (
                    <button key={a.id} onClick={() => setAction(a)}
                      className={`flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs font-bold transition-all ${
                        action.id === a.id
                          ? "bg-primary text-primary-foreground shadow-[0_2px_8px_hsl(var(--primary)/0.4)]"
                          : "text-muted-foreground hover:text-foreground"
                      }`}>
                      <span className="text-sm">{a.icon}</span>
                      <span className="text-[10px]">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tone pills */}
              <AnimatePresence>
                {showTone && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2.5">Tone</p>
                    <div className="flex flex-wrap gap-1.5">
                      {TONES.map(t => (
                        <button key={t.label} onClick={() => setTone(t)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            tone.label === t.label
                              ? "bg-gradient-to-r from-primary to-violet-500 text-white shadow-[0_2px_8px_hsl(var(--primary)/0.4)]"
                              : "bg-secondary/50 text-muted-foreground hover:text-foreground border border-border/20"
                          }`}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Generate button */}
              <motion.button onClick={generate} disabled={isGenerating}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-gradient-to-r from-primary to-violet-500 text-white text-sm font-black hover:opacity-90 disabled:opacity-50 transition-all shadow-[0_4px_20px_hsl(var(--primary)/0.35)]">
                {isGenerating
                  ? <><RefreshCw className="w-4 h-4 animate-spin" />Generating magic...</>
                  : <><Wand2 className="w-4 h-4" />Generate with AI</>}
              </motion.button>

              {/* Result area */}
              <AnimatePresence>
                {(result || isGenerating) && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="rounded-xl overflow-hidden border border-border/20 bg-secondary/10">
                    {/* Result header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border/15">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-violet-500" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">AI Output</span>
                      </div>
                      {result && !isGenerating && (
                        <button onClick={handleCopy}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
                          {copied ? <><Check className="w-3 h-3 text-emerald-400" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                        </button>
                      )}
                    </div>

                    {/* Result text */}
                    <div className="px-4 py-3 min-h-[60px]">
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {result}
                        {isGenerating && (
                          <span className="inline-block w-1.5 h-4 bg-primary ml-0.5 animate-pulse rounded-sm align-middle" />
                        )}
                      </p>
                    </div>

                    {/* Actions */}
                    {result && !isGenerating && (
                      <div className="flex items-center gap-2 px-3 py-2 border-t border-border/15 bg-secondary/10">
                        <button onClick={generate}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-secondary/50">
                          <RefreshCw className="w-3 h-3" />Retry
                        </button>
                        <motion.button onClick={handleApply} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                          className={`ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                            applied
                              ? "bg-emerald-500 text-white shadow-[0_2px_10px_rgba(16,185,129,0.4)]"
                              : "bg-gradient-to-r from-primary to-violet-500 text-white shadow-[0_2px_10px_hsl(var(--primary)/0.4)]"
                          }`}>
                          {applied ? <><Check className="w-3.5 h-3.5" />Applied!</> : <>Apply to Caption →</>}
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIComposer;
