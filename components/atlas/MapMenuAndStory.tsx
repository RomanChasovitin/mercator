"use client";

import { useEffect } from "react";
import { useMap, WORLD_VIEW } from "@/components/atlas/MapProvider";
import { StoryPins } from "@/components/atlas/StoryPins";
import { StoryLayer } from "@/components/atlas/StoryLayer";
import type { Story } from "@/lib/content/schema";
import type { useAtlas } from "@/lib/state/useAtlas";

export function MapMenuAndStory({
  stories,
  atlas,
}: {
  stories: Story[];
  atlas: ReturnType<typeof useAtlas>;
}) {
  const { map } = useMap();
  const { state, openStory, selectEvent, clearEvent, closeStory } = atlas;
  const story = state.mode === "story" ? stories.find((s) => s.id === state.storyId) : undefined;

  useEffect(() => {
    if (!map || state.mode !== "menu") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const opts = { center: WORLD_VIEW.center, zoom: WORLD_VIEW.zoom };
    if (reduced) map.jumpTo(opts);
    else map.flyTo({ ...opts, duration: 1200 });
  }, [map, state.mode]);

  if (story) {
    return (
      <StoryLayer
        story={story}
        activeEventId={state.eventId}
        onSelect={selectEvent}
        onClearEvent={clearEvent}
        onClose={closeStory}
      />
    );
  }

  return <StoryPins stories={stories} onEnter={openStory} />;
}
