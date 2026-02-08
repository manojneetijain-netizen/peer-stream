import { useRef, useEffect, useState } from "react";
import { Play } from "lucide-react";

interface ReelThumbnailProps {
  videoUrl: string;
  viewCount?: number;
  onClick: () => void;
}

const ReelThumbnail = ({ videoUrl, viewCount, onClick }: ReelThumbnailProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Load a frame for the thumbnail
    video.preload = "metadata";
    video.currentTime = 1;
    video.addEventListener("loadeddata", () => setLoaded(true), { once: true });
  }, [videoUrl]);

  return (
    <button
      onClick={onClick}
      className="relative aspect-[9/16] w-full rounded-xl overflow-hidden bg-gray-900 group cursor-pointer"
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        muted
        playsInline
      />
      {!loaded && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse" />
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-10 h-10 text-white drop-shadow-xl" />
        </div>
      </div>

      {/* View count */}
      {viewCount !== undefined && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-xs font-semibold drop-shadow-lg">
          <Play className="w-3 h-3 fill-white" />
          {viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}K` : viewCount}
        </div>
      )}
    </button>
  );
};

export default ReelThumbnail;
