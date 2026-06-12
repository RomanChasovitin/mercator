import type { StyleSpecification } from "maplibre-gl";
import type maplibregl from "maplibre-gl";
import type { EpochTint } from "@/lib/content/schema";

export const codexStyle: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [{ id: "background", type: "background", paint: { "background-color": "#0c1520" } }],
};

export const LAND_LAYER = {
  id: "land", type: "fill" as const, source: "world",
  paint: { "fill-color": "#234a3a", "fill-opacity": 1 },
};
export const LAND_OUTLINE_LAYER = {
  id: "land-outline", type: "line" as const, source: "world",
  paint: { "line-color": "#5a9a72", "line-width": 1 },
};

/** Recolor background/land/outline to the selected epoch (no style reload). */
export function applyEpochTint(map: maplibregl.Map, tint: EpochTint) {
  map.setPaintProperty("background", "background-color", tint.background);
  if (map.getLayer("land")) map.setPaintProperty("land", "fill-color", tint.land);
  if (map.getLayer("land-outline")) map.setPaintProperty("land-outline", "line-color", tint.landOutline);
}
