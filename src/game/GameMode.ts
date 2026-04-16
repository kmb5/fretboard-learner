import { NOTES_PER_STRING } from '../music-theory/MusicTheory'
import type { StringName } from '../music-theory/MusicTheory'

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
  private currentNote: string

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
    this.currentNote = this.pickRandom()
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
