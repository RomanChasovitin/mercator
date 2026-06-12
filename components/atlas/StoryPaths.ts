import type maplibregl from "maplibre-gl";
import { buildPathFeatures } from "@/lib/map/paths";
import type { Story } from "@/lib/content/schema";

const SOURCE_ID = "story-paths";

export function setStoryPaths(map: maplibregl.Map, story: Story, activeEventId: string | null) {
  if (!map.isStyleLoaded()) return;
  const data = buildPathFeatures(story, activeEventId);
  const existing = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  if (existing) {
    existing.setData(data);
    return;
  }
  map.addSource(SOURCE_ID, { type: "geojson", data });
  map.addLayer({
    id: "story-paths-line",
    type: "line",
    source: SOURCE_ID,
    layout: { "line-cap": "round" },
    paint: {
      "line-color": "#e8c074",
      "line-dasharray": [1, 2.5],
      "line-width": ["case", ["get", "active"], 3, 1.8],
      "line-opacity": ["case", ["get", "active"], 0.95, 0.45],
    },
  });
}

export function clearStoryPaths(map: maplibregl.Map) {
  if (map.getLayer("story-paths-line")) map.removeLayer("story-paths-line");
  if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
}
