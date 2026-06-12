"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Event, Story } from "@/lib/content/schema";

export function EventPanel({
  story,
  event,
  onClose,
}: {
  story: Story;
  event: Event | null;
  onClose: () => void;
}) {
  const open = event !== null;
  return (
    <Sheet open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <SheetContent side="right" className="w-[372px] overflow-y-auto border-border bg-card sm:max-w-none">
        {event && (
          <>
            <SheetHeader>
              <p className="text-xs text-muted-foreground">
                Event {event.order} of {story.events.length}
              </p>
              <p className="text-sm font-semibold text-primary">{event.dateLabel}</p>
              <SheetTitle className="font-display text-2xl text-foreground">{event.title}</SheetTitle>
            </SheetHeader>
            <div className="space-y-3 px-4 pb-6">
              {event.image && (
                <img src={event.image} alt="" className="h-40 w-full rounded-md object-cover" />
              )}
              {event.body.split("\n\n").map((p, i) => (
                <p key={i} className="text-sm leading-relaxed text-[#b7a884]">
                  {p}
                </p>
              ))}
              {event.sources && event.sources.length > 0 && (
                <div className="border-t border-border pt-3 text-xs text-muted-foreground">
                  Sources:{" "}
                  {event.sources.map((s, i) => (
                    <a key={i} href={s.url} className="underline" target="_blank" rel="noreferrer">
                      {s.label}
                      {i < event.sources!.length - 1 ? " · " : ""}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
