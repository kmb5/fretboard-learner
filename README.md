# Fretboard Learner

A browser-based guitar fretboard memorization tool. The app renders a visual SVG fretboard, listens to your guitar through the microphone, and runs you through note-identification exercises — no installation required.

## Features

- Two game modes: **Random Notes on a String** and **Random Notes in a Scale**
- Two difficulty levels: **Learning** (highlights all valid positions) and **Practice** (note name only)
- Real-time pitch detection via the Web Audio API
- 7 scale types across all 12 chromatic root keys
- Instant green/red feedback on the fretboard

## Requirements

- Node.js 18+
- pnpm — this repo enforces pnpm as the package manager. Install it with `npm install -g pnpm` if you don't have it.

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. Allow microphone access when prompted, then pick a mode and start playing.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start the development server |
| `pnpm build` | Type-check and build for production |
| `pnpm preview` | Preview the production build locally |
| `pnpm test` | Run the test suite (Vitest) |
| `pnpm lint` | Run ESLint across all TypeScript files |

A pre-commit hook (Husky + lint-staged) runs ESLint automatically on staged `.ts`/`.tsx` files before every commit.

## Tech stack

- **Vite** + **React** + **TypeScript**
- **Tailwind CSS** for layout and UI
- **Pitchy** (McLeod pitch method) for pitch detection
- **Vitest** + **React Testing Library** for tests

## Project structure

```
src/
  App.tsx                   # Root component
  index.css                 # Global styles + Tailwind import
  main.tsx                  # Entry point
  fretboard/
    FretboardSVG.tsx        # Presentational SVG fretboard component
  music-theory/
    MusicTheory.ts          # Pure TS: notes, scales, fretboard positions
  pitch-detector/
    PitchDetector.ts        # Web Audio API + Pitchy pitch detection
  test/                     # Test setup and app-level tests
```

See [CLAUDE.md](./CLAUDE.md) for the full build plan and issue status.
