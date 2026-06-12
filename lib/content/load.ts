import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { StorySchema, type Story } from "@/lib/content/schema";

const STORIES_DIR = join(process.cwd(), "content", "stories");

/**
 * Reads and validates every story JSON file. Throws on the first invalid
 * dataset so a broken file fails the build.
 */
export function loadStories(): Story[] {
  const files = readdirSync(STORIES_DIR).filter((f) => f.endsWith(".json"));
  const stories = files.map((file) => {
    const raw = JSON.parse(readFileSync(join(STORIES_DIR, file), "utf8"));
    const result = StorySchema.safeParse(raw);
    if (!result.success) {
      throw new Error(`Invalid story "${file}": ${result.error.message}`);
    }
    return result.data;
  });
  return stories.sort((a, b) => a.yearStart - b.yearStart);
}

export function getStory(id: string): Story | undefined {
  return loadStories().find((s) => s.id === id);
}
