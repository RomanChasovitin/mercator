"use client";

import { MapCanvas } from "@/components/atlas/MapCanvas";
import { MapMenuAndStory } from "@/components/atlas/MapMenuAndStory";
import { useAtlas } from "@/lib/state/useAtlas";
import type { Story } from "@/lib/content/schema";

export function AtlasApp({ stories }: { stories: Story[] }) {
  const ids = stories.map((s) => s.id);
  const atlas = useAtlas(ids);

  return (
    <main className="relative h-dvh w-dvw">
      <MapCanvas>
        <MapMenuAndStory stories={stories} atlas={atlas} />
      </MapCanvas>
      <div className="pointer-events-none absolute left-6 top-5 z-10">
        <div className="font-display text-3xl">Mercator</div>
        <div className="text-sm text-muted-foreground">An interactive atlas of epochs</div>
      </div>
    </main>
  );
}

export type { Story };
