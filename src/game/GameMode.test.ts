import { describe, it, expect } from 'vitest'
import {
  RandomStringMode,
  ScaleMode,
  ChordTonesMode,
  SCALE_TYPES,
  CHORD_TYPES,
  RANDOM_STRING_MODE_ID,
  SCALE_MODE_ID,
  CHORD_TONES_MODE_ID,
  GAME_MODE_ENTRIES,
} from './GameMode'
import {
  NOTES_PER_STRING,
  getNotesInScale,
  getChordTones,
  toCanonicalSharp,
} from '../music-theory/MusicTheory'
import type { StringName } from '../music-theory/MusicTheory'

const STRINGS: StringName[] = ['E', 'A', 'D', 'G', 'B', 'e']

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

describe('GAME_MODE_ENTRIES', () => {
  it('contains an entry for each mode ID constant', () => {
    const ids = GAME_MODE_ENTRIES.map((e) => e.id)
    expect(ids).toContain(RANDOM_STRING_MODE_ID)
    expect(ids).toContain(SCALE_MODE_ID)
    expect(ids).toContain(CHORD_TONES_MODE_ID)
  })

  it('every entry has a non-empty label', () => {
    GAME_MODE_ENTRIES.forEach(({ label }) => {
      expect(typeof label).toBe('string')
      expect(label.length).toBeGreaterThan(0)
    })
  })
})

// ---------------------------------------------------------------------------
// GameMode id field
// ---------------------------------------------------------------------------

describe('RandomStringMode — id', () => {
  it('equals RANDOM_STRING_MODE_ID', () => {
    expect(new RandomStringMode('E').id).toBe(RANDOM_STRING_MODE_ID)
  })

  it('is stable across instances', () => {
    expect(new RandomStringMode('A').id).toBe(new RandomStringMode('G').id)
  })
})

describe('ScaleMode — id', () => {
  it('equals SCALE_MODE_ID', () => {
    expect(new ScaleMode('C', 'major').id).toBe(SCALE_MODE_ID)
  })

  it('is stable across instances', () => {
    expect(new ScaleMode('A', 'blues').id).toBe(new ScaleMode('G', 'major').id)
  })
})

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
      expect(mode.getNextNote()).toMatch(/^[A-G](#|b)?$/)
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
      expect(mode.getNextNote()).toMatch(/^[A-G](#|b)?$/)
    }
  })

  it('works for all 12 root keys', () => {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    for (const key of keys) {
      const mode = new ScaleMode(key, 'natural_minor')
      // pool uses canonical sharp form; normalise the note before checking
      const pool = new Set(getNotesInScale(key, 'natural_minor'))
      expect(pool.has(toCanonicalSharp(mode.getNextNote()))).toBe(true)
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

describe('ScaleMode — getStringFilter', () => {
  it('returns null (highlights span all strings)', () => {
    expect(new ScaleMode('C', 'major').getStringFilter()).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// RandomStringMode — getStringFilter
// ---------------------------------------------------------------------------

describe('RandomStringMode — getStringFilter', () => {
  it('returns the configured string', () => {
    for (const string of STRINGS) {
      expect(new RandomStringMode(string).getStringFilter()).toBe(string)
    }
  })

  it('returns null when constructed with null (all strings)', () => {
    expect(new RandomStringMode(null).getStringFilter()).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// ChordTonesMode
// ---------------------------------------------------------------------------

describe('ChordTonesMode — id', () => {
  it('equals CHORD_TONES_MODE_ID', () => {
    expect(new ChordTonesMode('C', 'major').id).toBe(CHORD_TONES_MODE_ID)
  })

  it('is stable across instances', () => {
    expect(new ChordTonesMode('A', 'minor').id).toBe(new ChordTonesMode('G', 'major7').id)
  })
})

describe('ChordTonesMode — getStringFilter', () => {
  it('returns null (highlights span all strings)', () => {
    expect(new ChordTonesMode('C', 'major').getStringFilter()).toBeNull()
  })
})

describe('ChordTonesMode — getNextNote', () => {
  it('always returns a note belonging to the chord tone pool', () => {
    for (const chord of CHORD_TYPES) {
      const mode = new ChordTonesMode('C', chord)
      const pool = new Set(getChordTones('C', chord))
      for (let i = 0; i < 50; i++) {
        expect(pool.has(mode.getNextNote())).toBe(true)
      }
    }
  })

  it('returns an octave-stripped note (no digits)', () => {
    const mode = new ChordTonesMode('G', 'major')
    for (let i = 0; i < 20; i++) {
      expect(mode.getNextNote()).toMatch(/^[A-G](#|b)?$/)
    }
  })

  it('works for all 12 root keys with major chord', () => {
    const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const
    for (const key of keys) {
      const mode = new ChordTonesMode(key, 'major')
      // pool uses canonical sharp form; normalise the note before checking
      const pool = new Set(getChordTones(key, 'major'))
      expect(pool.has(toCanonicalSharp(mode.getNextNote()))).toBe(true)
    }
  })
})

describe('ChordTonesMode — isValidAnswer', () => {
  it('returns true when played note matches the current target', () => {
    const mode = new ChordTonesMode('A', 'minor')
    const target = mode.getNextNote()
    expect(mode.isValidAnswer(target)).toBe(true)
  })

  it('returns false for a note not in the chord', () => {
    // C major tones are C, E, G — C# is guaranteed absent
    const mode = new ChordTonesMode('C', 'major')
    mode.getNextNote()
    expect(mode.isValidAnswer('C#')).toBe(false)
  })

  it('reflects the latest getNextNote call', () => {
    const mode = new ChordTonesMode('D', 'dominant7')
    const first = mode.getNextNote()
    let second = first
    for (let i = 0; i < 100 && second === first; i++) {
      second = mode.getNextNote()
    }
    expect(mode.isValidAnswer(second)).toBe(true)
  })
})

describe('ChordTonesMode — getConfig', () => {
  it('includes the key and a human-readable chord name in the label', () => {
    const mode = new ChordTonesMode('E', 'minor')
    const { label } = mode.getConfig()
    expect(label).toContain('E')
    expect(label).toContain('Minor')
  })

  it('labels all 7 chord types with non-empty human-readable strings', () => {
    for (const chord of CHORD_TYPES) {
      const { label } = new ChordTonesMode('C', chord).getConfig()
      expect(label.length).toBeGreaterThan(0)
      expect(label).toContain('C')
    }
  })
})

// ---------------------------------------------------------------------------
// Flat note support
// ---------------------------------------------------------------------------

describe('RandomStringMode — noteFilter', () => {
  it('naturals filter only yields natural notes', () => {
    const naturals = new Set(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
    const mode = new RandomStringMode(null, 'naturals')
    for (let i = 0; i < 100; i++) {
      expect(naturals.has(mode.getNextNote())).toBe(true)
    }
  })

  it('all filter yields both sharp and flat enharmonics', () => {
    const mode = new RandomStringMode(null, 'all')
    const seen = new Set<string>()
    for (let i = 0; i < 500; i++) seen.add(mode.getNextNote())
    expect(seen.has('C#')).toBe(true)
    expect(seen.has('Db')).toBe(true)
    expect(seen.has('A#')).toBe(true)
    expect(seen.has('Bb')).toBe(true)
  })

  it('isValidAnswer accepts enharmonic equivalent when target is sharp', () => {
    // Force currentNote to A# by running getNextNote until we get it
    const mode = new RandomStringMode(null, 'sharps')
    let found = false
    for (let i = 0; i < 500; i++) {
      if (mode.getNextNote() === 'A#') {
        found = true
        break
      }
    }
    if (!found) return // skip if extremely unlucky
    expect(mode.isValidAnswer('Bb')).toBe(true)
    expect(mode.isValidAnswer('A#')).toBe(true)
  })

  it('isValidAnswer accepts enharmonic equivalent when target is flat', () => {
    const mode = new RandomStringMode(null, 'all')
    let found = false
    for (let i = 0; i < 500; i++) {
      if (mode.getNextNote() === 'Bb') {
        found = true
        break
      }
    }
    if (!found) return
    expect(mode.isValidAnswer('A#')).toBe(true)
    expect(mode.isValidAnswer('Bb')).toBe(true)
  })
})

describe('ScaleMode — flat display for flat-preferred roots', () => {
  it('A# major note pool uses flat names (Bb, not A#)', () => {
    const mode = new ScaleMode('A#', 'major')
    const notes = new Set<string>()
    for (let i = 0; i < 200; i++) notes.add(mode.getNextNote())
    expect(notes.has('Bb')).toBe(true)
    expect(notes.has('A#')).toBe(false)
  })

  it('A# major note pool contains Eb, not D#', () => {
    const mode = new ScaleMode('A#', 'major')
    const notes = new Set<string>()
    for (let i = 0; i < 200; i++) notes.add(mode.getNextNote())
    expect(notes.has('Eb')).toBe(true)
    expect(notes.has('D#')).toBe(false)
  })

  it('isValidAnswer accepts sharp when target note is flat', () => {
    const mode = new ScaleMode('A#', 'major')
    let found = false
    for (let i = 0; i < 200; i++) {
      if (mode.getNextNote() === 'Bb') {
        found = true
        break
      }
    }
    if (!found) return
    expect(mode.isValidAnswer('A#')).toBe(true)
    expect(mode.isValidAnswer('Bb')).toBe(true)
  })

  it('C major note pool stays in natural/sharp form (no flat-preferred mapping)', () => {
    const mode = new ScaleMode('C', 'major')
    const notes = new Set<string>()
    for (let i = 0; i < 100; i++) notes.add(mode.getNextNote())
    // C major: C D E F G A B — no accidentals at all
    expect(notes.has('Bb')).toBe(false)
    expect(notes.has('Eb')).toBe(false)
  })
})

describe('ChordTonesMode — flat display for flat-preferred roots', () => {
  it('A# major chord pool uses Bb, not A#', () => {
    const mode = new ChordTonesMode('A#', 'major')
    const notes = new Set<string>()
    for (let i = 0; i < 200; i++) notes.add(mode.getNextNote())
    expect(notes.has('Bb')).toBe(true)
    expect(notes.has('A#')).toBe(false)
  })

  it('isValidAnswer accepts sharp equivalent when target is flat', () => {
    const mode = new ChordTonesMode('A#', 'major')
    let found = false
    for (let i = 0; i < 200; i++) {
      if (mode.getNextNote() === 'Bb') {
        found = true
        break
      }
    }
    if (!found) return
    expect(mode.isValidAnswer('A#')).toBe(true)
  })
})
