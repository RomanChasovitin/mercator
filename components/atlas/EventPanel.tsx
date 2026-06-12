"use client";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/lib/use-media-query";
import type { Event, Story } from "@/lib/content/schema";

function EventBody({ event }: { event: Event }) {
  const sources = event.sources ?? [];

  return (
    <div className="space-y-3 px-4 pb-6">
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

export function EventPanel({
  story,
  event,
  onClose,
}: {
  story: Story;
  event: Event | null;
  onClose: () => void;
}) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const open = event !== null;
  const meta = event && (
    <>
      <p className="text-xs text-muted-foreground">
        Event {event.order} of {story.events.length}
      </p>
      <p className="text-sm font-semibold text-primary">{event.dateLabel}</p>
    </>
  );

  if (isDesktop) {
    return (
      <Sheet open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
        <SheetContent side="right" className="w-[372px] overflow-y-auto border-border bg-card sm:max-w-none">
          {event && (
            <>
              <SheetHeader>
                {meta}
                <SheetTitle className="font-display text-2xl text-foreground">{event.title}</SheetTitle>
              </SheetHeader>
              <EventBody event={event} />
            </>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Drawer open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DrawerContent className="border-border bg-card">
        {event && (
          <>
            <DrawerHeader>
              {meta}
              <DrawerTitle className="font-display text-2xl text-foreground">{event.title}</DrawerTitle>
            </DrawerHeader>
            <EventBody event={event} />
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
