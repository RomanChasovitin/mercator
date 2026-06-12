# Mercator MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-route interactive historical atlas where two story pins live on one world map; clicking a pin expands a card, "Enter" applies the story (5 numbered event pins + dashed gold voyage/campaign paths), clicking an event opens an info panel, and closing returns to the menu.

**Architecture:** One Next.js App-Router page (`/`) renders a persistent MapLibre map wrapped by a client state machine with two modes (Menu / Story). Content is hand-curated JSON validated by zod at build time and passed from the server component into the client app. Map basemap is a self-hosted Natural Earth countries GeoJSON styled "Codex" (dark teal land, gold accents) — no external tile server or API key.

**Tech Stack:** Next.js 16 (App Router) + TypeScript, Tailwind CSS v4 + shadcn/ui, MapLibre GL JS, zod, Vitest + React Testing Library. Package manager: Yarn 4.

---

## File Structure

```
package.json, tsconfig.json, next.config.ts, vitest.config.ts   # scaffold + test config
app/
  layout.tsx          # root layout: fonts, <body> theme class
  globals.css         # Tailwind import + "Codex" CSS tokens
  page.tsx            # server component: loads+validates stories, renders <AtlasApp>
components/
  atlas/
    AtlasApp.tsx       # client: owns state machine, URL sync, mode switching
    MapProvider.tsx    # client: creates the single MapLibre instance + context
    MapCanvas.tsx      # client: the map container div + load lifecycle
    StoryPins.tsx      # menu mode: story markers + expandable card
    EventMarkers.tsx   # story mode: numbered event pins
    StoryPaths.ts      # story mode: add/remove dashed gold path layers
    StoryHeader.tsx    # story mode: title + epoch badge + close (X)
    EventPanel.tsx     # shadcn Sheet/Drawer with event content
    SequenceStrip.tsx  # bottom chips 1..N (jump to event)
  ui/                  # shadcn-generated primitives (button, card, badge, sheet, drawer)
lib/
  content/
    schema.ts          # zod schemas + Story/Event types
    load.ts            # read + validate content/stories/*.json (server only)
  map/
    style.ts           # Codex MapLibre StyleSpecification (local GeoJSON sources)
    paths.ts           # build GeoJSON FeatureCollection of event paths
  state/
    atlas.ts           # pure reducer + URL <-> state serialization
    useAtlas.ts        # React hook: useReducer + history (pushState/popstate)
content/stories/
  age-of-discovery.json
  world-war-ii-europe.json
public/
  geo/world.geojson    # Natural Earth 110m countries (downloaded)
  stories/<id>/*.jpg    # event/cover images (placeholders OK in MVP)
lib/**/__tests__/       # unit tests colocated
```

---

## Task 1: Scaffold the Next.js app

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/globals.css` (via create-next-app)

- [ ] **Step 1: Scaffold into the current directory**

The repo already has `CLAUDE.md`, `docs/`, `.gitignore`. Scaffold into the current (non-empty) directory; create-next-app allows this when only non-conflicting files exist.

Run:
```bash
yarn dlx create-next-app@latest . \
  --typescript --tailwind --app --eslint \
  --no-src-dir --import-alias "@/*" --skip-install --yes
```
Expected: creates `app/`, `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `app/globals.css`. If it refuses due to existing files, move `docs/` and `CLAUDE.md` aside, scaffold, then move them back.

- [ ] **Step 2: Pin the package manager and install**

Run:
```bash
yarn set version stable
yarn install
```
Expected: `.yarn/`, `yarn.lock` created; install succeeds.

- [ ] **Step 3: Verify the dev server boots**

Run:
```bash
yarn dev
```
Expected: "Ready" on `http://localhost:3000`. Stop the server (Ctrl-C) after confirming.

- [ ] **Step 4: Add `.yarn` artifacts to `.gitignore`**

Append to `.gitignore`:
```
# dependencies
/node_modules
/.next
/.yarn/*
!/.yarn/patches
!/.yarn/plugins
!/.yarn/releases
!/.yarn/versions
.yarn/install-state.gz
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + TypeScript + Tailwind app"
```

---

## Task 2: Install dependencies and set up Vitest

**Files:**
- Create: `vitest.config.ts`, `vitest.setup.ts`
- Modify: `package.json` (scripts)

- [ ] **Step 1: Install runtime + dev dependencies**

Run:
```bash
yarn add maplibre-gl zod
yarn add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```
Expected: all packages added to `package.json`.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Add test scripts to `package.json`**

In the `"scripts"` object add:
```json
"test": "vitest run",
"test:watch": "vitest",
"validate-content": "vitest run lib/content/__tests__/content.test.ts"
```

- [ ] **Step 5: Add a smoke test to confirm Vitest runs**

Create `lib/__tests__/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("vitest", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Run the smoke test**

Run: `yarn test`
Expected: PASS, 1 test.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: add maplibre, zod, and vitest test harness"
```

---

## Task 3: Content schema (zod) and types

**Files:**
- Create: `lib/content/schema.ts`
- Test: `lib/content/__tests__/schema.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/content/__tests__/schema.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { StorySchema } from "@/lib/content/schema";

const validEvent = {
  id: "columbus",
  order: 1,
  year: 1492,
  dateLabel: "1492",
  title: "Columbus reaches the Americas",
  coords: [-74.5, 24.0],
  path: [[-6.9, 37.2], [-15.6, 28.1], [-74.5, 24.0]],
  summary: "First crossing.",
  body: "Long body text.",
};

const validStory = {
  id: "age-of-discovery",
  epoch: "15-16th c.",
  title: "Age of Discovery",
  summary: "Five voyages.",
  cover: "/stories/age-of-discovery/cover.jpg",
  pin: [-9, 38],
  yearStart: 1492,
  yearEnd: 1532,
  map: { center: [-30, 15], zoom: 1.6 },
  events: [validEvent],
};

describe("StorySchema", () => {
  it("accepts a valid story", () => {
    expect(() => StorySchema.parse(validStory)).not.toThrow();
  });

  it("rejects coords outside lng/lat bounds", () => {
    const bad = { ...validStory, events: [{ ...validEvent, coords: [200, 0] }] };
    expect(() => StorySchema.parse(bad)).toThrow();
  });

  it("rejects a story with no events", () => {
    const bad = { ...validStory, events: [] };
    expect(() => StorySchema.parse(bad)).toThrow();
  });

  it("rejects duplicate event order values", () => {
    const bad = {
      ...validStory,
      events: [validEvent, { ...validEvent, id: "dup", order: 1 }],
    };
    expect(() => StorySchema.parse(bad)).toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test lib/content/__tests__/schema.test.ts`
Expected: FAIL (cannot resolve `@/lib/content/schema`).

- [ ] **Step 3: Implement `lib/content/schema.ts`**

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test lib/content/__tests__/schema.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(content): add zod story/event schema with validation"
```

---

## Task 4: Story datasets (the two MVP stories)

**Files:**
- Create: `content/stories/age-of-discovery.json`
- Create: `content/stories/world-war-ii-europe.json`

- [ ] **Step 1: Create `content/stories/age-of-discovery.json`**

```json
{
  "id": "age-of-discovery",
  "epoch": "15-16th c.",
  "title": "Age of Discovery",
  "summary": "Columbus, da Gama, Cortes, Magellan-Elcano and Pizarro redraw the map of the world.",
  "cover": "/stories/age-of-discovery/cover.jpg",
  "pin": [-9.0, 38.0],
  "yearStart": 1492,
  "yearEnd": 1532,
  "map": { "center": [-30, 15], "zoom": 1.6 },
  "events": [
    {
      "id": "columbus",
      "order": 1,
      "year": 1492,
      "dateLabel": "1492",
      "title": "Columbus reaches the Americas",
      "coords": [-74.5, 24.0],
      "path": [[-6.9, 37.2], [-15.6, 28.1], [-74.5, 24.0]],
      "summary": "The first Spanish crossing of the Atlantic makes landfall in the Bahamas.",
      "body": "Sailing west from Palos under the Castilian crown, Columbus reached the Bahamas in October 1492, believing he had found a route to Asia.\n\nThe landfall opened sustained European contact with the Americas."
    },
    {
      "id": "da-gama",
      "order": 2,
      "year": 1498,
      "dateLabel": "1497-1499",
      "title": "Vasco da Gama reaches India",
      "coords": [75.78, 11.25],
      "path": [[-9.14, 38.7], [18.47, -34.36], [40.1, -3.2], [75.78, 11.25]],
      "summary": "Portugal opens a sea route to India around the Cape of Good Hope.",
      "body": "Da Gama rounded southern Africa and crossed the Indian Ocean to Calicut, establishing the first all-sea trade route between Europe and India.\n\nIt broke the overland spice monopoly and launched Portugal's maritime empire."
    },
    {
      "id": "cortes",
      "order": 3,
      "year": 1521,
      "dateLabel": "1519-1521",
      "title": "Cortes and the fall of Tenochtitlan",
      "coords": [-99.13, 19.43],
      "path": [[-96.13, 19.17], [-98.24, 19.32], [-99.13, 19.43]],
      "summary": "A Spanish-led march inland topples the Aztec capital.",
      "body": "Landing near Veracruz in 1519, Cortes marched inland, forging alliances with rivals of the Mexica.\n\nAfter the siege of 1521, Tenochtitlan fell, opening central Mexico to Spanish rule."
    },
    {
      "id": "magellan",
      "order": 4,
      "year": 1521,
      "dateLabel": "1519-1522",
      "title": "Magellan-Elcano circumnavigation",
      "coords": [123.95, 10.3],
      "path": [[-6.35, 36.78], [-43.2, -22.9], [-70.0, -53.0], [144.8, 13.4], [123.95, 10.3], [18.47, -34.36], [-6.35, 36.78]],
      "summary": "The first voyage around the globe, completed by Elcano.",
      "body": "Magellan's expedition crossed the Atlantic, threaded the strait that bears his name, and reached the Pacific; Magellan died at Mactan in 1521.\n\nElcano brought the survivors home in 1522, proving the world could be circled by sea."
    },
    {
      "id": "pizarro",
      "order": 5,
      "year": 1532,
      "dateLabel": "1532",
      "title": "Pizarro and the conquest of Peru",
      "coords": [-78.5, -7.16],
      "path": [[-79.5, 8.98], [-80.45, -3.57], [-78.5, -7.16], [-71.97, -13.53]],
      "summary": "The Inca emperor is captured at Cajamarca.",
      "body": "Pizarro advanced from Panama down the Pacific coast and inland to Cajamarca, where he seized the Inca ruler Atahualpa in 1532.\n\nThe campaign brought the Inca Empire under Spanish control within a few years."
    }
  ]
}
```

- [ ] **Step 2: Create `content/stories/world-war-ii-europe.json`**

```json
{
  "id": "world-war-ii-europe",
  "epoch": "20th century",
  "title": "World War II in Europe",
  "summary": "From the invasion of Poland to the fall of Berlin, five turning points of the European war.",
  "cover": "/stories/world-war-ii-europe/cover.jpg",
  "pin": [13.4, 52.5],
  "yearStart": 1939,
  "yearEnd": 1945,
  "map": { "center": [15, 50], "zoom": 3.6 },
  "events": [
    {
      "id": "poland-1939",
      "order": 1,
      "year": 1939,
      "dateLabel": "1939",
      "title": "Invasion of Poland",
      "coords": [21.0, 52.23],
      "path": [[13.4, 52.52], [21.0, 52.23]],
      "summary": "Germany invades Poland, triggering the war in Europe.",
      "body": "On 1 September 1939 German forces crossed into Poland, with Soviet forces entering from the east weeks later.\n\nBritain and France declared war, opening the European conflict."
    },
    {
      "id": "france-1940",
      "order": 2,
      "year": 1940,
      "dateLabel": "1940",
      "title": "Fall of France",
      "coords": [2.35, 48.86],
      "path": [[5.0, 49.9], [4.94, 49.7], [2.35, 48.86]],
      "summary": "A thrust through the Ardennes collapses Allied lines and takes Paris.",
      "body": "In May 1940 German armor broke through the Ardennes, bypassing the main Allied defenses.\n\nParis fell in June and France signed an armistice, leaving Britain alone in the west."
    },
    {
      "id": "barbarossa-1941",
      "order": 3,
      "year": 1941,
      "dateLabel": "1941",
      "title": "Operation Barbarossa",
      "coords": [37.62, 55.75],
      "path": [[23.66, 52.08], [27.56, 53.9], [32.04, 54.78], [37.62, 55.75]],
      "summary": "Germany launches the largest land invasion in history against the USSR.",
      "body": "From June 1941 German armies drove deep into Soviet territory toward Moscow.\n\nThe advance stalled before the capital in winter, beginning a long war of attrition in the east."
    },
    {
      "id": "d-day-1944",
      "order": 4,
      "year": 1944,
      "dateLabel": "1944",
      "title": "D-Day landings",
      "coords": [-0.5, 49.34],
      "path": [[-1.09, 50.8], [-0.5, 49.34]],
      "summary": "Allied forces land in Normandy, opening the Western Front.",
      "body": "On 6 June 1944 Allied troops landed on the beaches of Normandy in the largest seaborne invasion ever mounted.\n\nThe beachhead opened the campaign that would liberate Western Europe."
    },
    {
      "id": "berlin-1945",
      "order": 5,
      "year": 1945,
      "dateLabel": "1945",
      "title": "Fall of Berlin",
      "coords": [13.4, 52.52],
      "path": [[21.0, 52.23], [14.38, 52.53], [13.4, 52.52]],
      "summary": "Soviet forces take Berlin, ending the war in Europe.",
      "body": "After crossing the Vistula and the Oder, Soviet armies encircled and stormed Berlin in April-May 1945.\n\nGermany surrendered, ending the European war."
    }
  ]
}
```

- [ ] **Step 3: Add placeholder images so paths resolve**

Create directories and 1x1 placeholder files (replace with real art later):
```bash
mkdir -p public/stories/age-of-discovery public/stories/world-war-ii-europe
# minimal valid jpg placeholders
printf '\xff\xd8\xff\xd9' > public/stories/age-of-discovery/cover.jpg
printf '\xff\xd8\xff\xd9' > public/stories/world-war-ii-europe/cover.jpg
```
Note: `image` fields are omitted in the datasets above, so only `cover.jpg` is referenced. Real cover art can be dropped in later without code changes.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(content): add Age of Discovery and WWII Europe datasets"
```

---

## Task 5: Content loader with build-time validation

**Files:**
- Create: `lib/content/load.ts`
- Test: `lib/content/__tests__/content.test.ts`

- [ ] **Step 1: Write the failing test (validates the REAL datasets)**

Create `lib/content/__tests__/content.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { loadStories } from "@/lib/content/load";

describe("content datasets", () => {
  const stories = loadStories();

  it("loads exactly the two MVP stories", () => {
    const ids = stories.map((s) => s.id).sort();
    expect(ids).toEqual(["age-of-discovery", "world-war-ii-europe"]);
  });

  it("each story has exactly 5 events", () => {
    for (const s of stories) expect(s.events).toHaveLength(5);
  });

  it("events are uniquely ordered 1..5", () => {
    for (const s of stories) {
      const orders = s.events.map((e) => e.order).sort((a, b) => a - b);
      expect(orders).toEqual([1, 2, 3, 4, 5]);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test lib/content/__tests__/content.test.ts`
Expected: FAIL (cannot resolve `@/lib/content/load`).

- [ ] **Step 3: Implement `lib/content/load.ts`**

```ts
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test lib/content/__tests__/content.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(content): add validating story loader"
```

---

## Task 6: Event-paths GeoJSON builder

**Files:**
- Create: `lib/map/paths.ts`
- Test: `lib/map/__tests__/paths.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/map/__tests__/paths.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildPathFeatures } from "@/lib/map/paths";
import type { Story } from "@/lib/content/schema";

const story = {
  events: [
    { id: "a", order: 1, path: [[0, 0], [1, 1]] },
    { id: "b", order: 2 }, // no path -> skipped
    { id: "c", order: 3, path: [[2, 2], [3, 3]] },
  ],
} as unknown as Story;

describe("buildPathFeatures", () => {
  it("creates one LineString per event that has a path", () => {
    const fc = buildPathFeatures(story, "c");
    expect(fc.features).toHaveLength(2);
    expect(fc.features.every((f) => f.geometry.type === "LineString")).toBe(true);
  });

  it("marks the active event's feature", () => {
    const fc = buildPathFeatures(story, "c");
    const active = fc.features.find((f) => f.properties?.eventId === "c");
    const inactive = fc.features.find((f) => f.properties?.eventId === "a");
    expect(active?.properties?.active).toBe(true);
    expect(inactive?.properties?.active).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test lib/map/__tests__/paths.test.ts`
Expected: FAIL (cannot resolve module).

- [ ] **Step 3: Implement `lib/map/paths.ts`**

```ts
import type { Feature, FeatureCollection, LineString } from "geojson";
import type { Story } from "@/lib/content/schema";

export type PathProps = { eventId: string; order: number; active: boolean };

export function buildPathFeatures(
  story: Story,
  activeEventId: string | null,
): FeatureCollection<LineString, PathProps> {
  const features: Feature<LineString, PathProps>[] = story.events
    .filter((e) => e.path && e.path.length >= 2)
    .map((e) => ({
      type: "Feature",
      properties: { eventId: e.id, order: e.order, active: e.id === activeEventId },
      geometry: { type: "LineString", coordinates: e.path as number[][] },
    }));
  return { type: "FeatureCollection", features };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test lib/map/__tests__/paths.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(map): build event-path GeoJSON features"
```

---

## Task 7: Atlas state reducer + URL serialization (pure logic)

**Files:**
- Create: `lib/state/atlas.ts`
- Test: `lib/state/__tests__/atlas.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/state/__tests__/atlas.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import {
  atlasReducer,
  initialState,
  stateToSearch,
  searchToState,
  type AtlasState,
} from "@/lib/state/atlas";

const ids = ["age-of-discovery", "world-war-ii-europe"];

describe("atlasReducer", () => {
  it("starts in menu mode", () => {
    expect(initialState.mode).toBe("menu");
  });

  it("opens a story", () => {
    const s = atlasReducer(initialState, { type: "openStory", storyId: "x" });
    expect(s).toEqual({ mode: "story", storyId: "x", eventId: null });
  });

  it("selects an event only in story mode", () => {
    const open: AtlasState = { mode: "story", storyId: "x", eventId: null };
    expect(atlasReducer(open, { type: "selectEvent", eventId: "e1" }).eventId).toBe("e1");
  });

  it("closes back to menu", () => {
    const open: AtlasState = { mode: "story", storyId: "x", eventId: "e1" };
    expect(atlasReducer(open, { type: "closeStory" })).toEqual(initialState);
  });
});

describe("URL serialization", () => {
  it("serializes menu as empty search", () => {
    expect(stateToSearch(initialState)).toBe("");
  });

  it("round-trips a story+event", () => {
    const s: AtlasState = { mode: "story", storyId: "age-of-discovery", eventId: "columbus" };
    const parsed = searchToState(stateToSearch(s), ids);
    expect(parsed).toEqual(s);
  });

  it("ignores an unknown story id", () => {
    expect(searchToState("?story=nope", ids)).toEqual(initialState);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test lib/state/__tests__/atlas.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `lib/state/atlas.ts`**

```ts
export type AtlasState =
  | { mode: "menu"; storyId: null; eventId: null }
  | { mode: "story"; storyId: string; eventId: string | null };

export type AtlasAction =
  | { type: "openStory"; storyId: string }
  | { type: "selectEvent"; eventId: string }
  | { type: "clearEvent" }
  | { type: "closeStory" }
  | { type: "setState"; state: AtlasState };

export const initialState: AtlasState = { mode: "menu", storyId: null, eventId: null };

export function atlasReducer(state: AtlasState, action: AtlasAction): AtlasState {
  switch (action.type) {
    case "openStory":
      return { mode: "story", storyId: action.storyId, eventId: null };
    case "selectEvent":
      return state.mode === "story" ? { ...state, eventId: action.eventId } : state;
    case "clearEvent":
      return state.mode === "story" ? { ...state, eventId: null } : state;
    case "closeStory":
      return initialState;
    case "setState":
      return action.state;
  }
}

export function stateToSearch(state: AtlasState): string {
  if (state.mode === "menu") return "";
  const params = new URLSearchParams({ story: state.storyId });
  if (state.eventId) params.set("event", state.eventId);
  return `?${params.toString()}`;
}

export function searchToState(search: string, knownStoryIds: string[]): AtlasState {
  const params = new URLSearchParams(search);
  const storyId = params.get("story");
  if (!storyId || !knownStoryIds.includes(storyId)) return initialState;
  return { mode: "story", storyId, eventId: params.get("event") || null };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test lib/state/__tests__/atlas.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(state): add atlas reducer and URL serialization"
```

---

## Task 8: Atlas state hook (URL + browser Back)

**Files:**
- Create: `lib/state/useAtlas.ts`

- [ ] **Step 1: Implement `lib/state/useAtlas.ts`**

This hook keeps the reducer in sync with the URL query and the browser Back button. It is exercised through component tests in later tasks rather than in isolation.

```ts
"use client";

import { useCallback, useEffect, useReducer } from "react";
import {
  atlasReducer,
  initialState,
  searchToState,
  stateToSearch,
  type AtlasAction,
  type AtlasState,
} from "@/lib/state/atlas";

export function useAtlas(knownStoryIds: string[]) {
  const [state, dispatch] = useReducer(
    atlasReducer,
    initialState,
    (init): AtlasState =>
      typeof window === "undefined"
        ? init
        : searchToState(window.location.search, knownStoryIds),
  );

  // Push state changes to the URL (so Back/refresh/share work).
  useEffect(() => {
    const search = stateToSearch(state);
    const next = `${window.location.pathname}${search}`;
    if (next !== `${window.location.pathname}${window.location.search}`) {
      window.history.pushState(null, "", next);
    }
  }, [state]);

  // React to Back/Forward.
  useEffect(() => {
    const onPop = () =>
      dispatch({ type: "setState", state: searchToState(window.location.search, knownStoryIds) });
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [knownStoryIds]);

  const actions = {
    openStory: useCallback((storyId: string) => dispatch({ type: "openStory", storyId }), []),
    selectEvent: useCallback((eventId: string) => dispatch({ type: "selectEvent", eventId }), []),
    clearEvent: useCallback(() => dispatch({ type: "clearEvent" }), []),
    closeStory: useCallback(() => dispatch({ type: "closeStory" }), []),
  };

  return { state, ...actions };
}
```

- [ ] **Step 2: Type-check**

Run: `yarn tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(state): add useAtlas hook with URL and history sync"
```

---

## Task 9: Codex theme tokens and fonts

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace `app/globals.css` with the Codex theme**

```css
@import "tailwindcss";

:root {
  --background: #0d0b07;
  --foreground: #e9dcc3;
  --card: #14110b;
  --card-foreground: #e9dcc3;
  --primary: #e8c074;
  --primary-foreground: #160f02;
  --muted-foreground: #9a886a;
  --border: #2a2114;
  --accent: #c9952f;
  --radius: 0.625rem;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-accent: var(--accent);
  --font-display: var(--font-display);
  --font-sans: var(--font-sans);
}

html, body {
  height: 100%;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), system-ui, sans-serif;
}

.font-display {
  font-family: var(--font-display), Georgia, serif;
}
```

- [ ] **Step 2: Wire fonts and full-height layout in `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Mercator",
  description: "An interactive historical atlas of epochs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Type-check and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(theme): add Codex tokens and display/sans fonts"
```

---

## Task 10: Initialize shadcn/ui and add primitives

**Files:**
- Create: `components.json`, `components/ui/*`, `lib/utils.ts`

- [ ] **Step 1: Initialize shadcn**

Run:
```bash
yarn dlx shadcn@latest init -d
```
Expected: creates `components.json`, `lib/utils.ts`, configures Tailwind. Accept defaults (it detects the App Router and Tailwind v4).

- [ ] **Step 2: Add the components we use**

Run:
```bash
yarn dlx shadcn@latest add button card badge sheet drawer
```
Expected: files created under `components/ui/`.

- [ ] **Step 3: Type-check**

Run: `yarn tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(ui): init shadcn and add button/card/badge/sheet/drawer"
```

---

## Task 11: Basemap GeoJSON and Codex MapLibre style

**Files:**
- Create: `public/geo/world.geojson`
- Create: `lib/map/style.ts`

- [ ] **Step 1: Download a low-res Natural Earth countries GeoJSON**

Run:
```bash
mkdir -p public/geo
curl -L -o public/geo/world.geojson \
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson
```
Expected: a ~700 KB GeoJSON `FeatureCollection`. Verify it starts with `{"type":"FeatureCollection"` (e.g. `head -c 40 public/geo/world.geojson`).

- [ ] **Step 2: Implement `lib/map/style.ts`**

```ts
import type { StyleSpecification } from "maplibre-gl";

/** Self-contained "Codex" style: no external tiles, just our world GeoJSON. */
export const codexStyle: StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    world: { type: "geojson", data: "/geo/world.geojson" },
  },
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#0a0f13" },
    },
    {
      id: "land",
      type: "fill",
      source: "world",
      paint: { "fill-color": "#16241d", "fill-opacity": 0.9 },
    },
    {
      id: "land-outline",
      type: "line",
      source: "world",
      paint: { "line-color": "#26392f", "line-width": 0.6 },
    },
  ],
};
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(map): add Codex basemap GeoJSON and MapLibre style"
```

---

## Task 12: MapProvider and MapCanvas (persistent map instance)

**Files:**
- Create: `components/atlas/MapProvider.tsx`
- Create: `components/atlas/MapCanvas.tsx`

- [ ] **Step 1: Implement `components/atlas/MapProvider.tsx`**

```tsx
"use client";

import maplibregl from "maplibre-gl";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { codexStyle } from "@/lib/map/style";

type MapCtx = { map: maplibregl.Map | null; ready: boolean };
const Ctx = createContext<MapCtx>({ map: null, ready: false });
export const useMap = () => useContext(Ctx);

const WORLD_VIEW = { center: [10, 25] as [number, number], zoom: 1.4 };

export function MapProvider({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: codexStyle,
      center: WORLD_VIEW.center,
      zoom: WORLD_VIEW.zoom,
      attributionControl: { compact: true },
      dragRotate: false,
    });
    map.on("load", () => setReady(true));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <Ctx.Provider value={{ map: mapRef.current, ready }}>
      <div ref={containerRef} className="absolute inset-0" />
      {ready && children}
    </Ctx.Provider>
  );
}

export { WORLD_VIEW };
```

- [ ] **Step 2: Implement `components/atlas/MapCanvas.tsx`**

Imports MapLibre CSS once and renders the provider full-screen.

```tsx
"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import { MapProvider } from "@/components/atlas/MapProvider";

export function MapCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 overflow-hidden">
      <MapProvider>{children}</MapProvider>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

Run: `yarn tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(map): add persistent MapProvider and MapCanvas"
```

---

## Task 13: Story pins + expandable card (Menu mode)

**Files:**
- Create: `components/atlas/StoryPins.tsx`

- [ ] **Step 1: Implement `components/atlas/StoryPins.tsx`**

Renders one MapLibre HTML marker per story. Each marker is a React-free DOM node anchored at `story.pin`; the expand/Enter UI is a positioned overlay driven by React state. To keep markers simple, mount a div per story and toggle an "expanded card" via local state.

```tsx
"use client";

import maplibregl from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { useMap } from "@/components/atlas/MapProvider";
import type { Story } from "@/lib/content/schema";
import { Button } from "@/components/ui/button";

export function StoryPins({
  stories,
  onEnter,
}: {
  stories: Story[];
  onEnter: (storyId: string) => void;
}) {
  const { map } = useMap();
  const [expanded, setExpanded] = useState<string | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!map) return;
    const markers = stories.map((story) => {
      const el = document.createElement("button");
      el.className =
        "h-4 w-4 rounded-full bg-primary shadow-[0_0_0_4px_rgba(232,192,116,0.18),0_0_16px_rgba(232,192,116,0.5)]";
      el.setAttribute("aria-label", story.title);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setExpanded((cur) => (cur === story.id ? null : story.id));
      });
      return new maplibregl.Marker({ element: el }).setLngLat(story.pin).addTo(map);
    });
    markersRef.current = markers;
    const collapse = () => setExpanded(null);
    map.on("click", collapse);
    return () => {
      markers.forEach((m) => m.remove());
      map.off("click", collapse);
    };
  }, [map, stories]);

  const active = stories.find((s) => s.id === expanded);
  if (!map || !active) return null;

  const point = map.project(active.pin);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10"
      aria-live="polite"
    >
      <div
        className="pointer-events-auto absolute w-[300px] overflow-hidden rounded-xl border border-[#3a2e18] bg-card shadow-2xl"
        style={{ left: point.x + 18, top: point.y - 90 }}
      >
        <div
          className="h-28 bg-cover bg-center"
          style={{ backgroundImage: `linear-gradient(180deg,transparent,rgba(20,17,11,.9)), url(${active.cover})` }}
        >
          <span className="m-3 inline-block rounded-full bg-primary px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
            {active.epoch}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-display text-xl">{active.title}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{active.summary}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {active.events.length} events · {active.yearStart}-{active.yearEnd}
            </span>
            <Button size="sm" onClick={() => onEnter(active.id)}>
              Enter →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `yarn tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(menu): add story pins with expandable cards"
```

---

## Task 14: Story paths layer (Story mode)

**Files:**
- Create: `components/atlas/StoryPaths.ts`

- [ ] **Step 1: Implement `components/atlas/StoryPaths.ts`**

A small imperative helper to add/update/remove the dashed gold path layers for the active story. Called from the story-mode component.

```ts
import type maplibregl from "maplibre-gl";
import { buildPathFeatures } from "@/lib/map/paths";
import type { Story } from "@/lib/content/schema";

const SOURCE_ID = "story-paths";

export function setStoryPaths(map: maplibregl.Map, story: Story, activeEventId: string | null) {
  const data = buildPathFeatures(story, activeEventId);
  const existing = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
  if (existing) {
    existing.setData(data);
    return;
  }
  map.addSource(SOURCE_ID, { type: "geojson", data });
  map.addLayer({
    id: "story-paths-line",
    type: "line",
    source: SOURCE_ID,
    layout: { "line-cap": "round" },
    paint: {
      "line-color": "#e8c074",
      "line-dasharray": [1, 2.5],
      "line-width": ["case", ["get", "active"], 3, 1.8],
      "line-opacity": ["case", ["get", "active"], 0.95, 0.45],
    },
  });
}

export function clearStoryPaths(map: maplibregl.Map) {
  if (map.getLayer("story-paths-line")) map.removeLayer("story-paths-line");
  if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
}
```

- [ ] **Step 2: Type-check**

Run: `yarn tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(story): add dashed gold path layer helper"
```

---

## Task 15: Numbered event markers (Story mode)

**Files:**
- Create: `components/atlas/EventMarkers.tsx`

- [ ] **Step 1: Implement `components/atlas/EventMarkers.tsx`**

```tsx
"use client";

import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import { useMap } from "@/components/atlas/MapProvider";
import type { Story } from "@/lib/content/schema";

export function EventMarkers({
  story,
  activeEventId,
  onSelect,
}: {
  story: Story;
  activeEventId: string | null;
  onSelect: (eventId: string) => void;
}) {
  const { map } = useMap();
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!map) return;
    const ordered = [...story.events].sort((a, b) => a.order - b.order);
    const markers = ordered.map((event) => {
      const el = document.createElement("button");
      el.dataset.eventId = event.id;
      el.textContent = String(event.order);
      el.className =
        "flex h-7 w-7 items-center justify-center rounded-full border-2 border-accent bg-background text-sm font-bold text-primary";
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onSelect(event.id);
      });
      return new maplibregl.Marker({ element: el }).setLngLat(event.coords).addTo(map);
    });
    markersRef.current = markers;
    return () => markers.forEach((m) => m.remove());
  }, [map, story, onSelect]);

  // Reflect the active marker visually.
  useEffect(() => {
    markersRef.current.forEach((m) => {
      const el = m.getElement();
      const isActive = el.dataset.eventId === activeEventId;
      el.classList.toggle("scale-125", isActive);
      el.classList.toggle("bg-primary", isActive);
      el.classList.toggle("text-primary-foreground", isActive);
      el.classList.toggle("bg-background", !isActive);
      el.classList.toggle("text-primary", !isActive);
    });
  }, [activeEventId]);

  return null;
}
```

- [ ] **Step 2: Type-check**

Run: `yarn tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(story): add numbered event markers with active state"
```

---

## Task 16: Event panel (Sheet) and sequence strip

**Files:**
- Create: `components/atlas/EventPanel.tsx`
- Create: `components/atlas/SequenceStrip.tsx`
- Test: `components/atlas/__tests__/SequenceStrip.test.tsx`

- [ ] **Step 1: Implement `components/atlas/EventPanel.tsx`**

```tsx
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
              <SheetTitle className="font-display text-2xl text-foreground">
                {event.title}
              </SheetTitle>
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
```

- [ ] **Step 2: Write the failing test for SequenceStrip**

Create `components/atlas/__tests__/SequenceStrip.test.tsx`:
```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SequenceStrip } from "@/components/atlas/SequenceStrip";
import type { Story } from "@/lib/content/schema";

const story = {
  events: [
    { id: "a", order: 1 },
    { id: "b", order: 2 },
    { id: "c", order: 3 },
  ],
} as unknown as Story;

describe("SequenceStrip", () => {
  it("renders one chip per event", () => {
    render(<SequenceStrip story={story} activeEventId={null} onSelect={() => {}} />);
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("calls onSelect with the event id when a chip is clicked", async () => {
    const onSelect = vi.fn();
    render(<SequenceStrip story={story} activeEventId={null} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole("button", { name: "2" }));
    expect(onSelect).toHaveBeenCalledWith("b");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `yarn test components/atlas/__tests__/SequenceStrip.test.tsx`
Expected: FAIL (module not found).

- [ ] **Step 4: Implement `components/atlas/SequenceStrip.tsx`**

```tsx
"use client";

import type { Story } from "@/lib/content/schema";
import { cn } from "@/lib/utils";

export function SequenceStrip({
  story,
  activeEventId,
  onSelect,
}: {
  story: Story;
  activeEventId: string | null;
  onSelect: (eventId: string) => void;
}) {
  const ordered = [...story.events].sort((a, b) => a.order - b.order);
  return (
    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 rounded-lg border border-border bg-background/75 px-2.5 py-2 backdrop-blur">
      <span className="mr-1 text-xs text-muted-foreground">Sequence:</span>
      {ordered.map((e) => (
        <button
          key={e.id}
          onClick={() => onSelect(e.id)}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-md border text-xs",
            e.id === activeEventId
              ? "border-transparent bg-primary font-bold text-primary-foreground"
              : "border-border text-foreground/80",
          )}
        >
          {e.order}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `yarn test components/atlas/__tests__/SequenceStrip.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(story): add event panel and sequence strip"
```

---

## Task 17: Story header (title, epoch, close)

**Files:**
- Create: `components/atlas/StoryHeader.tsx`

- [ ] **Step 1: Implement `components/atlas/StoryHeader.tsx`**

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import type { Story } from "@/lib/content/schema";

export function StoryHeader({ story, onClose }: { story: Story; onClose: () => void }) {
  return (
    <>
      <div className="absolute left-5 top-4 z-10 flex items-center gap-3">
        <h2 className="font-display text-2xl">{story.title}</h2>
        <Badge className="bg-primary text-primary-foreground">{story.epoch}</Badge>
      </div>
      <button
        onClick={onClose}
        aria-label="Close story"
        className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/85 text-muted-foreground hover:text-foreground"
      >
        ✕
      </button>
    </>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `yarn tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(story): add story header with close control"
```

---

## Task 18: StoryLayer — wire paths, markers, panel, camera

**Files:**
- Create: `components/atlas/StoryLayer.tsx`

- [ ] **Step 1: Implement `components/atlas/StoryLayer.tsx`**

Owns story-mode side effects: fly the camera to the story view, draw/update paths, and render the markers, header, panel, and strip. Respects `prefers-reduced-motion`.

```tsx
"use client";

import { useEffect } from "react";
import { useMap } from "@/components/atlas/MapProvider";
import { EventMarkers } from "@/components/atlas/EventMarkers";
import { EventPanel } from "@/components/atlas/EventPanel";
import { SequenceStrip } from "@/components/atlas/SequenceStrip";
import { StoryHeader } from "@/components/atlas/StoryHeader";
import { setStoryPaths, clearStoryPaths } from "@/components/atlas/StoryPaths";
import type { Story } from "@/lib/content/schema";

function prefersReducedMotion() {
  return typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function StoryLayer({
  story,
  activeEventId,
  onSelect,
  onClearEvent,
  onClose,
}: {
  story: Story;
  activeEventId: string | null;
  onSelect: (eventId: string) => void;
  onClearEvent: () => void;
  onClose: () => void;
}) {
  const { map } = useMap();

  // Fly to the story's view on open.
  useEffect(() => {
    if (!map) return;
    const opts = { center: story.map.center, zoom: story.map.zoom };
    if (prefersReducedMotion()) map.jumpTo(opts);
    else map.flyTo({ ...opts, duration: 1400, essential: true });
  }, [map, story]);

  // Draw / update paths; clear on unmount.
  useEffect(() => {
    if (!map) return;
    setStoryPaths(map, story, activeEventId);
    return () => clearStoryPaths(map);
  }, [map, story, activeEventId]);

  // Fly to the selected event.
  useEffect(() => {
    if (!map || !activeEventId) return;
    const event = story.events.find((e) => e.id === activeEventId);
    if (!event) return;
    if (prefersReducedMotion()) map.jumpTo({ center: event.coords });
    else map.flyTo({ center: event.coords, zoom: Math.max(map.getZoom(), 3), duration: 1000 });
  }, [map, story, activeEventId]);

  const activeEvent = story.events.find((e) => e.id === activeEventId) ?? null;

  return (
    <>
      <StoryHeader story={story} onClose={onClose} />
      <EventMarkers story={story} activeEventId={activeEventId} onSelect={onSelect} />
      <SequenceStrip story={story} activeEventId={activeEventId} onSelect={onSelect} />
      <EventPanel story={story} event={activeEvent} onClose={onClearEvent} />
    </>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `yarn tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(story): wire story layer (camera, paths, markers, panel)"
```

---

## Task 19: AtlasApp — top-level state machine + camera reset

**Files:**
- Create: `components/atlas/AtlasApp.tsx`

- [ ] **Step 1: Implement `components/atlas/AtlasApp.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { MapCanvas } from "@/components/atlas/MapCanvas";
import { MapMenuAndStory } from "@/components/atlas/MapMenuAndStory";
import { useAtlas } from "@/lib/state/useAtlas";
import type { Story } from "@/lib/content/schema";

export function AtlasApp({ stories }: { stories: Story[] }) {
  const ids = stories.map((s) => s.id);
  const atlas = useAtlas(ids);

  return (
    <main className="relative h-dvh w-dvw">
      <MapCanvas>
        <MapMenuAndStory stories={stories} atlas={atlas} />
      </MapCanvas>
      <div className="pointer-events-none absolute left-6 top-5 z-10">
        <div className="font-display text-3xl">Mercator</div>
        <div className="text-sm text-muted-foreground">An interactive atlas of epochs</div>
      </div>
    </main>
  );
}

// camera reset to world view when returning to menu lives in MapMenuAndStory
export type { Story };
```

- [ ] **Step 2: Implement `components/atlas/MapMenuAndStory.tsx`**

This component runs *inside* `MapProvider` so it can use `useMap`. It switches between menu pins and the story layer and resets the camera to the world view when closing.

```tsx
"use client";

import { useEffect } from "react";
import { useMap, WORLD_VIEW } from "@/components/atlas/MapProvider";
import { StoryPins } from "@/components/atlas/StoryPins";
import { StoryLayer } from "@/components/atlas/StoryLayer";
import type { Story } from "@/lib/content/schema";
import type { useAtlas } from "@/lib/state/useAtlas";

export function MapMenuAndStory({
  stories,
  atlas,
}: {
  stories: Story[];
  atlas: ReturnType<typeof useAtlas>;
}) {
  const { map } = useMap();
  const { state, openStory, selectEvent, clearEvent, closeStory } = atlas;
  const story = state.mode === "story" ? stories.find((s) => s.id === state.storyId) : undefined;

  // Reset to the world view whenever we are back in menu mode.
  useEffect(() => {
    if (!map || state.mode !== "menu") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const opts = { center: WORLD_VIEW.center, zoom: WORLD_VIEW.zoom };
    reduced ? map.jumpTo(opts) : map.flyTo({ ...opts, duration: 1200 });
  }, [map, state.mode]);

  if (story) {
    return (
      <StoryLayer
        story={story}
        activeEventId={state.eventId}
        onSelect={selectEvent}
        onClearEvent={clearEvent}
        onClose={closeStory}
      />
    );
  }
  return <StoryPins stories={stories} onEnter={openStory} />;
}
```

- [ ] **Step 3: Remove the unused import in AtlasApp**

Delete the now-unused `useEffect` import line from `components/atlas/AtlasApp.tsx` (Step 1 left it in). Run `yarn lint` to confirm.

- [ ] **Step 4: Type-check and lint**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(atlas): wire top-level menu/story state machine"
```

---

## Task 20: The page — load content and render the app

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
import { AtlasApp } from "@/components/atlas/AtlasApp";
import { loadStories } from "@/lib/content/load";

export default function Page() {
  const stories = loadStories();
  return <AtlasApp stories={stories} />;
}
```

- [ ] **Step 2: Run the dev server and walk the flow manually**

Run: `yarn dev`
Verify in the browser at `http://localhost:3000`:
- Menu shows two glowing pins (Iberia and central Europe).
- Clicking a pin expands its card; "Enter" loads the story (camera flies in, 5 numbered pins + dashed gold paths appear).
- Clicking a pin or a sequence chip opens the event panel and highlights that path/marker.
- The ✕ (and browser Back) returns to the menu and the camera flies back out.
- A deep link `http://localhost:3000/?story=age-of-discovery&event=columbus` opens directly in story mode with the panel open.

Stop the server when done.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(app): render the single-route atlas with loaded content"
```

---

## Task 21: Mobile responsiveness (panel becomes a bottom drawer)

**Files:**
- Modify: `components/atlas/EventPanel.tsx`

- [ ] **Step 1: Make the panel responsive**

Use a media query hook to render a shadcn `Drawer` (bottom) on small screens and the `Sheet` (right) on desktop. Add a hook and branch.

Create `lib/use-media-query.ts`:
```ts
"use client";
import { useEffect, useState } from "react";

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const m = window.matchMedia(query);
    setMatches(m.matches);
    const handler = () => setMatches(m.matches);
    m.addEventListener("change", handler);
    return () => m.removeEventListener("change", handler);
  }, [query]);
  return matches;
}
```

Update `components/atlas/EventPanel.tsx` to branch on `useMediaQuery("(min-width: 640px)")`: render the existing `Sheet` body when desktop, and the same content inside `Drawer`/`DrawerContent` when mobile. Reuse a single `EventBody` sub-component for the date/title/image/paragraphs/sources so the content is not duplicated.

```tsx
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useMediaQuery } from "@/lib/use-media-query";
import type { Event, Story } from "@/lib/content/schema";

function EventBody({ event }: { event: Event }) {
  return (
    <div className="space-y-3 px-4 pb-6">
      {event.image && <img src={event.image} alt="" className="h-40 w-full rounded-md object-cover" />}
      {event.body.split("\n\n").map((p, i) => (
        <p key={i} className="text-sm leading-relaxed text-[#b7a884]">{p}</p>
      ))}
      {event.sources && event.sources.length > 0 && (
        <div className="border-t border-border pt-3 text-xs text-muted-foreground">
          Sources:{" "}
          {event.sources.map((s, i) => (
            <a key={i} href={s.url} className="underline" target="_blank" rel="noreferrer">
              {s.label}{i < event.sources!.length - 1 ? " · " : ""}
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
      <p className="text-xs text-muted-foreground">Event {event.order} of {story.events.length}</p>
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
```

- [ ] **Step 2: Type-check, lint, and manual mobile check**

Run: `yarn tsc --noEmit && yarn lint`
Expected: no errors. Then `yarn dev`, open devtools device toolbar, confirm the panel docks to the bottom on a phone viewport.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(story): make event panel a bottom drawer on mobile"
```

---

## Task 22: Production build, full test run, and deploy config

**Files:**
- Modify: `next.config.ts`
- Create: `README.md` (run/deploy notes)

- [ ] **Step 1: Confirm the full test suite passes**

Run: `yarn test`
Expected: all tests PASS (schema, content, paths, atlas, SequenceStrip).

- [ ] **Step 2: Run a production build**

Run: `yarn build`
Expected: build succeeds; the `/` route is statically generated. If MapLibre triggers SSR issues, confirm all map components carry `"use client"` and are only imported by client components (they are).

- [ ] **Step 3: Add a short README**

Create `README.md`:
```markdown
# Mercator

Interactive single-route historical atlas. One world map; click a story pin to enter
a story of 5 events drawn as dashed voyage/campaign paths.

## Develop
- `yarn install`
- `yarn dev` → http://localhost:3000

## Test
- `yarn test` (unit + content validation)

## Build
- `yarn build` (fully static; deploy the output to Vercel)

## Content
Stories live in `content/stories/*.json`, validated by zod at build time
(`lib/content/schema.ts`). Images live in `public/stories/<storyId>/`.
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: production build config and README"
```

- [ ] **Step 5: Deploy to Vercel**

Run:
```bash
yarn dlx vercel --prod
```
Or connect the Git repo in the Vercel dashboard. Expected: a published production URL. Verify the menu→story→menu flow works on the deployed site.

---

## Self-Review

**Spec coverage:**
- Single route `/` with Menu/Story modes → Tasks 19-20.
- Story pins on a world map, expand → Enter → Task 13.
- 5 numbered event pins + dashed gold paths → Tasks 14-15.
- Event info panel (Sheet desktop / Drawer mobile) → Tasks 16, 21.
- Sequence strip, no autoplay → Task 16.
- Close (X) + browser Back + URL deep-link → Tasks 7-8, 17, 19.
- Path-based event model (`coords` required, `path` optional) → Tasks 3-6.
- No `Period` entity; `epoch` is a label → Tasks 3-4.
- Codex theme + recolored map → Tasks 9, 11.
- Two datasets, 5 events each → Task 4; enforced by Task 5 tests.
- zod build-time validation → Tasks 3, 5.
- Reduced-motion instant transitions → Task 18-19.
- Deploy to production → Task 22.

**Type consistency:** `loadStories`/`getStory` (Task 5), `buildPathFeatures(story, activeEventId)` (Task 6, used identically in Task 14), `setStoryPaths`/`clearStoryPaths` (Task 14, used in Task 18), `useMap()`/`WORLD_VIEW` (Task 12, used in Tasks 13/15/19), `useAtlas` action names `openStory/selectEvent/clearEvent/closeStory` (Tasks 7-8, used in Task 19) are consistent across tasks.

**Placeholder scan:** No TBD/TODO; every code step contains complete code. Placeholder *images* in Task 4 are intentional and documented (real art is drop-in later).
