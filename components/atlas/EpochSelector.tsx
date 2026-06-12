"use client";

import type { Epoch } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

export function EpochSelector({
  epochs, activeId, onSelect,
}: {
  epochs: Epoch[];
  activeId: string;
  onSelect: (epochId: string) => void;
}) {
  return (
    <div className="pointer-events-auto absolute left-1/2 top-4 z-20 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-full border border-border bg-card/85 px-1.5 py-1 backdrop-blur">
        {epochs.map((e) => (
          <button
            key={e.id}
            onClick={() => onSelect(e.id)}
            title={e.yearRange}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              e.id === activeId
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {e.title}
          </button>
        ))}
      </div>
    </div>
  );
}
