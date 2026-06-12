import { describe, it, expect } from "vitest";
import { loadStories } from "@/lib/content/load";

describe("content datasets", () => {
  const stories = loadStories();

  it("loads exactly the two MVP stories", () => {
    const ids = stories.map((s) => s.id).sort();
    expect(ids).toEqual(["age-of-discovery", "world-war-ii-europe"]);
  });

  it("each story has exactly 5 events", () => {
    for (const s of stories) expect(s.events).toHaveLength(5);
  });

  it("events are uniquely ordered 1..5", () => {
    for (const s of stories) {
      const orders = s.events.map((e) => e.order).sort((a, b) => a - b);
      expect(orders).toEqual([1, 2, 3, 4, 5]);
    }
  });
});
