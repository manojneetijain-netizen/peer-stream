import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PollDisplayProps {
  postId: string;
  currentUserId: string;
}

interface PollOption {
  id: string;
  text: string;
  position: number;
  votes: number;
}

const PollDisplay = ({ postId, currentUserId }: PollDisplayProps) => {
  const [poll, setPoll] = useState<{ id: string; question: string; ends_at: string } | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [myVote, setMyVote] = useState<string | null>(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPoll = async () => {
    const { data: pollData } = await supabase
      .from("polls")
      .select("id, question, ends_at")
      .eq("post_id", postId)
      .maybeSingle();

    if (!pollData) {
      setLoading(false);
      return;
    }
    setPoll(pollData);

    const { data: opts } = await supabase
      .from("poll_options")
      .select("id, text, position")
      .eq("poll_id", pollData.id)
      .order("position", { ascending: true });

    const { data: votes } = await supabase
      .from("poll_votes")
      .select("option_id, user_id")
      .eq("poll_id", pollData.id);

    const voteCountMap = new Map<string, number>();
    let myVoteId: string | null = null;
    (votes || []).forEach((v: any) => {
      voteCountMap.set(v.option_id, (voteCountMap.get(v.option_id) || 0) + 1);
      if (v.user_id === currentUserId) myVoteId = v.option_id;
    });

    setOptions((opts || []).map((o: any) => ({ ...o, votes: voteCountMap.get(o.id) || 0 })));
    setMyVote(myVoteId);
    setTotalVotes((votes || []).length);
    setLoading(false);
  };

  useEffect(() => {
    fetchPoll();
    // Real-time vote updates
    const channel = supabase
      .channel(`poll-${postId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "poll_votes" }, () => fetchPoll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [postId, currentUserId]);

  const vote = async (optionId: string) => {
    if (!poll) return;
    const ended = new Date(poll.ends_at) < new Date();
    if (ended) return;

    if (myVote) {
      // Change vote
      await supabase.from("poll_votes").delete().eq("poll_id", poll.id).eq("user_id", currentUserId);
    }
    await supabase.from("poll_votes").insert({ poll_id: poll.id, option_id: optionId, user_id: currentUserId });
    setMyVote(optionId);
    fetchPoll();
  };

  if (loading || !poll) return null;

  const ended = new Date(poll.ends_at) < new Date();
  const hasVoted = !!myVote;
  const showResults = hasVoted || ended;

  return (
    <div className="mt-3 p-3 rounded-xl bg-secondary/20 border border-border/30">
      <p className="text-sm font-medium text-foreground mb-3">{poll.question}</p>
      <div className="space-y-2">
        {options.map((opt) => {
          const pct = totalVotes > 0 ? (opt.votes / totalVotes) * 100 : 0;
          const isMyVote = opt.id === myVote;

          return (
            <button
              key={opt.id}
              onClick={() => !ended && vote(opt.id)}
              disabled={ended}
              className={`w-full text-left relative rounded-lg overflow-hidden transition-colors ${
                showResults ? "cursor-default" : "hover:bg-secondary/40 cursor-pointer"
              } ${isMyVote ? "ring-1 ring-primary" : ""}`}
            >
              {showResults && (
                <div
                  className="absolute inset-0 bg-primary/15 rounded-lg transition-all"
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative px-3 py-2 flex items-center justify-between">
                <span className="text-sm text-foreground">{opt.text}</span>
                {showResults && (
                  <span className="text-xs font-medium text-muted-foreground">{pct.toFixed(0)}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground">{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
        <span className="text-xs text-muted-foreground">
          {ended ? "Poll ended" : `Ends ${new Date(poll.ends_at).toLocaleDateString()}`}
        </span>
      </div>
    </div>
  );
};

export default PollDisplay;
