"use client";

import type { Story } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

export function SequenceStrip({
  story,
  activeEventId,
  onSelect,
}: {
  story: Story;
  activeEventId: string | null;
  onSelect: (eventId: string) => void;
}) {
  const ordered = [...story.events].sort((a, b) => a.order - b.order);
  return (
    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-lg border border-border bg-background/75 px-2.5 py-2 backdrop-blur">
      <span className="mr-1 text-xs text-muted-foreground">Sequence:</span>
      {ordered.map((e) => (
        <button
          key={e.id}
          onClick={() => onSelect(e.id)}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md border text-xs",
            e.id === activeEventId
              ? "border-transparent bg-primary font-bold text-primary-foreground"
              : "border-border text-foreground/80",
          )}
        >
          {e.order}
        </button>
      ))}
    </div>
  );
}
