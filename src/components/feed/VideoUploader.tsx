import { useRef, useState } from "react";
import { Video, X } from "lucide-react";

interface VideoUploaderProps {
  onVideoSelected: (file: File | null) => void;
  preview: string | null;
}

const VideoUploader = ({ onVideoSelected, preview }: VideoUploaderProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        onClick={() => fileRef.current?.click()}
        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        title="Add video"
      >
        <Video className="w-5 h-5" />
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          onVideoSelected(file);
        }}
      />
      {preview && (
        <div className="relative mt-2">
          <video src={preview} controls className="w-full max-h-48 rounded-xl object-cover" />
          <button
            onClick={() => { onVideoSelected(null); if (fileRef.current) fileRef.current.value = ""; }}
            className="absolute top-1 right-1 p-1 rounded-full bg-background/80 text-foreground hover:bg-background"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
};

export default VideoUploader;
