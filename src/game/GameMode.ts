import {
  NOTES_PER_STRING,
  NOTE_NAMES,
  getNotesInScale,
  getChordTones,
  NATURAL_NOTES,
  SHARP_TO_FLAT,
  toCanonicalSharp,
  FLAT_PREFERRED_ROOTS,
} from '../music-theory/MusicTheory'
import type { StringName, ScaleType, ChordType, NoteName } from '../music-theory/MusicTheory'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Difficulty = 'learning' | 'practice'
export type NoteFilter = 'naturals' | 'sharps' | 'all'

export interface GameModeConfig {
  label: string
}

// ---------------------------------------------------------------------------
// NotePool
// ---------------------------------------------------------------------------

/**
 * Holds a fixed set of candidate notes and tracks the current target.
 *
 * Centralises the three responsibilities that were duplicated across every
 * GameMode class:
 *   - randomly selecting the next target from the pool
 *   - storing the current target so isMatch() can compare against it
 *   - normalising enharmonic spellings before comparing
 *
 * The pool itself is built by each GameMode's constructor and injected here;
 * NotePool is intentionally unaware of how the pool was derived.
 */
export class NotePool {
  private readonly notes: string[]
  private currentNote = ''

  constructor(notes: string[]) {
    if (notes.length === 0) throw new Error('NotePool requires at least one note')
    this.notes = notes
  }

  /** Pick a random note from the pool, store it as current, and return it. */
  pick(): string {
    this.currentNote = this.notes[Math.floor(Math.random() * this.notes.length)]
    return this.currentNote
  }

  /**
   * Return true if `played` is an enharmonic match for the current target.
   * Both sides are normalised to canonical sharp form before comparison so
   * e.g. 'Bb' matches 'A#' and vice-versa.
   */
  isMatch(played: string): boolean {
    return toCanonicalSharp(played) === toCanonicalSharp(this.currentNote)
  }
}

// ---------------------------------------------------------------------------
// Mode registry
// ---------------------------------------------------------------------------

export const RANDOM_STRING_MODE_ID = 'random-string' as const
export const SCALE_MODE_ID = 'scale' as const
export const CHORD_TONES_MODE_ID = 'chord-tones' as const

/**
 * Ordered list of all registered game modes.
 * Add a new entry here when introducing a new mode; ModeSelector derives its
 * top-level toggle from this list so no UI changes are required for the toggle
 * itself (only the mode-specific config section below the toggle).
 */
export const GAME_MODE_ENTRIES = [
  { id: RANDOM_STRING_MODE_ID, label: 'Random String' },
  { id: SCALE_MODE_ID,         label: 'Scale' },
  { id: CHORD_TONES_MODE_ID,   label: 'Chord Tones' },
] as const

/** Union of all registered mode IDs, derived from the registry. */
export type GameModeId = typeof GAME_MODE_ENTRIES[number]['id']

// ---------------------------------------------------------------------------
// GameMode interface
// ---------------------------------------------------------------------------

export interface GameMode {
  /** Stable unique identifier matching an entry in GAME_MODE_ENTRIES. */
  readonly id: string
  /** Pick the next target note (octave-stripped, e.g. "F#"). */
  getNextNote(): string
  /**
   * Return true if `played` (octave-stripped) matches the current target.
   * Called by GameSession on every confirmed pitch event.
   */
  isValidAnswer(played: string): boolean
  /** Metadata about this mode (used by UI). */
  getConfig(): GameModeConfig
  /**
   * Which guitar string to restrict highlight positions to.
   * Returns null when highlights should span all strings.
   */
  getStringFilter(): StringName | null
}

// ---------------------------------------------------------------------------
// RandomStringMode
// ---------------------------------------------------------------------------

/**
 * Picks random notes from the note pool of a single string (frets 0–12),
 * or from all 12 chromatic notes when `string` is null ("All strings").
 * Octave is stripped before comparison so e.g. "E4" and "E2" both match "E".
 */
export class RandomStringMode implements GameMode {
  readonly id = RANDOM_STRING_MODE_ID
  private readonly string: StringName | null
  private readonly pool: NotePool

  constructor(string: StringName | null, noteFilter: NoteFilter = 'sharps') {
    this.string = string

    // Build base pool: deduplicated octave-stripped notes for the string (or all 12).
    let basePool: string[]
    if (string === null) {
      basePool = [...NOTE_NAMES]
    } else {
      const seen = new Set<string>()
      basePool = NOTES_PER_STRING[string]
        .map((n) => n.replace(/\d+$/, ''))
        .filter((n) => {
          if (seen.has(n)) return false
          seen.add(n)
          return true
        })
    }

    // Apply filter.
    let notes: string[]
    if (noteFilter === 'naturals') {
      notes = basePool.filter((n) => NATURAL_NOTES.has(n))
    } else if (noteFilter === 'all') {
      // Include both sharp and flat names so each enharmonic can be the target.
      const pool: string[] = []
      for (const n of basePool) {
        pool.push(n)
        const flat = SHARP_TO_FLAT[n]
        if (flat) pool.push(flat)
      }
      notes = pool
    } else {
      // 'sharps' — original behaviour
      notes = basePool
    }

    this.pool = new NotePool(notes)
  }

  getNextNote(): string {
    return this.pool.pick()
  }

  isValidAnswer(played: string): boolean {
    return this.pool.isMatch(played)
  }

  getConfig(): GameModeConfig {
    return {
      label: this.string
        ? `Random notes on ${this.string} string`
        : 'Random notes on all strings',
    }
  }

  getStringFilter(): StringName | null {
    return this.string
  }
}

// ---------------------------------------------------------------------------
// ScaleMode
// ---------------------------------------------------------------------------

/** Human-readable label for each scale type (used by UI and getConfig). */
export const SCALE_LABELS: Record<ScaleType, string> = {
  major: 'Major',
  natural_minor: 'Natural Minor',
  augmented: 'Augmented',
  blues: 'Blues',
  major_pentatonic: 'Major Pentatonic',
  minor_pentatonic: 'Minor Pentatonic',
  phrygian_dominant: 'Phrygian Dominant',
}

/**
 * Ordered list of all supported scale types.
 * Explicit ordering controls display order in the UI; do not derive from
 * Object.keys(SCALE_LABELS) which would make order an implicit side effect
 * of insertion order in that record.
 */
export const SCALE_TYPES: ScaleType[] = [
  'major',
  'natural_minor',
  'blues',
  'major_pentatonic',
  'minor_pentatonic',
  'augmented',
  'phrygian_dominant',
]

/**
 * Picks random notes from the note pool of a given key + scale combination.
 * The pool is the set of unique note names in the scale (octave-stripped).
 * Because GameScreen uses getAllPositionsForNote(), every generated note
 * automatically spans all positions across the full neck.
 */
export class ScaleMode implements GameMode {
  readonly id = SCALE_MODE_ID
  private readonly key: NoteName
  private readonly scale: ScaleType
  private readonly pool: NotePool

  constructor(key: NoteName, scale: ScaleType) {
    this.key = key
    this.scale = scale
    const rawNotes = getNotesInScale(key, scale)
    const notes = FLAT_PREFERRED_ROOTS.has(key)
      ? rawNotes.map((n) => SHARP_TO_FLAT[n] ?? n)
      : rawNotes
    this.pool = new NotePool(notes)
  }

  getNextNote(): string {
    return this.pool.pick()
  }

  isValidAnswer(played: string): boolean {
    return this.pool.isMatch(played)
  }

  getConfig(): GameModeConfig {
    return { label: `${this.key} ${SCALE_LABELS[this.scale]}` }
  }

  getStringFilter(): StringName | null {
    return null
  }
}

// ---------------------------------------------------------------------------
// ChordTonesMode
// ---------------------------------------------------------------------------

/** Human-readable label for each chord type (used by UI and getConfig). */
export const CHORD_TYPE_LABELS: Record<ChordType, string> = {
  major:      'Major',
  minor:      'Minor',
  dominant7:  'Dominant 7',
  major7:     'Major 7',
  minor7:     'Minor 7',
  diminished: 'Diminished',
  augmented:  'Augmented',
}

/**
 * Ordered list of all supported chord types.
 * Triads first (major, minor), then seventh chords, then altered triads.
 */
export const CHORD_TYPES: ChordType[] = [
  'major',
  'minor',
  'dominant7',
  'major7',
  'minor7',
  'diminished',
  'augmented',
]

/**
 * Picks random notes from the tone pool of a given root key + chord type.
 * The pool contains only the chord's unique note names (3 or 4 notes).
 * Because GameScreen uses getAllPositionsForNote(), every note automatically
 * spans all positions across the full neck.
 */
export class ChordTonesMode implements GameMode {
  readonly id = CHORD_TONES_MODE_ID
  private readonly key: NoteName
  private readonly chord: ChordType
  private readonly pool: NotePool

  constructor(key: NoteName, chord: ChordType) {
    this.key = key
    this.chord = chord
    const rawNotes = getChordTones(key, chord)
    const notes = FLAT_PREFERRED_ROOTS.has(key)
      ? rawNotes.map((n) => SHARP_TO_FLAT[n] ?? n)
      : rawNotes
    this.pool = new NotePool(notes)
  }

  getNextNote(): string {
    return this.pool.pick()
  }

  isValidAnswer(played: string): boolean {
    return this.pool.isMatch(played)
  }

  getConfig(): GameModeConfig {
    return { label: `${this.key} ${CHORD_TYPE_LABELS[this.chord]}` }
  }

  getStringFilter(): StringName | null {
    return null
  }
}
