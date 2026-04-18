import { NOTES_PER_STRING, getNotesInScale } from '../music-theory/MusicTheory'
import type { StringName, ScaleType, NoteName } from '../music-theory/MusicTheory'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Difficulty = 'learning' | 'practice'

export interface GameModeConfig {
  label: string
}

// ---------------------------------------------------------------------------
// GameMode interface
// ---------------------------------------------------------------------------

export interface GameMode {
  /** Pick the next target note (octave-stripped, e.g. "F#"). */
  getNextNote(): string
  /**
   * Return true if `played` (octave-stripped) matches the current target.
   * Called by GameSession on every confirmed pitch event.
   */
  isValidAnswer(played: string): boolean
  /** Metadata about this mode (used by UI). */
  getConfig(): GameModeConfig
}

// ---------------------------------------------------------------------------
// RandomStringMode
// ---------------------------------------------------------------------------

/**
 * Picks random notes from the note pool of a single string (frets 0–12).
 * Octave is stripped before comparison so e.g. "E4" and "E2" both match "E".
 */
export class RandomStringMode implements GameMode {
  private readonly string: StringName
  private readonly notePool: string[]
  private currentNote = ''

  constructor(string: StringName) {
    this.string = string
    // Build a deduplicated, octave-stripped pool from the string's 13 fret notes.
    const seen = new Set<string>()
    this.notePool = NOTES_PER_STRING[string]
      .map((n) => n.replace(/\d+$/, ''))
      .filter((n) => {
        if (seen.has(n)) return false
        seen.add(n)
        return true
      })
  }

  getNextNote(): string {
    this.currentNote = this.pickRandom()
    return this.currentNote
  }

  isValidAnswer(played: string): boolean {
    return played === this.currentNote
  }

  getConfig(): GameModeConfig {
    return { label: `Random notes on ${this.string} string` }
  }

  private pickRandom(): string {
    return this.notePool[Math.floor(Math.random() * this.notePool.length)]
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
  private readonly key: NoteName
  private readonly scale: ScaleType
  private readonly notePool: string[]
  private currentNote = ''

  constructor(key: NoteName, scale: ScaleType) {
    this.key = key
    this.scale = scale
    this.notePool = getNotesInScale(key, scale)
  }

  getNextNote(): string {
    this.currentNote = this.notePool[Math.floor(Math.random() * this.notePool.length)]
    return this.currentNote
  }

  isValidAnswer(played: string): boolean {
    return played === this.currentNote
  }

  getConfig(): GameModeConfig {
    return { label: `${this.key} ${SCALE_LABELS[this.scale]}` }
  }
}
