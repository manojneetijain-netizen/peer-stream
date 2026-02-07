import { useState } from "react";
import { Clock, X } from "lucide-react";

interface PostSchedulerProps {
  onSchedule: (date: Date | null) => void;
}

const PostScheduler = ({ onSchedule }: PostSchedulerProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [scheduledTime, setScheduledTime] = useState<string>("");

  const handleSet = () => {
    if (scheduledDate && scheduledTime) {
      const dt = new Date(`${scheduledDate}T${scheduledTime}`);
      if (dt > new Date()) {
        onSchedule(dt);
        setShowPicker(false);
      }
    }
  };

  const handleClear = () => {
    setScheduledDate("");
    setScheduledTime("");
    onSchedule(null);
    setShowPicker(false);
  };

  // Min date is now
  const now = new Date();
  const minDate = now.toISOString().split("T")[0];
  const minTime = scheduledDate === minDate ? now.toTimeString().slice(0, 5) : "00:00";

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        title="Schedule post"
      >
        <Clock className="w-5 h-5" />
      </button>

      {showPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
          <div className="absolute bottom-10 left-0 z-50 glass rounded-xl border border-border/30 shadow-xl p-3 w-64">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Schedule Post</span>
              <button onClick={() => setShowPicker(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              <input
                type="date"
                value={scheduledDate}
                min={minDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg bg-secondary/50 border border-border text-foreground text-sm focus:outline-none"
              />
              <input
                type="time"
                value={scheduledTime}
                min={minTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg bg-secondary/50 border border-border text-foreground text-sm focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSet}
                  disabled={!scheduledDate || !scheduledTime}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  Set
                </button>
                <button
                  onClick={handleClear}
                  className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-sm hover:bg-secondary/80"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PostScheduler;
