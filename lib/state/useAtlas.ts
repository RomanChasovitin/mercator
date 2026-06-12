"use client";

import { useCallback, useEffect, useReducer } from "react";
import {
  atlasReducer,
  initialState,
  searchToState,
  stateToSearch,
  type AtlasAction,
  type AtlasState,
} from "@/lib/state/atlas";

export function useAtlas(knownStoryIds: string[]) {
  const [state, dispatch] = useReducer(
    atlasReducer,
    initialState,
    (init): AtlasState =>
      typeof window === "undefined"
        ? init
        : searchToState(window.location.search, knownStoryIds),
  );

  // Push state changes to the URL (so Back/refresh/share work).
  useEffect(() => {
    const search = stateToSearch(state);
    const next = `${window.location.pathname}${search}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.pushState(null, "", next);
    }
  }, [state]);

  // React to Back/Forward.
  useEffect(() => {
    const onPop = () =>
      dispatch({ type: "setState", state: searchToState(window.location.search, knownStoryIds) });
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [knownStoryIds]);

  const actions = {
    openStory: useCallback((storyId: string) => dispatch({ type: "openStory", storyId }), []),
    selectEvent: useCallback((eventId: string) => dispatch({ type: "selectEvent", eventId }), []),
    clearEvent: useCallback(() => dispatch({ type: "clearEvent" }), []),
    closeStory: useCallback(() => dispatch({ type: "closeStory" }), []),
  };

  return { state, ...actions };
}
