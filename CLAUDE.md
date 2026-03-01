# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Test Commands

```bash
pnpm dev          # Dev server at localhost:5173
pnpm build        # Static build to build/
pnpm preview      # Preview production build
pnpm check        # svelte-check + TypeScript
pnpm test         # Run all tests (vitest run)
pnpm test:watch   # Tests in watch mode
```

Run a single test file: `pnpm vitest run src/tests/grouping.test.ts`

## Architecture

SvelteKit 5 static site with three tools: GroupThing (random group generator), Piano (keyboard + staff composer), and planned Quiz Maker / Classroom Timer. No backend -- all data lives in localStorage.

### Stack

- **SvelteKit 5** with Svelte runes (`$state`, `$derived`, `$effect`, `$props`)
- **Tailwind CSS 4** with custom theme variables defined in `src/app.css`
- **TypeScript** strict mode
- **Vitest** for unit tests
- **adapter-static** -- prerendered, deployed to GitHub Pages with optional `BASE_PATH`

### State Management

`src/lib/stores/storage.svelte.ts` is the single reactive store for GroupThing data (class lists, groups, blacklists). Uses Svelte 5 runes internally, persists to localStorage on every mutation. Piano settings are persisted separately via `piano-data.ts` and `composer-data.ts` utility functions.

Toast notifications are also managed in the storage module (`addToast`/`removeToast`).

### Key Architectural Decisions

- **Piano audio**: Web Audio API with ADSR envelope. Each note is a fresh oscillator+gain pair for polyphony. iOS Safari requires an audio unlock (silent buffer played on first user gesture) -- see `src/lib/utils/audio.ts`.
- **Staff composer**: SVG-based with a dynamic `viewBox` width that grows as notes are placed. Uses pitch resolution functions (`resolveFullStavePitch`, etc.) that snap click/hover Y coordinates to diatonic staff positions.
- **Group generation**: Fisher-Yates shuffle with constraint validation (blacklisted pairs). Retries up to 50 times with fresh shuffles if constraints can't be satisfied.
- **Shareable groups**: Student group data is Base64-encoded into URL query params for the student view.

### Component Patterns

Props use TypeScript interfaces with `$props()`. Children use the `Snippet` type. Event callbacks follow `on{event}` naming (e.g. `onnotestart`, `onchange`). Icons from `lucide-svelte`. Advanced UI from `bits-ui`.

### Theming

Custom CSS properties in `src/app.css` under `@theme`. Group colours (8 hues with `/15` opacity variants), piano note colours (Boomwhacker-inspired: C=red through B=magenta), brand colour (indigo). Fonts: Montserrat (titles), Quicksand (group names).

### Deployment

Static site via GitHub Actions (`.github/workflows/deploy.yml`). `BASE_PATH` env var sets SvelteKit's `paths.base` for GitHub Pages subpath hosting. Font files in `static/fonts/` are referenced with absolute `/fonts/...` paths in CSS -- Vite rewrites these to relative paths in the build output, so they work regardless of base path.

## Conventions

- Australian English spelling throughout (colour, organise, centre, etc.)
- Component files: PascalCase. Utilities: camelCase files.
- Tests in `src/tests/` with `.test.ts` suffix. Arrange-Act-Assert pattern.
- Piano key heights and black key offsets use responsive breakpoints (640px) via CSS custom properties.
