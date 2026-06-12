# Mercator

Interactive historical atlas. History is divided into **periods** → **stories**
(narrative chapters) → **events** (points on a map). Each story is experienced on a
stylized map with a cinematic **autoplay** tour.

Full concept and scope live in `docs/superpowers/specs/`.

## Conventions

### Language
- All code, comments, identifiers, commit messages, and in-repo technical/code
  documentation are written in **English**. No exceptions.
- Product and design discussion with the maintainer happens in Russian; that does
  not change the rule above for anything committed to the repo.

### UI components
- Use **shadcn/ui** as the component set (Radix primitives + Tailwind CSS).
- Compose existing shadcn components before hand-rolling new UI.

## Stack (P1 — planned)
- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- MapLibre GL JS for the map
- Fully static (SSG): datasets are hand-curated JSON in the repo, no backend/DB in P1
