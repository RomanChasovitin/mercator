import type { StyleSpecification } from "maplibre-gl";

/** Minimal base style; land layers are added after GeoJSON fetch in MapProvider. */
export const codexStyle: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#0c1520" },
    },
  ],
};

export const LAND_LAYER = {
  id: "land",
  type: "fill" as const,
  source: "world",
  paint: { "fill-color": "#234a3a", "fill-opacity": 1 },
};

export const LAND_OUTLINE_LAYER = {
  id: "land-outline",
  type: "line" as const,
  source: "world",
  paint: { "line-color": "#5a9a72", "line-width": 1 },
};
