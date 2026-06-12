import { describe, it, expect } from "vitest";
import { buildPathFeatures } from "@/lib/map/paths";
import type { Story } from "@/lib/content/schema";

const story = {
  events: [
    { id: "a", order: 1, path: [[0, 0], [1, 1]] },
    { id: "b", order: 2 }, // no path -> skipped
    { id: "c", order: 3, path: [[2, 2], [3, 3]] },
  ],
} as unknown as Story;

describe("buildPathFeatures", () => {
  it("creates one LineString per event that has a path", () => {
    const fc = buildPathFeatures(story, "c");
    expect(fc.features).toHaveLength(2);
    expect(fc.features.every((f) => f.geometry.type === "LineString")).toBe(true);
  });

  it("marks the active event's feature", () => {
    const fc = buildPathFeatures(story, "c");
    const active = fc.features.find((f) => f.properties?.eventId === "c");
    const inactive = fc.features.find((f) => f.properties?.eventId === "a");
    expect(active?.properties?.active).toBe(true);
    expect(inactive?.properties?.active).toBe(false);
  });
});
