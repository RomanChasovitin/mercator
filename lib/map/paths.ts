import type { Feature, FeatureCollection, LineString } from "geojson";
import type { Story } from "@/lib/content/schema";

export type PathProps = { eventId: string; order: number; active: boolean };

export function buildPathFeatures(
  story: Story,
  activeEventId: string | null,
): FeatureCollection<LineString, PathProps> {
  const features: Feature<LineString, PathProps>[] = story.events
    .filter((e) => e.path && e.path.length >= 2)
    .map((e) => ({
      type: "Feature",
      properties: { eventId: e.id, order: e.order, active: e.id === activeEventId },
      geometry: { type: "LineString", coordinates: e.path as number[][] },
    }));
  return { type: "FeatureCollection", features };
}
