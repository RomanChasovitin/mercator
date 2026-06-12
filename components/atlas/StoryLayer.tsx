"use client";

import { useEffect } from "react";
import { useMap } from "@/components/atlas/MapProvider";
import { EventMarkers } from "@/components/atlas/EventMarkers";
import { ActiveEventLabel } from "@/components/atlas/ActiveEventLabel";
import { EventDrawer } from "@/components/atlas/EventDrawer";
import { StoryHeader } from "@/components/atlas/StoryHeader";
import type { Story } from "@/lib/content/schema";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function fitView(story: Story) {
  if (story.map) return story.map;
  const lngs = story.events.map((e) => e.coords[0]);
  const lats = story.events.map((e) => e.coords[1]);
  const center: [number, number] = [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2];
  return { center, zoom: 4 };
}

export function StoryLayer({
  collectionTitle, story, activeEventId, onSelectEvent, onBack, onExit,
}: {
  collectionTitle: string;
  story: Story;
  activeEventId: string;
  onSelectEvent: (eventId: string) => void;
  onBack: () => void;
  onExit: () => void;
}) {
  const { map, ready } = useMap();
  const activeEvent = story.events.find((e) => e.id === activeEventId) ?? null;

  useEffect(() => {
    if (!map || !ready) return;
    const opts = fitView(story);
    if (prefersReducedMotion()) map.jumpTo(opts);
    else map.flyTo({ ...opts, duration: 1400, essential: true });
  }, [map, ready, story]);

  useEffect(() => {
    if (!map || !ready || !activeEvent) return;
    if (prefersReducedMotion()) map.jumpTo({ center: activeEvent.coords });
    else map.flyTo({ center: activeEvent.coords, zoom: Math.max(map.getZoom(), 4), duration: 1000 });
  }, [map, ready, activeEvent]);

  return (
    <>
      <StoryHeader collectionTitle={collectionTitle} storyTitle={story.title} onBack={onBack} onExit={onExit} />
      <EventMarkers story={story} activeEventId={activeEventId} onSelect={onSelectEvent} />
      {activeEvent && <ActiveEventLabel event={activeEvent} />}
      {activeEvent && <EventDrawer story={story} event={activeEvent} onSelect={onSelectEvent} />}
    </>
  );
}
