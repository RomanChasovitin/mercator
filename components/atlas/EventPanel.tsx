"use client";

import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/lib/use-media-query";
import type { Event, Story } from "@/lib/content/schema";

function orderedEvents(story: Story) {
  return [...story.events].sort((a, b) => a.order - b.order);
}

function EventBody({ event }: { event: Event }) {
  const sources = event.sources ?? [];

  return (
    <div className="space-y-3 px-4 pb-4">
      {event.image && <img src={event.image} alt="" className="h-40 w-full rounded-md object-cover" />}
      {event.body.split("\n\n").map((p, i) => (
        <p key={i} className="text-sm leading-relaxed text-[#b7a884]">
          {p}
        </p>
      ))}
      {sources.length > 0 && (
        <div className="border-t border-border pt-3 text-xs text-muted-foreground">
          Sources:{" "}
          {sources.map((s, i) => (
            <a key={i} href={s.url} className="underline" target="_blank" rel="noreferrer">
              {s.label}
              {i < sources.length - 1 ? " · " : ""}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function EventNav({
  story,
  event,
  onSelect,
}: {
  story: Story;
  event: Event;
  onSelect: (eventId: string) => void;
}) {
  const events = orderedEvents(story);
  const index = events.findIndex((e) => e.id === event.id);
  const prev = index > 0 ? events[index - 1] : null;
  const next = index < events.length - 1 ? events[index + 1] : null;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
      <Button
        variant="outline"
        size="sm"
        disabled={!prev}
        onClick={() => prev && onSelect(prev.id)}
      >
        ← Prev
      </Button>
      <span className="text-xs text-muted-foreground">
        {event.order} / {events.length}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={!next}
        onClick={() => next && onSelect(next.id)}
      >
        Next →
      </Button>
    </div>
  );
}

function EventMeta({ story, event }: { story: Story; event: Event }) {
  return (
    <>
      <p className="text-xs text-muted-foreground">
        Event {event.order} of {story.events.length}
      </p>
      <p className="text-sm font-semibold text-primary">{event.dateLabel}</p>
    </>
  );
}

export function EventPanel({
  story,
  event,
  onClose,
  onSelect,
}: {
  story: Story;
  event: Event | null;
  onClose: () => void;
  onSelect: (eventId: string) => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const open = event !== null;

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
        <SheetContent
          side="right"
          showOverlay={false}
          className="flex w-[372px] flex-col border-border bg-card p-0 sm:max-w-none"
        >
          {event && (
            <>
              <SheetHeader className="px-4 pt-4">
                <EventMeta story={story} event={event} />
                <SheetTitle className="font-display text-2xl text-foreground">{event.title}</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto">
                <EventBody event={event} />
              </div>
              <SheetFooter className="mt-0 block p-0">
                <EventNav story={story} event={event} onSelect={onSelect} />
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer modal={false} open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DrawerContent showOverlay={false} className="border-border bg-card">
        {event && (
          <>
            <DrawerHeader>
              <EventMeta story={story} event={event} />
              <DrawerTitle className="font-display text-2xl text-foreground">{event.title}</DrawerTitle>
            </DrawerHeader>
            <EventBody event={event} />
            <DrawerFooter className="p-0 pt-0">
              <EventNav story={story} event={event} onSelect={onSelect} />
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
