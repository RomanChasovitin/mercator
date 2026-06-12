import { z } from "zod";

const lng = z.number().min(-180).max(180);
const lat = z.number().min(-90).max(90);
const Coords = z.tuple([lng, lat]);

export const EventSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  year: z.number().int(),
  dateLabel: z.string().min(1),
  title: z.string().min(1),
  coords: Coords,
  path: z.array(Coords).min(2).optional(),
  summary: z.string().min(1),
  body: z.string().min(1),
  image: z.string().min(1).optional(),
  sources: z
    .array(z.object({ label: z.string().min(1), url: z.string().url() }))
    .optional(),
});

export const StorySchema = z
  .object({
    id: z.string().min(1),
    epoch: z.string().min(1),
    title: z.string().min(1),
    summary: z.string().min(1),
    cover: z.string().min(1),
    pin: Coords,
    yearStart: z.number().int(),
    yearEnd: z.number().int(),
    map: z.object({ center: Coords, zoom: z.number().min(0).max(24) }),
    events: z.array(EventSchema).min(1),
  })
  .superRefine((story, ctx) => {
    const orders = story.events.map((e) => e.order);
    if (new Set(orders).size !== orders.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Story "${story.id}" has duplicate event order values`,
      });
    }
  });

export type Event = z.infer<typeof EventSchema>;
export type Story = z.infer<typeof StorySchema>;
