import { z } from "zod";

const lng = z.number().min(-180).max(180);
const lat = z.number().min(-90).max(90);
const Coords = z.tuple([lng, lat]);

export const EVENT_TYPES = [
  "battle", "siege", "naval", "treaty", "alliance", "summit",
  "conquest", "expedition", "uprising", "founding", "discovery", "bombing",
] as const;
export const EventTypeSchema = z.enum(EVENT_TYPES);
export type EventType = z.infer<typeof EventTypeSchema>;

export const EpochIdSchema = z.enum([
  "antiquity", "middle-ages", "renaissance",
  "enlightenment", "modern-era", "contemporary",
]);
export type EpochId = z.infer<typeof EpochIdSchema>;

export const EventImageSchema = z.object({
  src: z.string().url(),       // Wikimedia Commons URL (cached at build)
  alt: z.string().min(1),
  credit: z.string().min(1),
  license: z.string().min(1),
});
export type EventImage = z.infer<typeof EventImageSchema>;

export const EventSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  type: EventTypeSchema,
  year: z.number().int(),
  dateLabel: z.string().min(1),
  title: z.string().min(1),
  coords: Coords,
  path: z.array(Coords).min(2).optional(),
  body: z.string().min(1),
  images: z.array(EventImageSchema).max(4).optional(),
  wikipedia: z.string().url().optional(),
});
export type Event = z.infer<typeof EventSchema>;

export const StorySchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
    tags: z.array(z.string().min(1)).default([]),
    comingSoon: z.boolean().optional(),
    yearStart: z.number().int(),
    yearEnd: z.number().int(),
    map: z.object({ center: Coords, zoom: z.number().min(0).max(24) }).optional(),
    events: z.array(EventSchema).default([]),
  })
  .superRefine((story, ctx) => {
    if (!story.comingSoon && story.events.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Story "${story.id}" is playable but has no events` });
    }
    const orders = story.events.map((e) => e.order);
    if (new Set(orders).size !== orders.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Story "${story.id}" has duplicate event order values` });
    }
  });
export type Story = z.infer<typeof StorySchema>;

export const CollectionSchema = z.object({
  id: z.string().min(1),
  epochId: EpochIdSchema,
  title: z.string().min(1),
  kind: z.string().min(1),                 // primary pill, e.g. "War"
  tags: z.array(z.string().min(1)).default([]),
  summary: z.string().min(1),
  cover: z.string().url().optional(),
  pin: Coords,                              // card location on the Living Map
  yearStart: z.number().int(),
  yearEnd: z.number().int(),
  comingSoon: z.boolean().optional(),
  stories: z.array(StorySchema).min(1),
});
export type Collection = z.infer<typeof CollectionSchema>;

export const EpochTintSchema = z.object({
  background: z.string().min(1),
  land: z.string().min(1),
  landOutline: z.string().min(1),
  accent: z.string().min(1).optional(),
});
export type EpochTint = z.infer<typeof EpochTintSchema>;

export const EpochSchema = z.object({
  id: EpochIdSchema,
  title: z.string().min(1),
  order: z.number().int().positive(),
  yearRange: z.string().min(1),
  tint: EpochTintSchema,
});
export type Epoch = z.infer<typeof EpochSchema>;
