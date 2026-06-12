# Mercator — Design Spec

- **Date:** 2026-06-12
- **Status:** Draft for review
- **Languages:** Русский (Part 1) · English (Part 2) — both parts are equivalent.

> Bilingual document. Part 1 is the authoritative Russian version used during
> brainstorming. Part 2 is the English translation. Keep both in sync on edits.

---

# Part 1 — Русская версия

## 1. Концепт

**Mercator — интерактивный исторический атлас эпох.** История нарезана на
**периоды**; внутри периодов — нарративные **сюжеты**; каждый сюжет проживается на
карте через **события** и кинематографический режим **autoplay**.

Главный отрыв от конкурентов (GeaCron, Running Reality, OpenHistoricalMap) —
**премиальный UX и атмосферная карта** там, где у них «голый GIS», мёртвый проект
или академическая сухость. Аудитория — фанаты истории / CK / Civ, платёжеспособная
и большая.

**Приоритет проекта:** скорость до работающего демо в проде. Глубину, бэкенд и
«магию» наслаиваем итерациями.

## 2. Модель контента (3 уровня)

| Уровень | Что это | Роль |
|--------|---------|------|
| **Период** | Широкая эра (Античность, Средневековье, Новое время) | Группирующая витрина на главной |
| **Сюжет** | Нарративная арка внутри периода («Завоевания Александра») | Единица контента: карта + события + autoplay. = один ручной датасет |
| **Событие** | Точка на карте внутри сюжета («Битва при Гавгамелах») | Раскрывающаяся интерактивная секция с информацией |

Карта и autoplay живут на уровне **сюжета**. Период — это навигационная обёртка.
Ручной датасет, который собирает мейнтейнер, = один сюжет.

## 3. Информационная архитектура (экраны)

1. **Главная** (`/`) — витрина периодов карточками.
2. **Страница периода** (`/[period]`) — герой периода + витрина его сюжетов (глав).
3. **Страница сюжета** (`/[period]/[story]`) — ядро приложения (см. §4).

Каждый экран — статическая страница Next.js (SSG). Побочный бонус: бесплатное
programmatic-SEO (страницы вида «карта завоеваний Александра») без бэкенда.

## 4. Ядро — страница сюжета

Полноэкранная стилизованная карта + панель события + лента autoplay.

**Карта.** MapLibre GL с кастомным стилем (см. §6). События — маркеры на карте.
Для P1 — HTML-маркеры (проще стилизовать и анимировать; событий ~10–20 на сюжет).
Линия-маршрут (пунктир, золото) соединяет события по порядку.

**Состояния маркеров:** прошлые (приглушённые) · активное (свечение) · будущие
(едва видимые в autoplay; в свободном просмотре — обычные).

**Панель события.** Клик по маркеру → панель справа (desktop) или нижний шит
(mobile) на базе shadcn `Sheet`/`Drawer`. Карта плавно летит к событию (`flyTo`).
Содержимое панели: дата · заголовок · изображение · текст (2–4 абзаца) · источники ·
ссылки · задел под кнопку «Спросить ИИ» (функция — P2).

**Два режима:**
- **Свободный просмотр** — все события видны, кликаешь любое, читаешь.
- **Autoplay (тур)** — камера по очереди облетает события: `flyTo` → маркер
  проявляется → панель раскрывает контент → пауза N секунд → рисуется сегмент
  маршрута → следующее. История разворачивается постепенно.

**Лента снизу = autoplay-контролы + мини-таймлайн сюжета:** play/pause · шаг
вперёд/назад · скорость (1× / 1.5× / 2×) · скраб с маркерами событий (клик =
переход) · подпись диапазона лет.

**Доступность:** при `prefers-reduced-motion` переходы мгновенные, без полётов.

## 5. Модель данных (статика, без бэкенда)

Каждый сюжет и период — типизированный JSON в репозитории; изображения в `/public`.
Схемы валидируются `zod` на сборке.

```ts
type Period = {
  id: string;                 // "antiquity"
  title: string;              // "Античность"
  yearsLabel: string;         // "800 до н.э. – 500 н.э."
  yearStart: number;          // -800  (до н.э. = отрицательные)
  yearEnd: number;            // 500
  description: string;
  cover: string;              // путь к изображению
  storyIds: string[];
};

type Story = {
  id: string;                 // "alexander"
  periodId: string;           // "antiquity"
  title: string;              // "Завоевания Александра"
  yearsLabel: string;
  yearStart: number;
  yearEnd: number;
  summary: string;
  cover: string;
  map: { center: [number, number]; zoom: number };  // начальный вид
  events: Event[];
  route?: [number, number][]; // опц.: явная линия; иначе строится по событиям
};

type Event = {
  id: string;
  order: number;              // порядок в autoplay
  year: number;              // числовой ключ сортировки (BC = отрицательный)
  dateLabel: string;          // "331 до н.э."
  title: string;
  coords: [number, number];   // [lng, lat]
  summary: string;            // короткое (для пика на карте)
  body: string;               // markdown, 2–4 абзаца
  image?: string;
  sources?: string[];
  links?: { label: string; url: string }[];
};
```

Раскладка: `content/periods/*.json`, `content/stories/*.json`, картинки в
`public/stories/<storyId>/`. Next.js на сборке читает JSON и генерит маршруты через
`generateStaticParams`.

## 6. Арт-дирекшн — «Кодекс» (как тема shadcn)

Выбран ключ **A · Кодекс**: тёмно-золотой, серифные заголовки, премиально-эпично.
Реализуется как **тема токенов shadcn** (CSS-переменные) + кастомный стиль карты —
без бэкенда и без тяжёлого кода.

**Токены (ориентир, точные значения тюнингуем в реализации):**

| Токен | Значение | Назначение |
|-------|----------|-----------|
| `--background` | `#0d0b07` | тёплый почти-чёрный фон |
| `--foreground` | `#e9dcc3` | пергаментный текст |
| `--card` | `#14110b` | поверхности карточек/панелей |
| `--primary` | `#e8c074` → `#c9952f` | золото (кнопки, активные акценты) |
| `--primary-foreground` | `#160f02` | текст на золоте |
| `--muted-foreground` | `#9a886a` | вторичный текст |
| `--border` | `#2a2114` | бордеры |
| `--radius` | `~10px` | скругление |

**Шрифты:** серифный дисплейный для заголовков (напр. EB Garamond / Cormorant,
fallback Georgia); системный/Inter для контролов и UI.

**Стиль карты (MapLibre):** тёмная сине-зелёная суша/вода, приглушённо, минимум
подписей; золотые акценты для событий и маршрута. Базовый слой для P1 — открытый
векторный basemap, перекрашенный под «Кодекс» (точный источник — §11).

## 7. Технологический стек (P1)

- **Next.js (App Router) + TypeScript**, полностью статично (SSG).
- **Tailwind CSS + shadcn/ui** (Sheet/Drawer, Button, Card, Badge, Slider, Tooltip,
  Dialog). Композим существующие компоненты перед написанием своих.
- **MapLibre GL JS** для карты (кастомный стиль).
- **zod** — схемы и валидация контента на сборке.
- Лёгкий стор для движка autoplay (React state или Zustand — на усмотрение).
- Деплой: Vercel (или Cloudflare Pages).
- Весь код, комментарии и техдокументация — на английском (см. `CLAUDE.md`).

## 8. Скоуп P1 (что реально шипим)

**В P1:**
- Одно статическое Next.js-приложение, без БД/API.
- 1 период + 1–2 полностью собранных сюжета (напр. Античность → Завоевания
  Александра, 10–14 событий).
- 3 экрана: Главная / Период / Сюжет.
- Карта (MapLibre, стиль «Кодекс») + маркеры событий + панель события + autoplay +
  скраб-таймлайн.
- Базовая адаптивность (на мобиле панель → нижний шит).
- Тема shadcn «Кодекс».
- Деплой в прод (Vercel).

**Явно НЕ в P1:** PostGIS/API · пайплайн векторных тайлов (PMTiles/tippecanoe) ·
границы и великие державы как слой · RAG «Спросить ИИ» · торговые пути/миграции ·
аккаунты · монетизация/B2B/embed · programmatic-SEO «в масштабе».

## 9. Роадмап (P2+)

- **P2 — данные и бэкбон:** PostGIS как source of truth; перенос контента из
  статики; API; начало пайплайна тайлов.
- **P3 — карта вглубь:** великие державы и их temporal-границы как слой; торговые
  пути и миграции; «размытые» границы для древних эпох.
- **P4 — магия:** RAG-компаньон «Спросить ИИ» (pgvector + Wikipedia/Wikidata);
  «кликни в точку в году X — получи рассказ».
- **P5 — продукт:** аккаунты; монетизация (pro-подписка, B2B для образования,
  embed-виджеты); programmatic-SEO в масштабе.

## 10. Критерии успеха P1

- Одна опубликованная ссылка в проде (Vercel).
- Минимум один полностью собранный сюжет, проходимый из конца в конец: свободный
  просмотр **и** autoplay.
- Навигация Главная → Период → Сюжет работает на SSG.
- Визуально ощущается премиально (Кодекс), не «дженерик».
- Адаптивно (desktop + базовый mobile).

## 11. Открытые решения (отложены на реализацию)

- Точный источник базового слоя карты (OpenFreeMap / MapTiler / самохост Natural
  Earth) и финальный стиль MapLibre.
- Маркеры событий: HTML-маркеры (дефолт P1) vs GeoJSON-слой (если потребуется
  производительность).
- Глубина текста события: коротко на карте vs статья (дефолт — средне: 2–4 абзаца +
  изображение + источники).
- Конкретный серифный шрифт.
- Глубина мобильного autoplay.

## 12. Тестирование (легко, под P1)

- `zod`-валидация всех JSON контента на сборке (+ тест, падающий на битом датасете).
- Юнит-тесты движка autoplay: порядок событий, шаг вперёд/назад, сортировка по
  `year` с учётом BC (отрицательные).
- Компонентные тесты: панель события, скраб-таймлайн.
- Ручной QA визуала и поведения карты.

---

# Part 2 — English version

## 1. Concept

**Mercator is an interactive historical atlas of epochs.** History is split into
**periods**; inside periods live narrative **stories**; each story is experienced on
a map through **events** and a cinematic **autoplay** mode.

The key edge over competitors (GeaCron, Running Reality, OpenHistoricalMap) is
**premium UX and an atmospheric map**, where they offer raw GIS, a dead project, or
academic dryness. The audience — history / CK / Civ fans — is large and willing to
pay.

**Project priority:** speed to a working demo in production. Depth, backend, and the
"magic" are layered in iteratively.

## 2. Content model (3 levels)

| Level | What it is | Role |
|-------|------------|------|
| **Period** | A broad era (Antiquity, Middle Ages, Early Modern) | Grouping showcase on the home page |
| **Story** | A narrative arc inside a period ("Alexander's Conquests") | Content unit: map + events + autoplay. = one hand-curated dataset |
| **Event** | A point on the map inside a story ("Battle of Gaugamela") | An expandable interactive section with information |

Map and autoplay live at the **story** level. A period is a navigational wrapper.
The hand-curated dataset the maintainer builds equals one story.

## 3. Information architecture (screens)

1. **Home** (`/`) — showcase of periods as cards.
2. **Period page** (`/[period]`) — period hero + showcase of its stories (chapters).
3. **Story page** (`/[period]/[story]`) — the core of the app (see §4).

Every screen is a static Next.js page (SSG). Side benefit: free programmatic SEO
(pages like "map of Alexander's conquests") with no backend.

## 4. Core — the story page

A full-screen stylized map + an event panel + an autoplay bar.

**Map.** MapLibre GL with a custom style (see §6). Events are markers on the map.
For P1, HTML markers (easier to style and animate; ~10–20 events per story). A route
line (dashed, gold) connects events in order.

**Marker states:** past (dimmed) · active (glowing) · future (barely visible during
autoplay; normal during free browsing).

**Event panel.** Clicking a marker opens a right-side panel (desktop) or a bottom
sheet (mobile) built on shadcn `Sheet`/`Drawer`. The map flies to the event
(`flyTo`). Panel content: date · title · image · text (2–4 paragraphs) · sources ·
links · a placeholder for an "Ask AI" button (the feature itself is P2).

**Two modes:**
- **Free browsing** — all events visible; click any to read.
- **Autoplay (tour)** — the camera visits events one by one: `flyTo` → marker
  appears → panel reveals content → dwell N seconds → route segment is drawn → next.
  The story unfolds progressively.

**Bottom bar = autoplay controls + a story mini-timeline:** play/pause · step
forward/back · speed (1× / 1.5× / 2×) · a scrubber with event markers (click to
jump) · a year-range label.

**Accessibility:** with `prefers-reduced-motion`, transitions are instant, no
fly-overs.

## 5. Data model (static, no backend)

Each story and period is typed JSON in the repo; images live in `/public`. Schemas
are validated with `zod` at build time.

```ts
type Period = {
  id: string;                 // "antiquity"
  title: string;              // "Antiquity"
  yearsLabel: string;         // "800 BCE – 500 CE"
  yearStart: number;          // -800  (BCE = negative)
  yearEnd: number;            // 500
  description: string;
  cover: string;              // image path
  storyIds: string[];
};

type Story = {
  id: string;                 // "alexander"
  periodId: string;           // "antiquity"
  title: string;              // "Alexander's Conquests"
  yearsLabel: string;
  yearStart: number;
  yearEnd: number;
  summary: string;
  cover: string;
  map: { center: [number, number]; zoom: number };  // initial view
  events: Event[];
  route?: [number, number][]; // optional explicit line; else built from events
};

type Event = {
  id: string;
  order: number;              // autoplay order
  year: number;              // numeric sort key (BCE = negative)
  dateLabel: string;          // "331 BCE"
  title: string;
  coords: [number, number];   // [lng, lat]
  summary: string;            // short (for the on-map peek)
  body: string;               // markdown, 2–4 paragraphs
  image?: string;
  sources?: string[];
  links?: { label: string; url: string }[];
};
```

Layout: `content/periods/*.json`, `content/stories/*.json`, images in
`public/stories/<storyId>/`. At build, Next.js reads the JSON and generates routes
via `generateStaticParams`.

## 6. Art direction — "Codex" (as a shadcn theme)

Chosen key **A · Codex**: dark-and-gold, serif headings, premium and epic.
Implemented as a **shadcn token theme** (CSS variables) + a custom map style — no
backend, no heavy code.

**Tokens (reference; exact values tuned in implementation):**

| Token | Value | Purpose |
|-------|-------|---------|
| `--background` | `#0d0b07` | warm near-black background |
| `--foreground` | `#e9dcc3` | parchment text |
| `--card` | `#14110b` | card/panel surfaces |
| `--primary` | `#e8c074` → `#c9952f` | gold (buttons, active accents) |
| `--primary-foreground` | `#160f02` | text on gold |
| `--muted-foreground` | `#9a886a` | secondary text |
| `--border` | `#2a2114` | borders |
| `--radius` | `~10px` | rounding |

**Fonts:** a serif display for headings (e.g. EB Garamond / Cormorant, fallback
Georgia); a system/Inter sans for controls and UI.

**Map style (MapLibre):** dark teal-navy land/water, muted, minimal labels; gold
accents for events and route. The P1 basemap is an open vector basemap recolored to
"Codex" (exact source — §11).

## 7. Tech stack (P1)

- **Next.js (App Router) + TypeScript**, fully static (SSG).
- **Tailwind CSS + shadcn/ui** (Sheet/Drawer, Button, Card, Badge, Slider, Tooltip,
  Dialog). Compose existing components before writing new ones.
- **MapLibre GL JS** for the map (custom style).
- **zod** — content schemas and build-time validation.
- A light store for the autoplay engine (React state or Zustand — implementer's
  choice).
- Deploy: Vercel (or Cloudflare Pages).
- All code, comments, and technical documentation in English (see `CLAUDE.md`).

## 8. P1 scope (what we actually ship)

**In P1:**
- One static Next.js app, no DB/API.
- 1 period + 1–2 fully curated stories (e.g. Antiquity → Alexander's Conquests,
  10–14 events).
- 3 screens: Home / Period / Story.
- Map (MapLibre, "Codex" style) + event markers + event panel + autoplay + scrubber
  timeline.
- Basic responsiveness (on mobile the panel becomes a bottom sheet).
- shadcn "Codex" theme.
- Deploy to production (Vercel).

**Explicitly NOT in P1:** PostGIS/API · vector tile pipeline (PMTiles/tippecanoe) ·
borders and great powers as a layer · RAG "Ask AI" · trade routes/migrations ·
accounts · monetization/B2B/embed · programmatic SEO "at scale".

## 9. Roadmap (P2+)

- **P2 — data & backbone:** PostGIS as the source of truth; migrate content off
  static files; API; start the tile pipeline.
- **P3 — deeper map:** great powers and their temporal borders as a layer; trade
  routes and migrations; "fuzzy" borders for ancient eras.
- **P4 — magic:** the "Ask AI" RAG companion (pgvector + Wikipedia/Wikidata); "click
  a point in year X, get a narrative".
- **P5 — product:** accounts; monetization (pro subscription, education B2B, embed
  widgets); programmatic SEO at scale.

## 10. P1 success criteria

- One published URL in production (Vercel).
- At least one fully curated story, playable end to end: free browsing **and**
  autoplay.
- Home → Period → Story navigation works on SSG.
- Visually feels premium ("Codex"), not generic.
- Responsive (desktop + basic mobile).

## 11. Open decisions (deferred to implementation)

- The exact map basemap source (OpenFreeMap / MapTiler / self-hosted Natural Earth)
  and the final MapLibre style.
- Event markers: HTML markers (P1 default) vs a GeoJSON layer (if performance
  requires).
- Event text depth: short on-map vs article (default — medium: 2–4 paragraphs +
  image + sources).
- The specific serif font.
- Mobile autoplay depth.

## 12. Testing (light, suited to P1)

- `zod` validation of all content JSON at build (+ a test that fails on a broken
  dataset).
- Unit tests for the autoplay engine: event ordering, step forward/back, sorting by
  `year` including BCE (negatives).
- Component tests: the event panel, the scrubber timeline.
- Manual QA of map visuals and behavior.
