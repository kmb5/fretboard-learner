# CLAUDE.md

## Project description

Fretboard Learner is a React/TypeScript web application that helps guitarists memorize the fretboard. It renders a 2D SVG fretboard with a CSS 2.5D perspective transform, listens to the user's guitar through the microphone using the Web Audio API, and runs the user through note-identification exercises in the browser — no Python, no terminal, no system dependencies.

## PRD summary

Full PRD: [issue #1](https://github.com/kmb5/fretboard-learner/issues/1)

**Three game modes:**
- *Random Notes on a String* — pick one of the 6 strings (or all strings); the app gives you random notes on that string; supports a NoteFilter (`naturals` / `sharps` / `all`)
- *Random Notes in a Scale* — pick a root key and scale type (7 scale types); notes span the full neck
- *Chord Tones* — pick a root key and chord type (7 chord types); notes are drawn from that chord

**Two difficulty levels:**
- *Learning* — fretboard highlights all valid positions for the target note in amber
- *Practice* — only the note name is shown; player must recall positions from memory

**Feedback loop:** the app detects pitch in real time via the Web Audio API (Pitchy library, McLeod method, 10-frame aggregation window with amplitude gating). Correct note → green flash + auto-advance after 1100 ms. Wrong note → red flash + stays on the same note until correct.

**Key constraints:**
- Horizontal fretboard, frets 0–12, landscape-only on mobile
- Note matching strips octave and normalises to canonical sharp form (e.g. `"Db"` → `"C#"`)
- Mic access requested lazily on session start, not on page load
- No backend, no persistence, no accounts

## Architecture

| Module | Role |
|--------|------|
| `MusicTheory` | Pure TS note/scale/chord/position data. Enharmonic helpers (`toCanonicalSharp`, `SHARP_TO_FLAT`, `FLAT_PREFERRED_ROOTS`) |
| `PitchDetector` | Web Audio API + Pitchy. 10-frame window, clarity ≥ 0.9, amplitude gate, guitar range 70–1400 Hz. Injectable `AudioSource` for testing |
| `FretboardSVG` | Presentational SVG component. `highlights` prop drives amber/green/red positions. `isLeftHanded` prop flips string order |
| `GameMode` | Interface + `RandomStringMode` / `ScaleMode` / `ChordTonesMode` implementations. All registered in `GAME_MODE_ENTRIES` |
| `GameSession` | Pure reducer (`GameSession.ts`) + `GameSessionProvider` context. Owns all session state and the advance timer |
| `useTheme` | Dark/light theme toggle. Writes `data-theme` to `<html>`, persists to localStorage |
| `usePreferences` | Handedness toggle (`isLeftHanded`). localStorage + custom event dispatch for cross-component sync |
| UI components | `ModeSelector`, `GameScreen`, `AppHeader`, `SettingsModal`, `MicPermissionPrompt`, `PortraitOverlay` |

State shape: `{ status: 'idle' | 'waiting' | 'correct' | 'wrong', currentNote, score, difficulty }`

CSS theme system uses vars (`--bg`, `--fg`, `--fg-2`, `--fg-3`, `--border`, `--amber-hl`, `--green`, `--red`, `--amber`) driven by `data-theme` on `documentElement`.

## Package manager

This repo enforces **pnpm**. Always use `pnpm` — never `npm` or `yarn`. The `preinstall` script will reject other package managers.

## Build commands

```bash
pnpm install    # install dependencies
pnpm dev        # dev server
pnpm build      # tsc + vite build
pnpm test       # vitest run
pnpm lint       # eslint across all TS/TSX files
```

A Husky pre-commit hook runs `lint-staged`, which lints staged `.ts`/`.tsx` files before every commit.

## Deployment

CI/CD via GitHub Actions (`.github/workflows/deploy.yml`). On every push to `master`:
1. `pnpm lint` → `pnpm test` → `pnpm build` (must all pass)
2. Built `dist/` is deployed to GitHub Pages at `https://kmb5.github.io/fretboard-learner/`

`vite.config.ts` sets `base: '/fretboard-learner/'` automatically when `GITHUB_ACTIONS=true`. PRs run lint + test but do not deploy.

## Issues

All original implementation slices are complete.

| # | Slice | Status |
|---|-------|--------|
| [#3](https://github.com/kmb5/fretboard-learner/issues/3) | MusicTheory module | ✅ closed |
| [#4](https://github.com/kmb5/fretboard-learner/issues/4) | PitchDetector module | ✅ closed |
| [#5](https://github.com/kmb5/fretboard-learner/issues/5) | FretboardSVG component | ✅ closed |
| [#6](https://github.com/kmb5/fretboard-learner/issues/6) | GameMode + GameSession reducer | ✅ closed |
| [#7](https://github.com/kmb5/fretboard-learner/issues/7) | ModeSelector UI | ✅ closed |
| [#8](https://github.com/kmb5/fretboard-learner/issues/8) | GameScreen + Random String integration | ✅ closed |
| [#9](https://github.com/kmb5/fretboard-learner/issues/9) | Scale mode | ✅ closed |
| [#10](https://github.com/kmb5/fretboard-learner/issues/10) | Mobile / portrait support | ✅ closed |
