// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ScaleType =
  | 'major'
  | 'natural_minor'
  | 'augmented'
  | 'blues'
  | 'major_pentatonic'
  | 'minor_pentatonic'
  | 'phrygian_dominant'

export type StringName = 'e' | 'B' | 'G' | 'D' | 'A' | 'E'

export interface FretboardPosition {
  string: StringName
  fret: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const

// Interval patterns: each digit is semitone steps to the next scale degree.
// Last digit brings you back to the root (octave) and is handled separately.
export const SCALES: Record<ScaleType, string> = {
  major: '2212221',
  natural_minor: '2122122',
  augmented: '313131',
  blues: '321132',
  major_pentatonic: '22323',
  minor_pentatonic: '32232',
  phrygian_dominant: '1312122',
}

// Standard tuning, frets 0–12 (13 notes per string).
export const NOTES_PER_STRING: Record<StringName, string[]> = {
  e: ['E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4', 'C5', 'C#5', 'D5', 'D#5', 'E5'],
  B: ['B3', 'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4'],
  G: ['G3', 'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4'],
  D: ['D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3', 'C4', 'C#4', 'D4'],
  A: ['A2', 'A#2', 'B2', 'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3'],
  E: ['E2', 'F2', 'F#2', 'G2', 'G#2', 'A2', 'A#2', 'B2', 'C3', 'C#3', 'D3', 'D#3', 'E3'],
}

// ---------------------------------------------------------------------------
// pitch2note
// ---------------------------------------------------------------------------

const A4_HZ = 440
const C0_HZ = A4_HZ * Math.pow(2, -4.75)

/**
 * Convert a frequency (Hz) to a note name, stripping the octave.
 * Matches the Python helpers.pitch2note() behaviour.
 */
export function pitch2note(freq: number): string {
  const h = Math.round(12 * Math.log2(freq / C0_HZ))
  // Use positive modulo so negative h values still index correctly
  const n = ((h % 12) + 12) % 12
  return NOTE_NAMES[n]
}

// ---------------------------------------------------------------------------
// getNotesInScale
// ---------------------------------------------------------------------------

/**
 * Return the unique set of note names that belong to the given scale/key.
 *
 * Algorithm ported from Scale.get_notes() in objects.py:
 * - Build a long note list starting from the key.
 * - Walk through the interval pattern, advancing the cursor by the step value
 *   each time and collecting the note at the new position.
 * - The last digit of every pattern returns to the octave root, so we use
 *   pattern.slice(0, -1) (all but the last step) to produce the 7 (or 5/6)
 *   unique degrees, then deduplicate with a Set.
 */
export function getNotesInScale(key: string, scale: ScaleType): string[] {
  // Drop the final interval (which would loop back to the root an octave up)
  const pattern = SCALES[scale].slice(0, -1)

  const startIdx = NOTE_NAMES.indexOf(key as (typeof NOTE_NAMES)[number])

  // Build a list 3× the chromatic scale long, starting from the key
  let remaining: string[] = [
    ...NOTE_NAMES.slice(startIdx),
    ...NOTE_NAMES,
    ...NOTE_NAMES,
  ]

  const notes: string[] = [key]

  for (const stepChar of pattern) {
    const step = parseInt(stepChar, 10)
    remaining = remaining.slice(step)
    notes.push(remaining[0])
  }

  // Deduplicate while preserving order (root should not appear twice)
  return [...new Set(notes)]
}

// ---------------------------------------------------------------------------
// getAllPositionsForNote
// ---------------------------------------------------------------------------

/**
 * Return every { string, fret } position where the given note (octave-stripped)
 * appears across the full 6-string fretboard (frets 0–12).
 */
export function getAllPositionsForNote(note: string): FretboardPosition[] {
  const positions: FretboardPosition[] = []

  for (const [stringName, fretNotes] of Object.entries(NOTES_PER_STRING)) {
    fretNotes.forEach((fretNote, fretIndex) => {
      // Strip octave digit(s) from the fret note, e.g. 'F#4' → 'F#'
      const noteName = fretNote.replace(/\d+$/, '')
      if (noteName === note) {
        positions.push({ string: stringName as StringName, fret: fretIndex })
      }
    })
  }

  return positions
}
