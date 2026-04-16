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
- pnpm (`npm install -g pnpm`)

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

## Tech stack

- **Vite** + **React** + **TypeScript**
- **Tailwind CSS** for layout and UI
- **Pitchy** (McLeod pitch method) for pitch detection
- **Vitest** + **React Testing Library** for tests

## Project structure

```
src/
  App.tsx              # Root component
  index.css            # Global styles + Tailwind import
  main.tsx             # Entry point
  test/                # Test setup and app-level tests
```

More modules will be added as implementation slices are completed. See [CLAUDE.md](./CLAUDE.md) for the full build plan.
