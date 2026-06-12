"use client";

import { useEffect, useState } from "react";
import { useMap } from "@/components/atlas/MapProvider";
import { EVENT_TYPE_META } from "@/lib/map/eventTypes";
import type { Event } from "@/lib/content/schema";

export function ActiveEventLabel({ event }: { event: Event }) {
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
  const { Icon, label } = EVENT_TYPE_META[event.type];
  const p = map.project(event.coords);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1" style={{ left: p.x, top: p.y }}>
        <div
          aria-label={label}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_0_4px_rgba(232,192,116,0.3),0_0_18px_rgba(232,192,116,0.6)]"
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="whitespace-nowrap rounded-md border border-primary/50 bg-card/90 px-2 py-1 text-center backdrop-blur">
          <div className="font-display text-sm text-foreground">{event.title}</div>
          <div className="text-[10px] text-muted-foreground">{event.dateLabel}</div>
        </div>
      </div>
    </div>
  );
}
