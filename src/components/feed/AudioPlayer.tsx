import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { motion } from "framer-motion";

interface AudioPlayerProps {
  src: string;
}

const AudioPlayer = ({ src }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [src]);

  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Generate mock bars for a waveform
  const totalBars = 32;
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex flex-col gap-2 p-4 rounded-2xl bg-secondary/20 border border-border/30 backdrop-blur-md max-w-md mt-3 relative overflow-hidden group">
      {/* Dynamic ambient pulse behind player when playing */}
      {isPlaying && (
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 pointer-events-none blur-xl"
        />
      )}

      <div className="flex items-center gap-4 relative z-10">
        {/* Play/Pause Button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all shrink-0"
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
        </motion.button>

        {/* Waveform Visualization */}
        <div className="flex-1 flex items-end gap-[3px] h-10 px-1 select-none">
          {Array.from({ length: totalBars }).map((_, index) => {
            const barProgress = (index / totalBars) * 100;
            const isPlayed = barProgress <= progressPercent;
            
            // Deterministic heights for stylized look
            const height = 15 + Math.sin(index * 0.5) * 10 + Math.cos(index * 0.25) * 8;
            
            return (
              <motion.div
                key={index}
                animate={isPlaying ? {
                  height: [height, height * (0.4 + Math.random() * 0.8), height],
                } : { height }}
                transition={{
                  duration: 0.8 + (index % 3) * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`flex-1 rounded-full min-w-[3px] max-w-[4px] transition-colors duration-200 ${
                  isPlayed 
                    ? "bg-gradient-to-t from-primary to-accent" 
                    : "bg-muted-foreground/30"
                }`}
                style={{ height }}
              />
            );
          })}
        </div>

        {/* Mute/Unmute */}
        <button
          onClick={toggleMute}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors shrink-0"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Progress Slider and Time Labels */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground relative z-10 px-1 mt-1">
        <span>{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1 rounded-lg appearance-none bg-muted-foreground/20 accent-primary cursor-pointer focus:outline-none"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) ${progressPercent}%, hsl(var(--muted-foreground) / 0.2) ${progressPercent}%)`
          }}
        />
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

export default AudioPlayer;
