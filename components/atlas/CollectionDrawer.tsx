"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/lib/use-media-query";
import type { Collection, Story } from "@/lib/content/schema";
import { Lock, Play } from "lucide-react";

function StoryRow({ story, index, onOpen }: { story: Story; index: number; onOpen: (id: string) => void }) {
  const locked = story.comingSoon;
  const meta = locked ? "Coming soon" : `${story.events.length} events · ${story.yearStart}–${story.yearEnd}`;
  return (
    <button
      disabled={locked}
      onClick={() => onOpen(story.id)}
      className="flex w-full items-start gap-3 rounded-lg border border-border bg-background/40 p-3 text-left transition-colors enabled:hover:border-primary disabled:opacity-55"
    >
      <span className="font-display text-lg text-primary">{String(index + 1).padStart(2, "0")}</span>
      <span className="flex-1">
        <span className="flex items-center gap-2">
          <span className="font-display text-base text-foreground">{story.title}</span>
          {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
        </span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{meta}</span>
        {story.tags.length > 0 && (
          <span className="mt-1.5 flex flex-wrap gap-1">
            {story.tags.map((t) => (
              <Badge key={t} variant="outline" className="text-[10px] text-muted-foreground">{t}</Badge>
            ))}
          </span>
        )}
      </span>
    </button>
  );
}

function Body({ collection, onOpenStory }: { collection: Collection; onOpenStory: (id: string) => void }) {
  const totalEvents = collection.stories.reduce((n, s) => n + s.events.length, 0);
  return (
    <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-6">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge className="bg-primary text-primary-foreground">{collection.kind}</Badge>
        {collection.tags.map((t) => (
          <Badge key={t} variant="outline" className="text-muted-foreground">{t}</Badge>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {collection.yearStart}–{collection.yearEnd} · {collection.stories.length} stories · {totalEvents}+ events
      </p>
      <p className="text-sm leading-relaxed text-[#b7a884]">{collection.summary}</p>
      <Button disabled className="w-full justify-center gap-2">
        <Play className="h-4 w-4" /> Play whole collection
        <span className="ml-1 rounded bg-background/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide">Soon</span>
      </Button>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Stories</p>
      <div className="flex flex-col gap-2">
        {collection.stories.map((s, i) => (
          <StoryRow key={s.id} story={s} index={i} onOpen={onOpenStory} />
        ))}
      </div>
    </div>
  );
}

export function CollectionDrawer({
  collection, onClose, onOpenStory,
}: {
  collection: Collection | null;
  onClose: () => void;
  onOpenStory: (storyId: string) => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const open = collection !== null;

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
        <SheetContent side="right" showOverlay={false} showCloseButton={false} className="flex w-[420px] flex-col border-border bg-card p-0 sm:max-w-none">
          {collection && (
            <>
              <SheetHeader className="px-4 pb-2 pt-4">
                <SheetTitle className="font-display text-2xl text-foreground">{collection.title}</SheetTitle>
              </SheetHeader>
              <Body collection={collection} onOpenStory={onOpenStory} />
            </>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer modal={false} open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DrawerContent showOverlay={false} className="border-border bg-card">
        {collection && (
          <>
            <DrawerHeader>
              <DrawerTitle className="font-display text-2xl text-foreground">{collection.title}</DrawerTitle>
            </DrawerHeader>
            <Body collection={collection} onOpenStory={onOpenStory} />
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
