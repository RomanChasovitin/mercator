"use client";

import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import { useMap } from "@/components/atlas/MapProvider";
import type { Story } from "@/lib/content/schema";

export function EventMarkers({
  story,
  activeEventId,
  onSelect,
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
        "flex h-7 w-7 items-center justify-center rounded-full border-2 border-accent bg-background text-sm font-bold text-primary shadow-none";
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelect(event.id);
      });
      return new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat(event.coords).addTo(map);
    });
    markersRef.current = markers;
    return () => markers.forEach((m) => m.remove());
  }, [map, ready, story, onSelect]);

  // Reflect the active marker visually (fixed size — no scale, avoids anchor jump).
  useEffect(() => {
    markersRef.current.forEach((m) => {
      const el = m.getElement();
      const isActive = el.dataset.eventId === activeEventId;
      el.classList.toggle("bg-primary", isActive);
      el.classList.toggle("text-primary-foreground", isActive);
      el.classList.toggle("border-primary", isActive);
      el.classList.toggle("shadow-[0_0_0_4px_rgba(232,192,116,0.35),0_0_16px_rgba(232,192,116,0.55)]", isActive);
      el.classList.toggle("bg-background", !isActive);
      el.classList.toggle("text-primary", !isActive);
      el.classList.toggle("border-accent", !isActive);
      el.classList.toggle("shadow-none", !isActive);
    });
  }, [activeEventId]);

  return null;
}
