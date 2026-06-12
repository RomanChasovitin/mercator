"use client";

import maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { useMap } from "@/components/atlas/MapProvider";
import type { Story } from "@/lib/content/schema";
import { Button } from "@/components/ui/button";

export function StoryPins({
  stories,
  onEnter,
}: {
  stories: Story[];
  onEnter: (storyId: string) => void;
}) {
  const { map } = useMap();
  const [expanded, setExpanded] = useState<string | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!map) return;
    const markers = stories.map((story) => {
      const el = document.createElement("button");
      el.className =
        "h-4 w-4 rounded-full bg-primary shadow-[0_0_0_4px_rgba(232,192,116,0.18),0_0_16px_rgba(232,192,116,0.5)]";
      el.setAttribute("aria-label", story.title);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setExpanded((cur) => (cur === story.id ? null : story.id));
      });
      return new maplibregl.Marker({ element: el }).setLngLat(story.pin).addTo(map);
    });
    markersRef.current = markers;
    const collapse = () => setExpanded(null);
    map.on("click", collapse);
    return () => {
      markers.forEach((m) => m.remove());
      map.off("click", collapse);
    };
  }, [map, stories]);

  const active = stories.find((s) => s.id === expanded);
  if (!map || !active) return null;

  const point = map.project(active.pin);

  return (
    <div className="pointer-events-none absolute inset-0 z-10" aria-live="polite">
      <div
        className="pointer-events-auto absolute w-[300px] overflow-hidden rounded-xl border border-[#3a2e18] bg-card shadow-2xl"
        style={{ left: point.x + 18, top: point.y - 90 }}
      >
        <div
          className="h-28 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(180deg,transparent,rgba(20,17,11,.9)), url(${active.cover})`,
          }}
        >
          <span className="m-3 inline-block rounded-full bg-primary px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
            {active.epoch}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-display text-xl">{active.title}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{active.summary}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {active.events.length} events · {active.yearStart}-{active.yearEnd}
            </span>
            <Button size="sm" onClick={() => onEnter(active.id)}>
              Enter →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
