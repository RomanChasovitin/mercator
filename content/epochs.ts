import { EpochSchema, type Epoch } from "@/lib/content/schema";

const epochs: Epoch[] = [
  { id: "antiquity", title: "Antiquity", order: 1, yearRange: "3000 BCE – 500 CE",
    tint: { background: "#1a130b", land: "#3b2f1c", landOutline: "#7a5e30", accent: "#e8c074" } },
  { id: "middle-ages", title: "Middle Ages", order: 2, yearRange: "500 – 1400",
    tint: { background: "#0e1410", land: "#2c3a2e", landOutline: "#5a7a5e", accent: "#cdb27a" } },
  { id: "renaissance", title: "Renaissance", order: 3, yearRange: "1400 – 1600",
    tint: { background: "#101622", land: "#2c3a52", landOutline: "#5e7aa0", accent: "#e8c074" } },
  { id: "enlightenment", title: "Enlightenment", order: 4, yearRange: "1600 – 1789",
    tint: { background: "#0c1520", land: "#234a3a", landOutline: "#5a9a72", accent: "#e8c074" } },
  { id: "modern-era", title: "Modern Era", order: 5, yearRange: "1789 – 1945",
    tint: { background: "#0d1014", land: "#2e3338", landOutline: "#6b7480", accent: "#e8c074" } },
  { id: "contemporary", title: "Contemporary", order: 6, yearRange: "1945 – today",
    tint: { background: "#0a1418", land: "#13343a", landOutline: "#4a8a90", accent: "#7fd4d0" } },
];

// Fail the build if a tint/shape is malformed.
epochs.forEach((e) => EpochSchema.parse(e));

export const EPOCHS = [...epochs].sort((a, b) => a.order - b.order);
export const DEFAULT_EPOCH_ID = "modern-era" as const;
export function getEpoch(id: string): Epoch | undefined {
  return EPOCHS.find((e) => e.id === id);
}
