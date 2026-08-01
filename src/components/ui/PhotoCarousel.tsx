import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

interface PhotoCarouselProps {
  photos: string[];
  alt?: string;
  imageClassName?: string;
  showDots?: boolean;
  className?: string;
}

export default function PhotoCarousel({
  photos,
  alt,
  imageClassName,
  showDots = true,
  className,
}: PhotoCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  const photosKey = photos.join("\u0000");

  useEffect(() => {
    setCurrent(0);
    api?.scrollTo(0);
  }, [photosKey, api]);

  if (photos.length === 0) return null;

  return (
    <div className={cn("relative w-full", className)}>
      <Carousel setApi={setApi} className="w-full overflow-hidden">
        <CarouselContent>
          {photos.map((src, idx) => (
            <CarouselItem key={idx}>
              <img
                src={src}
                alt={alt ? `${alt} ${idx + 1}` : ""}
                loading="lazy"
                className={cn("w-full object-cover", imageClassName)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        {photos.length > 1 && (
          <>
            <CarouselPrevious
              className="left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 border-0 bg-white/90 text-slate-800 shadow-lg hover:bg-white hover:text-[#280f91]"
              variant="outline"
            />
            <CarouselNext
              className="right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 border-0 bg-white/90 text-slate-800 shadow-lg hover:bg-white hover:text-[#280f91]"
              variant="outline"
            />
          </>
        )}
      </Carousel>

      {showDots && photos.length > 1 && (
        <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
          {photos.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Foto ke-${idx + 1}`}
              onClick={() => api?.scrollTo(idx)}
              className={cn(
                "h-2 rounded-full transition-all cursor-pointer",
                current === idx ? "w-6 bg-white shadow" : "w-2 bg-white/60 hover:bg-white"
              )}
            />
          ))}
        </div>
      )}

      {photos.length > 1 && (
        <span className="absolute right-3 top-3 z-20 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-black text-white">
          {current + 1}/{photos.length}
        </span>
      )}
    </div>
  );
}
