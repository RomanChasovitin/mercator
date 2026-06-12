"use client";

import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import { useMap } from "@/components/atlas/MapProvider";
import type { Story } from "@/lib/content/schema";

export function EventMarkers({
  story, activeEventId, onSelect,
}: {
  story: Story;
  activeEventId: string | null;
  onSelect: (eventId: string) => void;
}) {
  const { map, ready } = useMap();
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!map || !ready) return;
    const ordered = [...story.events].sort((a, b) => a.order - b.order);
    const markers = ordered.map((event) => {
      const el = document.createElement("button");
      el.dataset.eventId = event.id;
      el.textContent = String(event.order);
      el.className =
        "flex h-6 w-6 items-center justify-center rounded-full border border-primary/70 bg-background text-xs font-bold text-primary shadow-[0_0_8px_rgba(232,192,116,0.4)]";
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelect(event.id);
      });
      return new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat(event.coords).addTo(map);
    });
    markersRef.current = markers;
    return () => markers.forEach((m) => m.remove());
  }, [map, ready, story, onSelect]);

  // Hide the active event's dot (it is drawn by ActiveEventLabel).
  useEffect(() => {
    markersRef.current.forEach((m) => {
      const el = m.getElement();
      el.style.visibility = el.dataset.eventId === activeEventId ? "hidden" : "visible";
    });
  }, [activeEventId]);

  return null;
}
