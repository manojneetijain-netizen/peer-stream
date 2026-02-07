import { useState } from "react";
import { Plus, X, BarChart3 } from "lucide-react";

interface PollCreatorProps {
  onPollChange: (poll: { question: string; options: string[] } | null) => void;
}

const PollCreator = ({ onPollChange }: PollCreatorProps) => {
  const [active, setActive] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const togglePoll = () => {
    if (active) {
      setActive(false);
      setQuestion("");
      setOptions(["", ""]);
      onPollChange(null);
    } else {
      setActive(true);
    }
  };

  const updateOption = (i: number, val: string) => {
    const newOpts = [...options];
    newOpts[i] = val;
    setOptions(newOpts);
    const validOpts = newOpts.filter((o) => o.trim());
    if (question.trim() && validOpts.length >= 2) {
      onPollChange({ question: question.trim(), options: validOpts });
    } else {
      onPollChange(null);
    }
  };

  const updateQuestion = (val: string) => {
    setQuestion(val);
    const validOpts = options.filter((o) => o.trim());
    if (val.trim() && validOpts.length >= 2) {
      onPollChange({ question: val.trim(), options: validOpts });
    } else {
      onPollChange(null);
    }
  };

  const addOption = () => {
    if (options.length < 4) setOptions([...options, ""]);
  };

  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    const newOpts = options.filter((_, idx) => idx !== i);
    setOptions(newOpts);
    const validOpts = newOpts.filter((o) => o.trim());
    if (question.trim() && validOpts.length >= 2) {
      onPollChange({ question: question.trim(), options: validOpts });
    } else {
      onPollChange(null);
    }
  };

  if (!active) {
    return (
      <button onClick={togglePoll} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors" title="Add poll">
        <BarChart3 className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="mt-2 p-3 rounded-xl bg-secondary/30 border border-border/30 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">Poll</span>
        <button onClick={togglePoll} className="p-1 rounded text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <input
        value={question}
        onChange={(e) => updateQuestion(e.target.value)}
        placeholder="Ask a question..."
        className="w-full px-3 py-2 rounded-lg bg-secondary/50 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={opt}
            onChange={(e) => updateOption(i, e.target.value)}
            placeholder={`Option ${i + 1}`}
            className="flex-1 px-3 py-1.5 rounded-lg bg-secondary/50 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {options.length > 2 && (
            <button onClick={() => removeOption(i)} className="p-1 text-muted-foreground hover:text-destructive">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ))}
      {options.length < 4 && (
        <button onClick={addOption} className="flex items-center gap-1 text-xs text-primary hover:text-primary/80">
          <Plus className="w-3.5 h-3.5" /> Add option
        </button>
      )}
    </div>
  );
};

export default PollCreator;
