import { describe, it, expect } from 'vitest'
import { computeHighlights } from './computeHighlights'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function colorSet(
  ...args: Parameters<typeof computeHighlights>
): Set<string> {
  return new Set(computeHighlights(...args).map((h) => h.color))
}

// ---------------------------------------------------------------------------
// No-note guard
// ---------------------------------------------------------------------------

describe('computeHighlights — no note', () => {
  it('returns empty array when currentNote is empty', () => {
    expect(computeHighlights('waiting', 'learning', '', null)).toEqual([])
  })

  it('returns empty array in idle status', () => {
    expect(computeHighlights('idle', 'learning', 'A', null)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Correct status — green regardless of difficulty
// ---------------------------------------------------------------------------

describe('computeHighlights — correct', () => {
  it('returns green dots in learning mode', () => {
    const result = computeHighlights('correct', 'learning', 'A', null)
    expect(result.length).toBeGreaterThan(0)
    expect(colorSet('correct', 'learning', 'A', null)).toEqual(new Set(['green']))
  })

  it('returns green dots in practice mode', () => {
    const result = computeHighlights('correct', 'practice', 'A', null)
    expect(result.length).toBeGreaterThan(0)
    expect(colorSet('correct', 'practice', 'A', null)).toEqual(new Set(['green']))
  })
})

// ---------------------------------------------------------------------------
// Wrong status
// ---------------------------------------------------------------------------

describe('computeHighlights — wrong', () => {
  it('returns red dots in learning mode', () => {
    const result = computeHighlights('wrong', 'learning', 'A', null)
    expect(result.length).toBeGreaterThan(0)
    expect(colorSet('wrong', 'learning', 'A', null)).toEqual(new Set(['red']))
  })

  it('returns no dots in practice mode', () => {
    expect(computeHighlights('wrong', 'practice', 'A', null)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// Waiting status
// ---------------------------------------------------------------------------

describe('computeHighlights — waiting', () => {
  it('returns amber dots in learning mode', () => {
    const result = computeHighlights('waiting', 'learning', 'A', null)
    expect(result.length).toBeGreaterThan(0)
    expect(colorSet('waiting', 'learning', 'A', null)).toEqual(new Set(['amber']))
  })

  it('returns no dots in practice mode', () => {
    expect(computeHighlights('waiting', 'practice', 'A', null)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// stringFilter
// ---------------------------------------------------------------------------

describe('computeHighlights — stringFilter', () => {
  it('restricts positions to the given string when stringFilter is set', () => {
    const all = computeHighlights('waiting', 'learning', 'E', null)
    const eOnly = computeHighlights('waiting', 'learning', 'E', 'e')
    expect(eOnly.length).toBeGreaterThan(0)
    expect(eOnly.length).toBeLessThan(all.length)
    expect(eOnly.every((h) => h.position.string === 'e')).toBe(true)
  })

  it('returns positions across all strings when stringFilter is null', () => {
    const result = computeHighlights('waiting', 'learning', 'E', null)
    const strings = new Set(result.map((h) => h.position.string))
    // E appears on every string
    expect(strings.size).toBe(6)
  })
})

// ---------------------------------------------------------------------------
// Enharmonic normalisation
// ---------------------------------------------------------------------------

describe('computeHighlights — enharmonic normalisation', () => {
  it('Bb and A# produce the same positions', () => {
    const sharp = computeHighlights('waiting', 'learning', 'A#', null)
    const flat  = computeHighlights('waiting', 'learning', 'Bb', null)
    expect(sharp).toEqual(flat)
  })
})
