"use client";

import { useEffect } from "react";
import { useMap, WORLD_VIEW } from "@/components/atlas/MapProvider";
import { CollectionCards } from "@/components/atlas/CollectionCards";
import { CollectionDrawer } from "@/components/atlas/CollectionDrawer";
import { StoryLayer } from "@/components/atlas/StoryLayer";
import { EpochSelector } from "@/components/atlas/EpochSelector";
import { applyEpochTint } from "@/lib/map/style";
import { getEpoch } from "@/content/epochs";
import type { Collection, Epoch } from "@/lib/content/schema";
import type { useAtlas } from "@/lib/state/useAtlas";

export function MapMenuAndStory({
  epochs, collections, atlas,
}: {
  epochs: Epoch[];
  collections: Collection[];
  atlas: ReturnType<typeof useAtlas>;
}) {
  const { map, ready } = useMap();
  const { state, selectEpoch, openCollection, closeCollection, openStory, selectEvent, backToCollection, exitToMenu } = atlas;

  const epochCollections = collections.filter((c) => c.epochId === state.epochId);
  const openCol = state.collectionId ? collections.find((c) => c.id === state.collectionId) ?? null : null;
  const story =
    state.mode === "story"
      ? collections.find((c) => c.id === state.collectionId)?.stories.find((s) => s.id === state.storyId)
      : undefined;

  // Apply epoch tint whenever the epoch changes.
  useEffect(() => {
    if (!map || !ready) return;
    const epoch = getEpoch(state.epochId);
    if (epoch) applyEpochTint(map, epoch.tint);
  }, [map, ready, state.epochId]);

  // Return to world view when entering menu mode.
  useEffect(() => {
    if (!map || !ready || state.mode !== "menu") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const opts = { center: WORLD_VIEW.center, zoom: WORLD_VIEW.zoom };
    if (reduced) map.jumpTo(opts);
    else map.flyTo({ ...opts, duration: 1200 });
  }, [map, ready, state.mode]);

  if (story && state.mode === "story") {
    return (
      <StoryLayer
        collectionTitle={openCol?.title ?? collections.find((c) => c.id === state.collectionId)?.title ?? ""}
        story={story}
        activeEventId={state.eventId}
        onSelectEvent={selectEvent}
        onBack={backToCollection}
        onExit={exitToMenu}
      />
    );
  }

  return (
    <>
      <EpochSelector epochs={epochs} activeId={state.epochId} onSelect={selectEpoch} />
      <CollectionCards collections={epochCollections} onOpen={openCollection} />
      <CollectionDrawer
        collection={openCol}
        onClose={closeCollection}
        onOpenStory={(storyId) => openCol && openStory(openCol.id, storyId)}
      />
    </>
  );
}
