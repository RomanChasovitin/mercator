"use client";

import { useEffect } from "react";
import { useMap } from "@/components/atlas/MapProvider";
import { EventMarkers } from "@/components/atlas/EventMarkers";
import { EventPanel } from "@/components/atlas/EventPanel";
import { SequenceStrip } from "@/components/atlas/SequenceStrip";
import { StoryHeader } from "@/components/atlas/StoryHeader";
import { setStoryPaths, clearStoryPaths } from "@/components/atlas/StoryPaths";
import type { Story } from "@/lib/content/schema";

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function StoryLayer({
  story,
  activeEventId,
  onSelect,
  onClearEvent,
  onClose,
}: {
  story: Story;
  activeEventId: string | null;
  onSelect: (eventId: string) => void;
  onClearEvent: () => void;
  onClose: () => void;
}) {
  const { map } = useMap();

  // Fly to the story's view on open.
  useEffect(() => {
    if (!map) return;
    const opts = { center: story.map.center, zoom: story.map.zoom };
    if (prefersReducedMotion()) map.jumpTo(opts);
    else map.flyTo({ ...opts, duration: 1400, essential: true });
  }, [map, story]);

  // Draw / update paths; clear on unmount.
  useEffect(() => {
    if (!map) return;
    setStoryPaths(map, story, activeEventId);
    return () => clearStoryPaths(map);
  }, [map, story, activeEventId]);

  // Fly to the selected event.
  useEffect(() => {
    if (!map || !activeEventId) return;
    const event = story.events.find((e) => e.id === activeEventId);
    if (!event) return;
    if (prefersReducedMotion()) map.jumpTo({ center: event.coords });
    else map.flyTo({ center: event.coords, zoom: Math.max(map.getZoom(), 3), duration: 1000 });
  }, [map, story, activeEventId]);

  const activeEvent = story.events.find((e) => e.id === activeEventId) ?? null;

  return (
    <>
      <StoryHeader story={story} onClose={onClose} />
      <EventMarkers story={story} activeEventId={activeEventId} onSelect={onSelect} />
      <SequenceStrip story={story} activeEventId={activeEventId} onSelect={onSelect} />
      <EventPanel story={story} event={activeEvent} onClose={onClearEvent} />
    </>
  );
}
