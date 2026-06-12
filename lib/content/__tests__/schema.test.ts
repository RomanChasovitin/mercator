import { describe, it, expect } from "vitest";
import { StorySchema } from "@/lib/content/schema";

const validEvent = {
  id: "columbus",
  order: 1,
  year: 1492,
  dateLabel: "1492",
  title: "Columbus reaches the Americas",
  coords: [-74.5, 24.0],
  path: [[-6.9, 37.2], [-15.6, 28.1], [-74.5, 24.0]],
  summary: "First crossing.",
  body: "Long body text.",
};

const validStory = {
  id: "age-of-discovery",
  epoch: "15-16th c.",
  title: "Age of Discovery",
  summary: "Five voyages.",
  cover: "/stories/age-of-discovery/cover.jpg",
  pin: [-9, 38],
  yearStart: 1492,
  yearEnd: 1532,
  map: { center: [-30, 15], zoom: 1.6 },
  events: [validEvent],
};

describe("StorySchema", () => {
  it("accepts a valid story", () => {
    expect(() => StorySchema.parse(validStory)).not.toThrow();
  });

  it("rejects coords outside lng/lat bounds", () => {
    const bad = { ...validStory, events: [{ ...validEvent, coords: [200, 0] }] };
    expect(() => StorySchema.parse(bad)).toThrow();
  });

  it("rejects a story with no events", () => {
    const bad = { ...validStory, events: [] };
    expect(() => StorySchema.parse(bad)).toThrow();
  });

  it("rejects duplicate event order values", () => {
    const bad = {
      ...validStory,
      events: [validEvent, { ...validEvent, id: "dup", order: 1 }],
    };
    expect(() => StorySchema.parse(bad)).toThrow();
  });
});
