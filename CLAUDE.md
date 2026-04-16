# CLAUDE.md

## Project description

Fretboard Learner is a React/TypeScript web application that helps guitarists memorize the fretboard. It renders a 2D SVG fretboard with a CSS 2.5D perspective transform, listens to the user's guitar through the microphone using the Web Audio API, and runs the user through note-identification exercises in the browser — no Python, no terminal, no system dependencies.

This is a ground-up rewrite of a Python CLI prototype that used `aubio` and `rich`. The reference implementation lives in the Python files at the repo root and is the source of truth for music theory logic and pitch aggregation behaviour.

## PRD summary

Full PRD: [issue #1](https://github.com/kmb5/fretboard-learner/issues/1)

**Two game modes:**
- *Random Notes on a String* — pick one of the 6 strings; the app gives you random notes on that string
- *Random Notes in a Scale* — pick a root key and scale type; notes span the full neck

**Two difficulty levels:**
- *Learning* — fretboard highlights all valid positions for the target note in amber
- *Practice* — only the note name is shown; player must recall positions from memory

**Feedback loop:** the app detects pitch in real time via the Web Audio API (Pitchy library, McLeod method, 10-frame aggregation window). Correct note → green flash + auto-advance after ~800 ms. Wrong note → red flash + stays on the same note until correct.

**Key constraints:**
- Horizontal fretboard, frets 0–12, landscape-only on mobile
- Note matching strips octave (matches `"F#"` not `"F#3"`)
- Mic access requested lazily on session start, not on page load
- No backend, no persistence, no accounts

## Architecture

| Module | Role |
|--------|------|
| `MusicTheory` | Pure TS port of `objects.py`/`helpers.py`. All note/scale/position data |
| `PitchDetector` | Web Audio API + Pitchy. Injectable source for testing |
| `FretboardSVG` | Presentational SVG component. Receives `highlights` prop |
| `GameMode` | Interface + `RandomStringMode` / `ScaleMode` implementations |
| `GameSession` | React Context + useReducer. Owns all session state |
| UI components | `ModeSelector`, `GameScreen`, `MicPermissionPrompt`, `PortraitOverlay` |

State shape: `{ status: 'idle' | 'waiting' | 'correct' | 'wrong', currentNote, score, difficulty }`

## Build commands

```bash
pnpm dev        # dev server
pnpm build      # tsc + vite build
pnpm test       # vitest run
```

## Open issues

| # | Slice | Blocked by |
|---|-------|------------|
| [#3](https://github.com/kmb5/fretboard-learner/issues/3) | MusicTheory module | — |
| [#4](https://github.com/kmb5/fretboard-learner/issues/4) | PitchDetector module | — |
| [#5](https://github.com/kmb5/fretboard-learner/issues/5) | FretboardSVG component | — |
| [#6](https://github.com/kmb5/fretboard-learner/issues/6) | GameMode + GameSession reducer | #3 |
| [#7](https://github.com/kmb5/fretboard-learner/issues/7) | ModeSelector UI | #5, #6 |
| [#8](https://github.com/kmb5/fretboard-learner/issues/8) | GameScreen + full Random String integration | #4, #7 |
| [#9](https://github.com/kmb5/fretboard-learner/issues/9) | Scale mode | #8 |
| [#10](https://github.com/kmb5/fretboard-learner/issues/10) | Mobile / portrait support | #8 |
