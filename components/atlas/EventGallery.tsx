"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EventImage } from "@/lib/content/schema";

export function EventGallery({ images }: { images: EventImage[] }) {
  const [i, setI] = useState(0);
  if (images.length === 0) return null;
  const img = images[i];
  const go = (d: number) => setI((cur) => (cur + d + images.length) % images.length);

  return (
    <div className="space-y-2 px-4">
      <div className="relative overflow-hidden rounded-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.src} alt={img.alt} className="h-52 w-full object-cover" />
        {images.length > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Previous image"
              className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-background/70 p-1 text-foreground hover:bg-background">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => go(1)} aria-label="Next image"
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-background/70 p-1 text-foreground hover:bg-background">
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/70 to-transparent px-2 py-1 text-[10px] text-muted-foreground">
          {img.credit} · {img.license}
        </div>
      </div>
      {images.length > 1 && (
        <div className="flex gap-1.5">
          {images.map((t, idx) => (
            <button key={idx} onClick={() => setI(idx)} aria-label={`Image ${idx + 1}`}
              className={cn("h-12 w-16 overflow-hidden rounded border", idx === i ? "border-primary" : "border-border opacity-70")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
