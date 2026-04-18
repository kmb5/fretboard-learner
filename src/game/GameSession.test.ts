import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sessionReducer, CORRECT_ADVANCE_DELAY_MS, INITIAL_STATE } from './GameSession'
import type { SessionState } from './GameSession'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const INITIAL: SessionState = INITIAL_STATE

function waitingState(overrides: Partial<SessionState> = {}): SessionState {
  return { ...INITIAL, status: 'waiting', currentNote: 'A', ...overrides }
}

// ---------------------------------------------------------------------------
// Pure reducer tests
// ---------------------------------------------------------------------------

describe('sessionReducer — START_SESSION', () => {
  it('transitions idle → waiting', () => {
    const next = sessionReducer(INITIAL, { type: 'START_SESSION', firstNote: 'A', difficulty: 'learning' })
    expect(next.status).toBe('waiting')
  })

  it('sets difficulty from the action', () => {
    const next = sessionReducer(INITIAL, { type: 'START_SESSION', firstNote: 'A', difficulty: 'practice' })
    expect(next.difficulty).toBe('practice')
  })

  it('resets score to 0', () => {
    const withScore: SessionState = { ...INITIAL, score: 5 }
    const next = sessionReducer(withScore, { type: 'START_SESSION', firstNote: 'A', difficulty: 'learning' })
    expect(next.score).toBe(0)
  })

  it('sets currentNote to the provided firstNote', () => {
    const next = sessionReducer(INITIAL, { type: 'START_SESSION', firstNote: 'F#', difficulty: 'learning' })
    expect(next.currentNote).toBe('F#')
  })
})

describe('sessionReducer — NOTE_DETECTED (correct)', () => {
  it('transitions waiting → correct', () => {
    const next = sessionReducer(waitingState(), { type: 'NOTE_DETECTED', isCorrect: true })
    expect(next.status).toBe('correct')
  })

  it('increments score by 1', () => {
    const next = sessionReducer(waitingState({ score: 3 }), { type: 'NOTE_DETECTED', isCorrect: true })
    expect(next.score).toBe(4)
  })
})

describe('sessionReducer — NOTE_DETECTED (wrong)', () => {
  it('transitions waiting → wrong', () => {
    const next = sessionReducer(waitingState(), { type: 'NOTE_DETECTED', isCorrect: false })
    expect(next.status).toBe('wrong')
  })

  it('does not increment score', () => {
    const next = sessionReducer(waitingState({ score: 2 }), { type: 'NOTE_DETECTED', isCorrect: false })
    expect(next.score).toBe(2)
  })

  it('stays on wrong until a correct detection arrives', () => {
    let state = sessionReducer(waitingState(), { type: 'NOTE_DETECTED', isCorrect: false })
    expect(state.status).toBe('wrong')
    state = sessionReducer(state, { type: 'NOTE_DETECTED', isCorrect: false })
    expect(state.status).toBe('wrong')
    state = sessionReducer(state, { type: 'NOTE_DETECTED', isCorrect: true })
    expect(state.status).toBe('correct')
  })
})

describe('sessionReducer — NOTE_DETECTED ignored outside waiting/wrong', () => {
  it('is a no-op in idle state', () => {
    const next = sessionReducer(INITIAL, { type: 'NOTE_DETECTED', isCorrect: true })
    expect(next).toEqual(INITIAL)
  })

  it('is a no-op in correct state', () => {
    const correct: SessionState = { ...INITIAL, status: 'correct', currentNote: 'A' }
    const next = sessionReducer(correct, { type: 'NOTE_DETECTED', isCorrect: true })
    expect(next).toEqual(correct)
  })
})

describe('sessionReducer — ADVANCE', () => {
  it('transitions correct → waiting with the provided next note', () => {
    const correct: SessionState = { ...INITIAL, status: 'correct', currentNote: 'A', score: 1 }
    const next = sessionReducer(correct, { type: 'ADVANCE', nextNote: 'D' })
    expect(next.status).toBe('waiting')
    expect(next.currentNote).toBe('D')
    expect(next.score).toBe(1)
  })

  it('is a no-op outside correct state', () => {
    const waiting = waitingState()
    const next = sessionReducer(waiting, { type: 'ADVANCE', nextNote: 'D' })
    expect(next).toEqual(waiting)
  })
})

describe('sessionReducer — QUIT', () => {
  it('resets state to idle from any status', () => {
    for (const status of ['waiting', 'correct', 'wrong'] as const) {
      const state: SessionState = { status, currentNote: 'A', score: 5, difficulty: 'practice', stringFilter: null }
      const next = sessionReducer(state, { type: 'QUIT' })
      expect(next.status).toBe('idle')
      expect(next.score).toBe(0)
      expect(next.currentNote).toBe('')
    }
  })
})

// ---------------------------------------------------------------------------
// CORRECT_ADVANCE_DELAY_MS constant
// ---------------------------------------------------------------------------

describe('CORRECT_ADVANCE_DELAY_MS', () => {
  it('is approximately 1100 ms', () => {
    expect(CORRECT_ADVANCE_DELAY_MS).toBeGreaterThanOrEqual(900)
    expect(CORRECT_ADVANCE_DELAY_MS).toBeLessThanOrEqual(1400)
  })
})

// ---------------------------------------------------------------------------
// Auto-advance timer (fake timers)
// ---------------------------------------------------------------------------

describe('auto-advance timer', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  it('callback fires after CORRECT_ADVANCE_DELAY_MS', () => {
    const cb = vi.fn()
    const timer = setTimeout(cb, CORRECT_ADVANCE_DELAY_MS)
    expect(cb).not.toHaveBeenCalled()
    vi.advanceTimersByTime(CORRECT_ADVANCE_DELAY_MS)
    expect(cb).toHaveBeenCalledOnce()
    clearTimeout(timer)
  })
})
