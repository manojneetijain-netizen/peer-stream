import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageCarouselProps {
  images: string[];
}

const ImageCarousel = ({ images }: ImageCarouselProps) => {
  const [current, setCurrent] = useState(0);

  if (images.length === 0) return null;
  if (images.length === 1) {
    return <img src={images[0]} alt="Post" className="mt-3 rounded-xl w-full max-h-96 object-cover" />;
  }

  return (
    <div className="relative mt-3 rounded-xl overflow-hidden group">
      <img src={images[current]} alt={`Slide ${current + 1}`} className="w-full max-h-96 object-cover" />

      {current > 0 && (
        <button
          onClick={() => setCurrent((c) => c - 1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/70 text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/90"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}
      {current < images.length - 1 && (
        <button
          onClick={() => setCurrent((c) => c + 1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/70 text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/90"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Dots indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? "bg-foreground w-3" : "bg-foreground/50"}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageCarousel;
