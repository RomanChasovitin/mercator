import { DEFAULT_EPOCH_ID } from "@/content/epochs";

export type AtlasState =
  | { mode: "menu"; epochId: string; collectionId: string | null }
  | { mode: "story"; epochId: string; collectionId: string; storyId: string; eventId: string };

export type AtlasAction =
  | { type: "selectEpoch"; epochId: string }
  | { type: "openCollection"; collectionId: string }
  | { type: "closeCollection" }
  | { type: "openStory"; collectionId: string; storyId: string; eventId: string }
  | { type: "selectEvent"; eventId: string }
  | { type: "backToCollection" }
  | { type: "exitToMenu" }
  | { type: "setState"; state: AtlasState };

export const initialState: AtlasState = {
  mode: "menu", epochId: DEFAULT_EPOCH_ID, collectionId: null,
};

export function atlasReducer(state: AtlasState, action: AtlasAction): AtlasState {
  switch (action.type) {
    case "selectEpoch":
      return { mode: "menu", epochId: action.epochId, collectionId: null };
    case "openCollection":
      return { mode: "menu", epochId: state.epochId, collectionId: action.collectionId };
    case "closeCollection":
      return { mode: "menu", epochId: state.epochId, collectionId: null };
    case "openStory":
      return {
        mode: "story", epochId: state.epochId,
        collectionId: action.collectionId, storyId: action.storyId, eventId: action.eventId,
      };
    case "selectEvent":
      return state.mode === "story" ? { ...state, eventId: action.eventId } : state;
    case "backToCollection":
      return state.mode === "story"
        ? { mode: "menu", epochId: state.epochId, collectionId: state.collectionId }
        : state;
    case "exitToMenu":
      return { mode: "menu", epochId: state.epochId, collectionId: null };
    case "setState":
      return action.state;
  }
}

export function stateToSearch(state: AtlasState): string {
  const p = new URLSearchParams();
  p.set("epoch", state.epochId);
  if (state.mode === "menu") {
    if (state.collectionId) p.set("collection", state.collectionId);
  } else {
    p.set("collection", state.collectionId);
    p.set("story", state.storyId);
    p.set("event", state.eventId);
  }
  return `?${p.toString()}`;
}

export type AtlasIndex = {
  epochIds: string[];
  collectionEpoch: Record<string, string>;     // collectionId -> epochId
  storyFirstEvent: Record<string, string>;      // `${collectionId}:${storyId}` -> first eventId
  eventExists: Record<string, boolean>;         // `${collectionId}:${storyId}:${eventId}` -> true
};

export function searchToState(search: string, index: AtlasIndex): AtlasState {
  const p = new URLSearchParams(search);
  const epochId = index.epochIds.includes(p.get("epoch") ?? "") ? (p.get("epoch") as string) : initialState.epochId;
  const collectionId = p.get("collection");
  const storyId = p.get("story");
  const eventId = p.get("event");

  if (collectionId && storyId && index.collectionEpoch[collectionId]) {
    const firstEvent = index.storyFirstEvent[`${collectionId}:${storyId}`];
    if (firstEvent) {
      const resolvedEvent =
        eventId && index.eventExists[`${collectionId}:${storyId}:${eventId}`] ? eventId : firstEvent;
      return { mode: "story", epochId: index.collectionEpoch[collectionId], collectionId, storyId, eventId: resolvedEvent };
    }
  }
  if (collectionId && index.collectionEpoch[collectionId]) {
    return { mode: "menu", epochId: index.collectionEpoch[collectionId], collectionId };
  }
  return { mode: "menu", epochId, collectionId: null };
}
