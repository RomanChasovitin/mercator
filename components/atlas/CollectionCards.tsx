"use client";

import { useEffect, useState } from "react";
import { useMap } from "@/components/atlas/MapProvider";
import type { Collection } from "@/lib/content/schema";
import { Lock } from "lucide-react";

export function CollectionCards({
  collections, onOpen,
}: {
  collections: Collection[];
  onOpen: (collectionId: string) => void;
}) {
  const { map, ready } = useMap();
  const [, force] = useState(0);

  useEffect(() => {
    if (!map || !ready) return;
    const rerender = () => force((n) => n + 1);
    map.on("move", rerender);
    map.on("zoom", rerender);
    return () => {
      map.off("move", rerender);
      map.off("zoom", rerender);
    };
  }, [map, ready]);

  if (!map || !ready) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {collections.map((c) => {
        const p = map.project(c.pin);
        const locked = c.comingSoon;
        return (
          <button
            key={c.id}
            disabled={locked}
            onClick={() => onOpen(c.id)}
            style={{ left: p.x, top: p.y }}
            className="pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 shadow-lg backdrop-blur transition-colors hover:border-primary disabled:opacity-60"
          >
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_10px_rgba(232,192,116,0.6)]" />
            <span className="font-display text-sm text-foreground">{c.title}</span>
            {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
          </button>
        );
      })}
    </div>
  );
}
