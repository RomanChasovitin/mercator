"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/lib/use-media-query";
import { EventGallery } from "@/components/atlas/EventGallery";
import { EVENT_TYPE_META } from "@/lib/map/eventTypes";
import type { Event, Story } from "@/lib/content/schema";
import { ExternalLink } from "lucide-react";

function orderedEvents(story: Story) {
  return [...story.events].sort((a, b) => a.order - b.order);
}

function Inner({ story, event, onSelect }: { story: Story; event: Event; onSelect: (id: string) => void }) {
  const { Icon, label } = EVENT_TYPE_META[event.type];
  const events = orderedEvents(story);
  const index = events.findIndex((e) => e.id === event.id);
  const prev = index > 0 ? events[index - 1] : null;
  const next = index < events.length - 1 ? events[index + 1] : null;

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-3 px-4 pb-4">
          <Badge className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground">
            <Icon className="h-3.5 w-3.5" /> {label}
          </Badge>
          {event.images && event.images.length > 0 && (
            <div className="-mx-4"><EventGallery images={event.images} /></div>
          )}
          {event.body.split("\n\n").map((p, k) => (
            <p key={k} className="text-sm leading-relaxed text-[#b7a884]">{p}</p>
          ))}
          {event.wikipedia && (
            <a href={event.wikipedia} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-primary/60 px-3 py-2 text-sm text-primary hover:bg-primary/10">
              Read on Wikipedia <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
        <Button variant="outline" size="sm" disabled={!prev} onClick={() => prev && onSelect(prev.id)}>← Prev</Button>
        <span className="text-xs text-muted-foreground">{event.order} / {events.length}</span>
        <Button variant="outline" size="sm" disabled={!next} onClick={() => next && onSelect(next.id)}>Next →</Button>
      </div>
    </>
  );
}

function Header({ story, event }: { story: Story; event: Event }) {
  return (
    <>
      <p className="text-xs text-muted-foreground">Event {event.order} of {story.events.length}</p>
      <p className="text-sm font-semibold text-primary">{event.dateLabel}</p>
    </>
  );
}

export function EventDrawer({
  story, event, onSelect,
}: {
  story: Story;
  event: Event;
  onSelect: (eventId: string) => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 640px)");

  if (isDesktop) {
    return (
      <Sheet open modal={false} onOpenChange={() => undefined}>
        <SheetContent side="right" showOverlay={false} showCloseButton={false} className="flex w-[420px] flex-col border-border bg-card p-0 sm:max-w-none">
          <SheetHeader className="px-4 pt-4">
            <Header story={story} event={event} />
            <SheetTitle className="font-display text-2xl text-foreground">{event.title}</SheetTitle>
          </SheetHeader>
          <Inner story={story} event={event} onSelect={onSelect} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer modal={false} open dismissible={false} onOpenChange={() => undefined}>
      <DrawerContent showOverlay={false} className="border-border bg-card [&>button]:hidden">
        <DrawerHeader>
          <Header story={story} event={event} />
          <DrawerTitle className="font-display text-2xl text-foreground">{event.title}</DrawerTitle>
        </DrawerHeader>
        <Inner story={story} event={event} onSelect={onSelect} />
      </DrawerContent>
    </Drawer>
  );
}
