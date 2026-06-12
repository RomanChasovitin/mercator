import type { StyleSpecification } from "maplibre-gl";

/** Self-contained "Codex" style: no external tiles, just our world GeoJSON. */
export const codexStyle: StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    world: { type: "geojson", data: "/geo/world.geojson" },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#0a0f13" },
    },
    {
      id: "land",
      type: "fill",
      source: "world",
      paint: { "fill-color": "#16241d", "fill-opacity": 0.9 },
    },
    {
      id: "land-outline",
      type: "line",
      source: "world",
      paint: { "line-color": "#26392f", "line-width": 0.6 },
    },
  ],
};
