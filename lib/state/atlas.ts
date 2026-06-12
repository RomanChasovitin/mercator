export type AtlasState =
  | { mode: "menu"; storyId: null; eventId: null }
  | { mode: "story"; storyId: string; eventId: string | null };

export type AtlasAction =
  | { type: "openStory"; storyId: string }
  | { type: "selectEvent"; eventId: string }
  | { type: "clearEvent" }
  | { type: "closeStory" }
  | { type: "setState"; state: AtlasState };

export const initialState: AtlasState = { mode: "menu", storyId: null, eventId: null };

export function atlasReducer(state: AtlasState, action: AtlasAction): AtlasState {
  switch (action.type) {
    case "openStory":
      return { mode: "story", storyId: action.storyId, eventId: null };
    case "selectEvent":
      return state.mode === "story" ? { ...state, eventId: action.eventId } : state;
    case "clearEvent":
      return state.mode === "story" ? { ...state, eventId: null } : state;
    case "closeStory":
      return initialState;
    case "setState":
      return action.state;
  }
}

export function stateToSearch(state: AtlasState): string {
  if (state.mode === "menu") return "";
  const params = new URLSearchParams({ story: state.storyId });
  if (state.eventId) params.set("event", state.eventId);
  return `?${params.toString()}`;
}

export function searchToState(search: string, knownStoryIds: string[]): AtlasState {
  const params = new URLSearchParams(search);
  const storyId = params.get("story");
  if (!storyId || !knownStoryIds.includes(storyId)) return initialState;
  return { mode: "story", storyId, eventId: params.get("event") || null };
}
