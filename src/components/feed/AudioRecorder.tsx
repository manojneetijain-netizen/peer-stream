import { useState, useRef } from "react";
import { Mic, Square, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

interface AudioRecorderProps {
  onAudioReady: (file: File | null) => void;
}

const AudioRecorder = ({ onAudioReady }: AudioRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        const file = new File([audioBlob], `audio-${Date.now()}.webm`, { type: "audio/webm" });
        onAudioReady(file);

        // Stop all tracks to turn off the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const clearRecording = () => {
    setAudioURL(null);
    onAudioReady(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (audioURL) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-xl bg-secondary/30 w-full mt-2">
        <audio src={audioURL} controls className="h-8 flex-1" />
        <button
          onClick={clearRecording}
          className="p-1.5 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <button
          onClick={startRecording}
          className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          title="Record Audio"
        >
          <Mic className="w-5 h-5" />
        </button>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 bg-destructive/10 text-destructive px-3 py-1.5 rounded-full"
        >
          <motion.div 
            animate={{ opacity: [1, 0.5, 1] }} 
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-2.5 h-2.5 bg-destructive rounded-full"
          />
          <span className="text-sm font-medium w-12 text-center">{formatTime(recordingTime)}</span>
          <button
            onClick={stopRecording}
            className="p-1 rounded-full bg-destructive text-destructive-foreground hover:opacity-80 transition-opacity"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default AudioRecorder;
