"use client";

import { useCallback, useEffect, useMemo, useReducer } from "react";
import {
  atlasReducer, initialState, searchToState, stateToSearch,
  type AtlasIndex, type AtlasState,
} from "@/lib/state/atlas";
import type { Collection } from "@/lib/content/schema";

function buildIndex(collections: Collection[]): AtlasIndex {
  const collectionEpoch: Record<string, string> = {};
  const storyFirstEvent: Record<string, string> = {};
  const eventExists: Record<string, boolean> = {};
  for (const c of collections) {
    collectionEpoch[c.id] = c.epochId;
    for (const s of c.stories) {
      const ordered = [...s.events].sort((a, b) => a.order - b.order);
      if (ordered[0]) storyFirstEvent[`${c.id}:${s.id}`] = ordered[0].id;
      for (const e of s.events) eventExists[`${c.id}:${s.id}:${e.id}`] = true;
    }
  }
  return { epochIds: [], collectionEpoch, storyFirstEvent, eventExists };
}

export function useAtlas(collections: Collection[], epochIds: string[]) {
  const index = useMemo<AtlasIndex>(
    () => ({ ...buildIndex(collections), epochIds }),
    [collections, epochIds],
  );

  const [state, dispatch] = useReducer(
    atlasReducer, initialState,
    (init): AtlasState =>
      typeof window === "undefined" ? init : searchToState(window.location.search, index),
  );

  useEffect(() => {
    const next = `${window.location.pathname}${stateToSearch(state)}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.pushState(null, "", next);
    }
  }, [state]);

  useEffect(() => {
    const onPop = () => dispatch({ type: "setState", state: searchToState(window.location.search, index) });
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [index]);

  const firstEventOf = useCallback(
    (collectionId: string, storyId: string) => index.storyFirstEvent[`${collectionId}:${storyId}`],
    [index],
  );

  const actions = {
    selectEpoch: useCallback((epochId: string) => dispatch({ type: "selectEpoch", epochId }), []),
    openCollection: useCallback((collectionId: string) => dispatch({ type: "openCollection", collectionId }), []),
    closeCollection: useCallback(() => dispatch({ type: "closeCollection" }), []),
    openStory: useCallback(
      (collectionId: string, storyId: string) => {
        const eventId = firstEventOf(collectionId, storyId);
        if (eventId) dispatch({ type: "openStory", collectionId, storyId, eventId });
      },
      [firstEventOf],
    ),
    selectEvent: useCallback((eventId: string) => dispatch({ type: "selectEvent", eventId }), []),
    backToCollection: useCallback(() => dispatch({ type: "backToCollection" }), []),
    exitToMenu: useCallback(() => dispatch({ type: "exitToMenu" }), []),
  };

  return { state, ...actions };
}
