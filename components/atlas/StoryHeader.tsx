"use client";

import { ArrowLeft, X } from "lucide-react";

export function StoryHeader({
  collectionTitle, storyTitle, onBack, onExit,
}: {
  collectionTitle: string;
  storyTitle: string;
  onBack: () => void;
  onExit: () => void;
}) {
  return (
    <>
      <div className="absolute left-5 top-4 z-20">
        <button onClick={onBack} className="flex items-center gap-2 text-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          <span className="font-display text-xl">{storyTitle}</span>
        </button>
        <div className="pl-6 text-xs text-muted-foreground">{collectionTitle}</div>
      </div>
      <button onClick={onExit} aria-label="Exit to menu"
        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/85 text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </>
  );
}
