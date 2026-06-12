# Mercator V2 — Design Spec

- **Date:** 2026-06-13
- **Status:** Draft for review
- **Language:** English (per `CLAUDE.md`, in-repo technical docs are English-only).
- **Supersedes:** `2026-06-12-mercator-design.md` (the MVP). The MVP is now merged to
  `main`; this spec describes the next version built on top of it.

> Product discussion with the maintainer happens in Russian; the committed spec stays
> in English.

---

## 1. What changes from the MVP

The MVP is a single map with a flat list of **stories**, each holding ~5 **events**.
V2 keeps the one-map, fully-static, premium-"Codex" foundation but introduces a
four-level content hierarchy, a card-based menu, richer per-event content, and
per-epoch map theming.

**Headline changes:**

1. **Four-level content model:** `Epoch → Collection → Story → Event`. A Collection
   (e.g. "World War II") groups many small Stories (e.g. "Eastern Front"); each Story
   is a short ordered path of Events.
2. **Living Map menu:** collections appear as floating **cards** on the map (not bare
   dots), filtered by a 6-epoch selector bar.
3. **Collection drawer:** clicking a collection card opens a right drawer listing its
   stories.
4. **Story view:** a **persistent** right drawer always shows the active event; the
   active event renders its **type icon + title on the map**; others are dots.
5. **Event types:** every event has one of 12 **types** (icon on the map).
6. **Tags as pills:** Collections and Stories carry tags rendered as pills (events do
   **not**).
7. **Richer events:** each event gets an **image gallery** (0–4 images) and an optional
   **Wikipedia** link. Image bodies stay short (2–3 sentences).
8. **Map:** no modern political borders; a **per-epoch color tint**.
9. **"Coming Soon"** stories: most stories ship locked, to show breadth without a
   content marathon.

## 2. Scope of this version

**Breadth over depth.** Build the full engine, then seed **2–3 collections per epoch**,
each with exactly **one fully playable story (~5 events)**; every other story in each
collection is **Coming Soon**. Each event body is **2–3 sentences maximum**.

**In scope:**
- New four-level data model + `zod` schemas + build-time validation.
- Living Map menu (epoch selector + floating collection cards).
- Collection drawer (story list, "Play whole collection" shown but disabled/"Soon").
- Story view (persistent event drawer, on-map active type-icon + title, image gallery,
  Wikipedia link, Prev/Next + clickable pins).
- 12 event types with icons.
- Per-epoch map tint; borderless basemap.
- Build-time image cache pipeline from Wikimedia Commons.
- Content per §9 (~18 collections, ~18 playable stories, WW2 as flagship with 9
  extra Coming-Soon stories).
- Responsive (desktop + basic mobile; drawers become bottom sheets on mobile).

**Explicitly NOT in this version:**
- Cinematic **autoplay** (per-story or "Play whole collection" — the button ships
  visible but disabled).
- Dynamic period-accurate **borders** (deferred; basemap stays borderless).
- Exhaustive content (only one playable story per collection).
- Backend/DB/API · accounts · monetization · RAG "Ask AI".

## 3. Information architecture & data model

Authored as static JSON validated with `zod` at build. There is **one JSON file per
Collection** (stories and events nested inside it), plus one epochs definition.

```ts
type EpochId =
  | "antiquity" | "middle-ages" | "renaissance"
  | "enlightenment" | "modern-era" | "contemporary";

type Epoch = {
  id: EpochId;
  title: string;            // "Antiquity"
  order: number;            // selector order, 1..6
  yearRange: string;        // display label, e.g. "3000 BCE – 500 CE"
  tint: {                   // per-epoch map colors (§7)
    background: string;     // water / backdrop
    land: string;           // land fill
    landOutline: string;    // coastline
    accent?: string;        // optional; defaults to Codex gold
  };
};

type EventType =
  | "battle" | "siege" | "naval" | "treaty" | "alliance" | "summit"
  | "conquest" | "expedition" | "uprising" | "founding" | "discovery" | "bombing";

type EventImage = {
  src: string;              // Wikimedia Commons URL (cached to /public at build)
  alt: string;
  credit: string;           // attribution text
  license: string;          // e.g. "Public domain", "CC BY-SA 4.0"
};

type Event = {
  id: string;
  order: number;            // 1..N within the story
  type: EventType;          // drives the map icon
  year: number;             // numeric sort key (BCE = negative)
  dateLabel: string;        // "23 Aug 1942 – 2 Feb 1943"
  title: string;
  coords: [number, number]; // [lng, lat] — pin + label + click target (required)
  path?: [number, number][];// optional voyage/campaign arc (dashed gold)
  body: string;             // 2–3 sentences
  images?: EventImage[];    // 0–4, gallery/carousel
  wikipedia?: string;       // URL
};

type Story = {
  id: string;
  title: string;
  summary: string;          // one line
  tags: string[];           // pills
  comingSoon?: boolean;     // locked card; when true, events may be []
  yearStart: number;
  yearEnd: number;
  map?: { center: [number, number]; zoom: number }; // optional; else fit event bounds
  events: Event[];          // ~5 when playable; [] allowed when comingSoon
};

type Collection = {
  id: string;
  epochId: EpochId;
  title: string;            // "World War II"
  kind: string;             // primary pill: "War" | "Exploration" | ...
  tags: string[];           // extra pills
  summary: string;          // 1–2 lines
  cover?: string;           // image (cached at build)
  pin: [number, number];    // collection card location on the Living Map [lng, lat]
  yearStart: number;
  yearEnd: number;
  comingSoon?: boolean;     // optional: entire collection locked
  stories: Story[];
};
```

**Layout:**
- `content/epochs.ts` (or `.json`) — the 6 epochs incl. tints (small, fixed; keep as
  typed module).
- `content/collections/<collectionId>.json` — one Collection per file (`epochId`
  links it to its epoch).
- Cached images in `public/cache/<collectionId>/...` (written by the image pipeline,
  §8).

**Build-time validation** (`zod`, fail the build on error):
- Unique `order` within each story; unique `id`s across epochs/collections/stories/
  events.
- `epochId` references a known epoch.
- A non-`comingSoon` story has ≥1 event; every event has `coords`.
- `type` is one of the 12; every `wikipedia` is a valid URL.

## 4. Navigation, state & routing

One client-side state machine over one persistent MapLibre instance (the map is never
torn down), extending the MVP's reducer.

```
menu  : { mode: "menu";  epochId: EpochId; openCollectionId: string | null }
story : { mode: "story"; collectionId; storyId; eventId }
```

- The **collection drawer is an overlay on menu mode** (`openCollectionId` set), not a
  separate mode. Closing it returns to the Living Map.
- In **story mode the event drawer is always open**, defaulting to `eventId` = the
  first event. There is no "drawer closed" story state.
- **Controls:** `← <Story name>` returns to the collection drawer (menu mode, that
  collection open); `✕` exits to the menu (Living Map).
- **URL deep links (shallow query params):**
  `?epoch=modern-era` · `?collection=world-war-ii` (drawer open) ·
  `?story=eastern-front&event=stalingrad`. Reloading a deep link restores that state;
  browser **Back** steps out one level.
- **Accessibility:** under `prefers-reduced-motion`, camera transitions are instant.

## 5. Menu screen — "Living Map"

A full-bleed world map in the Codex style, tinted to the selected epoch (§7).

- **Epoch selector:** a horizontal segmented bar pinned top-center — Antiquity ·
  Middle Ages · Renaissance · Enlightenment · Modern Era · Contemporary. Selecting an
  epoch re-tints the map and shows that epoch's collections.
- **Collection cards** float at each collection's `pin` (replacing the MVP's dots):
  compact card = small **kind icon + title**. A fully-`comingSoon` collection card
  reads as locked.
- **Clicking a card opens the collection drawer** (§6); the map may ease toward the
  card.
- Wordmark "MERCATOR" sits in a corner overlay.

## 6. Collection drawer

Slides in from the **right** over the Living Map; the map stays visible behind it.

- **Header:** cover band, collection **title**, a **kind pill** + **tag pills**, a
  meta line (`year range · N stories · N events`), and a 1–2 line summary.
- **"▶ Play whole collection"**: full-width primary button, shown **disabled with a
  "Soon" badge** (future autoplay of the entire collection).
- **Story list:** vertical cards, each with an **order number**, **title**, a meta
  line (`N events · year range`), and **tag pills**. Playable stories are clickable
  (→ story view); **Coming-Soon** stories render greyed with a **"Soon" pill** and are
  not clickable.
- **Close** (`✕`) returns to the Living Map.
- **Mobile:** the drawer becomes a bottom sheet (reuse the MVP `Drawer` pattern).

## 7. Story view

The same map flies to the story's region (configured `map` or fit to event bounds) and
draws the story's events.

- **Event markers:**
  - **Inactive** events = small glowing gold dots with their order number, no label.
  - The **active** event = an enlarged gold marker showing its **type icon**, plus a
    floating **title label** (the only on-map text label), e.g. "Battle of Stalingrad".
- **Path:** each event's `path` (and/or the inter-event sequence) drawn as a dashed
  gold arc; the active segment emphasized, others dimmed.
- **Persistent event drawer (right):**
  - Header: `Event k of N` + `✕` (exit to menu).
  - **Type chip** (icon + type label) · **title** · **date label**.
  - **Image gallery:** a main image with left/right arrows and a row of up to 4
    thumbnails (carousel). Hidden gracefully when an event has no images.
  - **Body:** 2–3 sentences.
  - **"Read on Wikipedia ↗"** link (when `wikipedia` set).
  - **Nav row:** `← Prev` / `Next →`.
- **Back control:** `← <Story name>` (to the collection drawer) with the collection
  name above it.
- **Navigation:** Prev/Next buttons **and** clicking pins. (No bottom sequence strip —
  removed as redundant.)
- **Mobile:** the event drawer becomes a bottom sheet; the on-map active label remains.

## 8. Map, theming & image pipeline

**Basemap** — borderless by design (the MVP basemap is already land fill + coastline
outline only; **no political-border layer is ever added**). This avoids the
miscommunication of modern borders on historical maps. Period-accurate dynamic borders
are a future feature, out of scope here.

**Per-epoch tint** — one base MapLibre style whose `background`, `land`, and
`land-outline` paint colors are driven by the selected `Epoch.tint`. Switching epochs
recolors these layers (no full style reload). Gold accents for pins/paths stay constant
unless an epoch overrides `accent`. Tints are chosen to give each epoch a distinct mood
(e.g. warm bronze for Antiquity, cool stone for the Middle Ages, teal-navy for the
Contemporary world); exact values tuned during implementation.

**Image pipeline** — a build-time Node script:
1. Walks all collection JSON, collecting `cover` and `images[].src` (Commons URLs).
2. Downloads + optimizes each into `public/cache/<collectionId>/<hash>.<ext>`.
3. Rewrites references (or maps them at load) to the cached local path; records
   `credit`/`license` for display.
4. **Fails the build on a dead/forbidden URL** so content stays self-contained and
   offline-safe. Cached files may be committed or regenerated; decision in §12.

## 9. Content plan

Six epochs; **2–3 collections each**; one **playable** story per collection (▶, ~5
events, 2–3 sentences/event); all other stories **Coming Soon**. Names below are the
target; minor swaps allowed during authoring.

| Epoch | Collections (▶ = the playable story) |
|---|---|
| **Antiquity** | Greco-Persian Wars ▶ *The Persian Invasion* (Marathon, Thermopylae, Salamis, Plataea, Mycale); Alexander the Great ▶ *Conquest of Persia* (Granicus, Issus, Siege of Tyre, Gaugamela, Babylon); Wars of Rome ▶ *Hannibal's War* (Saguntum, Crossing the Alps, Lake Trasimene, Cannae, Zama) |
| **Middle Ages** | The Crusades ▶ *The First Crusade* (Clermont, Nicaea, Antioch, Jerusalem 1099, Ascalon); Mongol Conquests ▶ *Genghis Khan's Empire*; Norman Conquest ▶ *1066* (Stamford Bridge, Hastings, London) |
| **Renaissance** | Age of Discovery ▶ *Columbus & the New World* (evolve existing MVP content); Fall of Constantinople ▶ *The Siege of 1453*; The Reformation ▶ *Luther's Revolt* |
| **Enlightenment** | American Revolution ▶ *War of Independence* (Lexington, Bunker Hill, Saratoga, Yorktown); French Revolution ▶ *Fall of the Monarchy* (Bastille, …); Napoleonic Wars ▶ *Napoleon's Campaigns* (Austerlitz, Jena, Russia 1812, Leipzig, Waterloo) |
| **Modern Era** | World War I ▶ *The Western Front* (invasion of Belgium, Marne, Verdun, Somme, Armistice); **World War II ▶ *Eastern Front* (Barbarossa, Leningrad, Moscow, Stalingrad, Kursk) — flagship, + 9 Coming-Soon stories**; American Civil War ▶ *The Civil War* (Fort Sumter, Bull Run, Antietam, Gettysburg, Appomattox) |
| **Contemporary** | The Cold War ▶ *The Cuban Missile Crisis*; The Space Race ▶ *To the Moon* (Sputnik, Gagarin, Apollo 8, Apollo 11); Fall of the USSR ▶ *1991* |

**World War II Coming-Soon stories** (locked cards in the collection drawer, beyond the
playable *Eastern Front*): Road to War, Outbreak, Soviet Counteroffensive, D-Day &
Normandy, On to Berlin, North African Front, Italian Front, Pacific War, Aftermath.

## 10. Tech stack

Unchanged from the MVP except where noted:
- **Next.js (App Router) + TypeScript**, fully static (SSG), single client route.
- **Tailwind CSS + shadcn/ui** — compose existing components (Sheet/Drawer, Button,
  Card, Badge, Tooltip) before writing new ones. Pills = `Badge`.
- **MapLibre GL JS** — one persistent instance; paint-driven per-epoch tint.
- **zod** — content schemas + build-time validation.
- React state/context for the extended menu/collection/story machine.
- **New:** a Node build script for the image cache pipeline.
- Deploy: Vercel. All code/comments/docs in English (`CLAUDE.md`).

## 11. Migration from the MVP

The MVP code is the starting point; refactor rather than rewrite.

- **Schema/loader:** replace `Story`/`Event` schemas with the four-level model; replace
  `loadStories()` with a collection loader (`content/collections/*.json` + `epochs`).
- **State machine:** extend `atlas.ts` reducer + `searchToState`/`stateToSearch` for
  `epoch`/`collection`/`story`/`event`.
- **Menu:** evolve `StoryPins`/`MapMenuAndStory` into the epoch selector + floating
  collection cards + collection drawer.
- **Story view:** extend `StoryLayer`/`EventMarkers`/`EventPanel` for event types
  (icons), the always-open drawer, the on-map active label, the image gallery, and the
  Wikipedia link. **Remove `SequenceStrip`** (redundant).
- **Map:** keep the borderless basemap; add per-epoch tint switching to `style.ts` /
  `MapProvider`.
- **Content:** migrate the two existing MVP stories into the new structure (Age of
  Discovery → Renaissance collection; the WWII-Europe events fold into the WW2
  collection's stories), then author the rest per §9.
- **Icons:** add the 12 event-type icons (line-style SVG, gold) as a small icon set.

## 12. Open decisions (deferred to implementation)

- Exact per-epoch tint values and whether any epoch overrides `accent`.
- Whether cached images are committed to the repo or regenerated on each build (repo
  weight vs. build-time network dependency).
- `epochs` as a typed `.ts` module vs. JSON (leaning typed module — it's small/fixed).
- The specific event-type icon glyphs (finalize against the approved mockup set).
- Whether `Collection.cover`/story thumbnails are required or optional for v1.

## 13. Success criteria

- Deployed URL in production.
- All 6 epochs selectable; each shows 2–3 collection cards on the Living Map with the
  correct per-epoch tint.
- Each collection opens a drawer; its one playable story plays end to end (open, read
  all ~5 events via Prev/Next and pins, view gallery + Wikipedia link, return).
- Coming-Soon stories render locked and are not enterable.
- Event types show distinct icons; the active event shows its icon + title on the map;
  modern borders are absent.
- Deep links and Back work across epoch/collection/story/event levels.
- Visually premium ("Codex"); responsive with drawers → bottom sheets on mobile.

## 14. Testing

- `zod` validation of all content at build (+ a test that fails on a broken dataset:
  bad `epochId`, duplicate order, missing `coords`, playable story with no events).
- Unit tests: state machine transitions and URL ↔ state round-trips across all four
  levels; event ordering; year sorting.
- Component tests: collection drawer (playable vs Coming-Soon story cards), event
  drawer (Prev/Next, gallery navigation, Wikipedia link presence).
- Image pipeline: a test/dry-run that the resolver maps every referenced image to a
  cached path and flags dead URLs.
- Manual QA of map visuals, per-epoch tints, transitions, and the full
  menu → collection → story flow.
