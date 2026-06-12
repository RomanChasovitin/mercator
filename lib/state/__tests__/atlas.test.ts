import { describe, it, expect } from "vitest";
import {
  atlasReducer,
  initialState,
  stateToSearch,
  searchToState,
  type AtlasState,
} from "@/lib/state/atlas";

const ids = ["age-of-discovery", "world-war-ii-europe"];

describe("atlasReducer", () => {
  it("starts in menu mode", () => {
    expect(initialState.mode).toBe("menu");
  });

  it("opens a story", () => {
    const s = atlasReducer(initialState, { type: "openStory", storyId: "x" });
    expect(s).toEqual({ mode: "story", storyId: "x", eventId: null });
  });

  it("selects an event only in story mode", () => {
    const open: AtlasState = { mode: "story", storyId: "x", eventId: null };
    expect(atlasReducer(open, { type: "selectEvent", eventId: "e1" }).eventId).toBe("e1");
  });

  it("closes back to menu", () => {
    const open: AtlasState = { mode: "story", storyId: "x", eventId: "e1" };
    expect(atlasReducer(open, { type: "closeStory" })).toEqual(initialState);
  });
});

describe("URL serialization", () => {
  it("serializes menu as empty search", () => {
    expect(stateToSearch(initialState)).toBe("");
  });

  it("round-trips a story+event", () => {
    const s: AtlasState = { mode: "story", storyId: "age-of-discovery", eventId: "columbus" };
    const parsed = searchToState(stateToSearch(s), ids);
    expect(parsed).toEqual(s);
  });

  it("ignores an unknown story id", () => {
    expect(searchToState("?story=nope", ids)).toEqual(initialState);
  });
});
