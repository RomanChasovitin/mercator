"use client";

import { Badge } from "@/components/ui/badge";
import type { Story } from "@/lib/content/schema";

export function StoryHeader({ story, onClose }: { story: Story; onClose: () => void }) {
  return (
    <>
      <div className="absolute left-5 top-4 z-10 flex items-center gap-3">
        <h2 className="font-display text-2xl">{story.title}</h2>
        <Badge className="bg-primary text-primary-foreground">{story.epoch}</Badge>
      </div>
      <button
        onClick={onClose}
        aria-label="Close story"
        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/85 text-muted-foreground hover:text-foreground"
      >
        ✕
      </button>
    </>
  );
}
