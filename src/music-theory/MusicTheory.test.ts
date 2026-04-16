import { describe, it, expect } from 'vitest'
import {
  NOTE_NAMES,
  SCALES,
  NOTES_PER_STRING,
  pitch2note,
  getNotesInScale,
  getAllPositionsForNote,
  type ScaleType,
  type FretboardPosition,
} from './MusicTheory'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('NOTE_NAMES', () => {
  it('has exactly 12 chromatic notes', () => {
    expect(NOTE_NAMES).toHaveLength(12)
  })

  it('starts with C and ends with B', () => {
    expect(NOTE_NAMES[0]).toBe('C')
    expect(NOTE_NAMES[11]).toBe('B')
  })

  it('contains all expected notes', () => {
    expect(NOTE_NAMES).toEqual([
      'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
    ])
  })
})

describe('SCALES', () => {
  it('exports all 7 scale types', () => {
    const expected: ScaleType[] = [
      'major',
      'natural_minor',
      'augmented',
      'blues',
      'major_pentatonic',
      'minor_pentatonic',
      'phrygian_dominant',
    ]
    expected.forEach((s) => expect(SCALES).toHaveProperty(s))
  })

  it('each scale value is a string of digits', () => {
    Object.values(SCALES).forEach((pattern) => {
      expect(typeof pattern).toBe('string')
      expect(pattern).toMatch(/^\d+$/)
    })
  })

  it('major scale has correct interval pattern', () => {
    expect(SCALES.major).toBe('2212221')
  })

  it('minor pentatonic has correct interval pattern', () => {
    expect(SCALES.minor_pentatonic).toBe('32232')
  })
})

describe('NOTES_PER_STRING', () => {
  it('covers all 6 strings in standard tuning', () => {
    expect(Object.keys(NOTES_PER_STRING)).toEqual(
      expect.arrayContaining(['e', 'B', 'G', 'D', 'A', 'E']),
    )
    expect(Object.keys(NOTES_PER_STRING)).toHaveLength(6)
  })

  it('each string has exactly 13 notes (frets 0–12)', () => {
    Object.values(NOTES_PER_STRING).forEach((notes) => {
      expect(notes).toHaveLength(13)
    })
  })

  it('low E string starts on E2 and ends on E3', () => {
    expect(NOTES_PER_STRING['E'][0]).toBe('E2')
    expect(NOTES_PER_STRING['E'][12]).toBe('E3')
  })

  it('high e string starts on E4 and ends on E5', () => {
    expect(NOTES_PER_STRING['e'][0]).toBe('E4')
    expect(NOTES_PER_STRING['e'][12]).toBe('E5')
  })

  it('A string starts on A2 and ends on A3', () => {
    expect(NOTES_PER_STRING['A'][0]).toBe('A2')
    expect(NOTES_PER_STRING['A'][12]).toBe('A3')
  })

  it('open notes match standard tuning E-A-D-G-B-e', () => {
    expect(NOTES_PER_STRING['E'][0]).toMatch(/^E/)
    expect(NOTES_PER_STRING['A'][0]).toMatch(/^A/)
    expect(NOTES_PER_STRING['D'][0]).toMatch(/^D/)
    expect(NOTES_PER_STRING['G'][0]).toMatch(/^G/)
    expect(NOTES_PER_STRING['B'][0]).toMatch(/^B/)
    expect(NOTES_PER_STRING['e'][0]).toMatch(/^E/)
  })

  it('fret 12 is the same note name as fret 0 (octave equivalent)', () => {
    const strings = ['E', 'A', 'D', 'G', 'B', 'e'] as const
    strings.forEach((s) => {
      const open = NOTES_PER_STRING[s][0].replace(/\d/, '')
      const twelfth = NOTES_PER_STRING[s][12].replace(/\d/, '')
      expect(twelfth).toBe(open)
    })
  })
})

// ---------------------------------------------------------------------------
// pitch2note
// ---------------------------------------------------------------------------

describe('pitch2note', () => {
  it('returns a note name without octave', () => {
    const result = pitch2note(440)
    expect(result).not.toMatch(/\d/)
  })

  it('A4 (440 Hz) → A', () => {
    expect(pitch2note(440)).toBe('A')
  })

  it('C4 (261.63 Hz) → C', () => {
    expect(pitch2note(261.63)).toBe('C')
  })

  it('E4 (329.63 Hz) → E', () => {
    expect(pitch2note(329.63)).toBe('E')
  })

  it('D4 (293.66 Hz) → D', () => {
    expect(pitch2note(293.66)).toBe('D')
  })

  it('F#4 (369.99 Hz) → F#', () => {
    expect(pitch2note(369.99)).toBe('F#')
  })

  it('handles low E2 (82.41 Hz) → E', () => {
    expect(pitch2note(82.41)).toBe('E')
  })

  it('handles high e5 (659.25 Hz) → E', () => {
    expect(pitch2note(659.25)).toBe('E')
  })
})

// ---------------------------------------------------------------------------
// getNotesInScale
// ---------------------------------------------------------------------------

describe('getNotesInScale', () => {
  it('C major returns 7 unique notes', () => {
    const notes = getNotesInScale('C', 'major')
    expect(notes).toHaveLength(7)
    expect(new Set(notes).size).toBe(7)
  })

  it('C major contains the correct notes', () => {
    expect(getNotesInScale('C', 'major')).toEqual(
      expect.arrayContaining(['C', 'D', 'E', 'F', 'G', 'A', 'B']),
    )
  })

  it('G major contains F# but not F', () => {
    const notes = getNotesInScale('G', 'major')
    expect(notes).toContain('F#')
    expect(notes).not.toContain('F')
  })

  it('A natural minor returns 7 unique notes', () => {
    const notes = getNotesInScale('A', 'natural_minor')
    expect(notes).toHaveLength(7)
    expect(new Set(notes).size).toBe(7)
  })

  it('A natural minor contains the correct notes', () => {
    expect(getNotesInScale('A', 'natural_minor')).toEqual(
      expect.arrayContaining(['A', 'B', 'C', 'D', 'E', 'F', 'G']),
    )
  })

  it('D natural minor is correct', () => {
    expect(getNotesInScale('D', 'natural_minor')).toEqual(
      expect.arrayContaining(['D', 'E', 'F', 'G', 'A', 'A#', 'C']),
    )
  })

  it('C major pentatonic returns 5 unique notes', () => {
    const notes = getNotesInScale('C', 'major_pentatonic')
    expect(notes).toHaveLength(5)
    expect(new Set(notes).size).toBe(5)
  })

  it('C major pentatonic contains the correct notes', () => {
    expect(getNotesInScale('C', 'major_pentatonic')).toEqual(
      expect.arrayContaining(['C', 'D', 'E', 'G', 'A']),
    )
  })

  it('A minor pentatonic returns 5 unique notes', () => {
    const notes = getNotesInScale('A', 'minor_pentatonic')
    expect(notes).toHaveLength(5)
    expect(new Set(notes).size).toBe(5)
  })

  it('A minor pentatonic contains the correct notes', () => {
    expect(getNotesInScale('A', 'minor_pentatonic')).toEqual(
      expect.arrayContaining(['A', 'C', 'D', 'E', 'G']),
    )
  })

  it('A blues scale returns 6 unique notes', () => {
    const notes = getNotesInScale('A', 'blues')
    expect(notes).toHaveLength(6)
    expect(new Set(notes).size).toBe(6)
  })

  it('A blues contains the correct notes', () => {
    // A blues: A C D D# E G
    expect(getNotesInScale('A', 'blues')).toEqual(
      expect.arrayContaining(['A', 'C', 'D', 'D#', 'E', 'G']),
    )
  })

  it('C augmented returns 6 unique notes', () => {
    const notes = getNotesInScale('C', 'augmented')
    expect(notes).toHaveLength(6)
    expect(new Set(notes).size).toBe(6)
  })

  it('E phrygian dominant returns 7 unique notes', () => {
    const notes = getNotesInScale('E', 'phrygian_dominant')
    expect(notes).toHaveLength(7)
    expect(new Set(notes).size).toBe(7)
  })

  it('E phrygian dominant contains the correct notes', () => {
    // E F G# A B C D
    expect(getNotesInScale('E', 'phrygian_dominant')).toEqual(
      expect.arrayContaining(['E', 'F', 'G#', 'A', 'B', 'C', 'D']),
    )
  })
})

// ---------------------------------------------------------------------------
// getAllPositionsForNote
// ---------------------------------------------------------------------------

describe('getAllPositionsForNote', () => {
  it('returns an array of FretboardPosition objects', () => {
    const positions = getAllPositionsForNote('E')
    expect(Array.isArray(positions)).toBe(true)
    positions.forEach((p: FretboardPosition) => {
      expect(p).toHaveProperty('string')
      expect(p).toHaveProperty('fret')
      expect(typeof p.fret).toBe('number')
    })
  })

  it('E appears on all 6 strings', () => {
    const positions = getAllPositionsForNote('E')
    const strings = positions.map((p) => p.string)
    expect(strings).toContain('E')
    expect(strings).toContain('A')
    expect(strings).toContain('D')
    expect(strings).toContain('G')
    expect(strings).toContain('B')
    expect(strings).toContain('e')
  })

  it('open low E is fret 0 on E string', () => {
    const positions = getAllPositionsForNote('E')
    expect(positions).toContainEqual({ string: 'E', fret: 0 })
  })

  it('E at fret 12 on low E string', () => {
    const positions = getAllPositionsForNote('E')
    expect(positions).toContainEqual({ string: 'E', fret: 12 })
  })

  it('E at fret 7 on A string', () => {
    const positions = getAllPositionsForNote('E')
    expect(positions).toContainEqual({ string: 'A', fret: 7 })
  })

  it('E at fret 2 on D string', () => {
    const positions = getAllPositionsForNote('E')
    expect(positions).toContainEqual({ string: 'D', fret: 2 })
  })

  it('E at fret 9 on G string', () => {
    const positions = getAllPositionsForNote('E')
    expect(positions).toContainEqual({ string: 'G', fret: 9 })
  })

  it('E at fret 5 on B string', () => {
    const positions = getAllPositionsForNote('E')
    expect(positions).toContainEqual({ string: 'B', fret: 5 })
  })

  it('open high e is fret 0 on e string', () => {
    const positions = getAllPositionsForNote('E')
    expect(positions).toContainEqual({ string: 'e', fret: 0 })
  })

  it('A at fret 0 on A string', () => {
    const positions = getAllPositionsForNote('A')
    expect(positions).toContainEqual({ string: 'A', fret: 0 })
  })

  it('fret numbers are within 0–12', () => {
    const allNotes = NOTE_NAMES as readonly string[]
    allNotes.forEach((note) => {
      getAllPositionsForNote(note).forEach((p) => {
        expect(p.fret).toBeGreaterThanOrEqual(0)
        expect(p.fret).toBeLessThanOrEqual(12)
      })
    })
  })

  it('a note not in standard tuning range returns empty array', () => {
    // 'X' is not a valid note
    expect(getAllPositionsForNote('X')).toEqual([])
  })
})
