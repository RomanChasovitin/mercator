"use client";

import { MapCanvas } from "@/components/atlas/MapCanvas";
import { MapMenuAndStory } from "@/components/atlas/MapMenuAndStory";
import { useAtlas } from "@/lib/state/useAtlas";
import type { Collection, Epoch } from "@/lib/content/schema";

export function AtlasApp({ epochs, collections }: { epochs: Epoch[]; collections: Collection[] }) {
  const epochIds = epochs.map((e) => e.id);
  const atlas = useAtlas(collections, epochIds);

  return (
    <main className="relative h-dvh w-dvw">
      <MapCanvas>
        <MapMenuAndStory epochs={epochs} collections={collections} atlas={atlas} />
      </MapCanvas>
      {atlas.state.mode === "menu" && !atlas.state.collectionId && (
        <div className="pointer-events-none absolute left-6 top-5 z-10">
          <div className="font-display text-3xl">Mercator</div>
          <div className="text-sm text-muted-foreground">An interactive atlas of epochs</div>
        </div>
      )}
    </main>
  );
}
