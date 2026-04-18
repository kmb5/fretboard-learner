import { describe, it, expect } from 'vitest'
import { RandomStringMode, ScaleMode, SCALE_TYPES } from './GameMode'
import { NOTES_PER_STRING, getNotesInScale } from '../music-theory/MusicTheory'
import type { StringName } from '../music-theory/MusicTheory'

const STRINGS: StringName[] = ['E', 'A', 'D', 'G', 'B', 'e']

describe('RandomStringMode — getNextNote', () => {
  it('always returns a note present in the string pool', () => {
    for (const string of STRINGS) {
      const mode = new RandomStringMode(string)
      const pool = new Set(
        NOTES_PER_STRING[string].map((n) => n.replace(/\d+$/, '')),
      )
      for (let i = 0; i < 50; i++) {
        expect(pool.has(mode.getNextNote())).toBe(true)
      }
    }
  })

  it('returns an octave-stripped note (no digits)', () => {
    const mode = new RandomStringMode('A')
    for (let i = 0; i < 20; i++) {
      expect(mode.getNextNote()).toMatch(/^[A-G]#?$/)
    }
  })
})

describe('RandomStringMode — isValidAnswer', () => {
  it('returns true when played note matches the current target', () => {
    const mode = new RandomStringMode('E')
    const target = mode.getNextNote()
    expect(mode.isValidAnswer(target)).toBe(true)
  })

  it('returns false for a different note', () => {
    const mode = new RandomStringMode('E')
    const target = mode.getNextNote()
    // Find any note that is not the target
    const pool = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const other = pool.find((n) => n !== target)!
    expect(mode.isValidAnswer(other)).toBe(false)
  })

  it('reflects the latest getNextNote call', () => {
    const mode = new RandomStringMode('G')
    const first = mode.getNextNote()
    // Advance until we get a different note (may take several calls)
    let second = first
    for (let i = 0; i < 100 && second === first; i++) {
      second = mode.getNextNote()
    }
    // isValidAnswer should now match the latest note, not the first
    expect(mode.isValidAnswer(second)).toBe(true)
  })
})

describe('RandomStringMode — getConfig', () => {
  it('includes the string name in the label', () => {
    for (const string of STRINGS) {
      const mode = new RandomStringMode(string)
      expect(mode.getConfig().label).toContain(string)
    }
  })
})

// ---------------------------------------------------------------------------
// ScaleMode
// ---------------------------------------------------------------------------

describe('ScaleMode — getNextNote', () => {
  it('always returns a note belonging to the configured scale', () => {
    for (const scale of SCALE_TYPES) {
      const mode = new ScaleMode('C', scale)
      const pool = new Set(getNotesInScale('C', scale))
      for (let i = 0; i < 50; i++) {
        expect(pool.has(mode.getNextNote())).toBe(true)
      }
    }
  })

  it('returns an octave-stripped note (no digits)', () => {
    const mode = new ScaleMode('G', 'major')
    for (let i = 0; i < 20; i++) {
      expect(mode.getNextNote()).toMatch(/^[A-G]#?$/)
    }
  })

  it('works for all 12 root keys', () => {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    for (const key of keys) {
      const mode = new ScaleMode(key, 'natural_minor')
      const pool = new Set(getNotesInScale(key, 'natural_minor'))
      expect(pool.has(mode.getNextNote())).toBe(true)
    }
  })
})

describe('ScaleMode — isValidAnswer', () => {
  it('returns true when played note matches the current target', () => {
    const mode = new ScaleMode('A', 'major_pentatonic')
    const target = mode.getNextNote()
    expect(mode.isValidAnswer(target)).toBe(true)
  })

  it('returns false for a note not in the scale', () => {
    // C major contains no sharps; C# is guaranteed to not be the target
    const mode = new ScaleMode('C', 'major')
    mode.getNextNote()
    expect(mode.isValidAnswer('C#')).toBe(false)
  })

  it('reflects the latest getNextNote call', () => {
    const mode = new ScaleMode('D', 'blues')
    const first = mode.getNextNote()
    let second = first
    for (let i = 0; i < 100 && second === first; i++) {
      second = mode.getNextNote()
    }
    expect(mode.isValidAnswer(second)).toBe(true)
  })
})

describe('ScaleMode — getConfig', () => {
  it('includes the key and a human-readable scale name in the label', () => {
    const mode = new ScaleMode('E', 'natural_minor')
    const { label } = mode.getConfig()
    expect(label).toContain('E')
    expect(label).toContain('Natural Minor')
  })
})
