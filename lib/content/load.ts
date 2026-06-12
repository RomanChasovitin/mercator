import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { CollectionSchema, type Collection } from "@/lib/content/schema";
import { EPOCHS } from "@/content/epochs";

const COLLECTIONS_DIR = join(process.cwd(), "content", "collections");
const MANIFEST_PATH = join(process.cwd(), "public", "cache", "manifest.json");

function imageManifest(): Record<string, string> {
  if (!existsSync(MANIFEST_PATH)) return {};
  return JSON.parse(readFileSync(MANIFEST_PATH, "utf8")) as Record<string, string>;
}

function resolveImages(collection: Collection, manifest: Record<string, string>): Collection {
  const map = (url?: string) => (url && manifest[url]) || url;
  return {
    ...collection,
    cover: map(collection.cover),
    stories: collection.stories.map((s) => ({
      ...s,
      events: s.events.map((e) => ({
        ...e,
        images: e.images?.map((img) => ({ ...img, src: map(img.src) as string })),
      })),
    })),
  };
}

export function loadCollections(): Collection[] {
  const manifest = imageManifest();
  const files = readdirSync(COLLECTIONS_DIR).filter((f) => f.endsWith(".json"));
  const collections = files.map((file) => {
    const raw = JSON.parse(readFileSync(join(COLLECTIONS_DIR, file), "utf8"));
    const result = CollectionSchema.safeParse(raw);
    if (!result.success) throw new Error(`Invalid collection "${file}": ${result.error.message}`);
    return resolveImages(result.data, manifest);
  });
  return collections.sort((a, b) => a.yearStart - b.yearStart);
}

export function loadEpochs() {
  return EPOCHS;
}

export function getCollection(id: string): Collection | undefined {
  return loadCollections().find((c) => c.id === id);
}
