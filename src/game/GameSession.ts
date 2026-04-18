import type { Difficulty } from './GameMode'
import type { StringName } from '../music-theory/MusicTheory'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export type SessionStatus = 'idle' | 'waiting' | 'correct' | 'wrong'

export interface SessionState {
  status: SessionStatus
  currentNote: string
  score: number
  difficulty: Difficulty
  stringFilter: StringName | null
}

// ---------------------------------------------------------------------------
// Actions
//
// Each action carries all data the reducer needs — no external refs required,
// keeping the reducer a pure function of (state, action) → state.
// ---------------------------------------------------------------------------

export type SessionAction =
  | { type: 'START_SESSION'; firstNote: string; difficulty: Difficulty; stringFilter?: StringName | null }
  | { type: 'NOTE_DETECTED'; isCorrect: boolean }
  | { type: 'ADVANCE'; nextNote: string }
  | { type: 'QUIT' }

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** How long (ms) the "correct" state is shown before auto-advancing. */
export const CORRECT_ADVANCE_DELAY_MS = 1100

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export const INITIAL_STATE: SessionState = {
  status: 'idle',
  currentNote: '',
  score: 0,
  difficulty: 'learning',
  stringFilter: null,
}

/** Pure reducer — no side effects, no external dependencies. */
export function sessionReducer(
  state: SessionState,
  action: SessionAction,
): SessionState {
  switch (action.type) {
    case 'START_SESSION':
      return {
        status: 'waiting',
        currentNote: action.firstNote,
        score: 0,
        difficulty: action.difficulty,
        stringFilter: action.stringFilter ?? null,
      }

    case 'NOTE_DETECTED': {
      if (state.status !== 'waiting' && state.status !== 'wrong') return state
      if (action.isCorrect) {
        return { ...state, status: 'correct', score: state.score + 1 }
      }
      return { ...state, status: 'wrong' }
    }

    case 'ADVANCE':
      if (state.status !== 'correct') return state
      return { ...state, status: 'waiting', currentNote: action.nextNote }

    case 'QUIT':
      return { ...INITIAL_STATE }

    default:
      return state
  }
}
