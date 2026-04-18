import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import {
  sessionReducer,
  INITIAL_STATE,
  CORRECT_ADVANCE_DELAY_MS,
} from './GameSession'
import type { SessionState } from './GameSession'
import type { GameMode, Difficulty } from './GameMode'

// ---------------------------------------------------------------------------
// Context value type
// ---------------------------------------------------------------------------

interface GameSessionContextValue {
  state: SessionState
  startSession(mode: GameMode, difficulty: Difficulty): void
  noteDetected(note: string): void
  quit(): void
}

const GameSessionContext = createContext<GameSessionContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function GameSessionProvider({ children }: { children: ReactNode }) {
  const modeRef = useRef<GameMode | null>(null)
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [state, dispatch] = useReducer(sessionReducer, INITIAL_STATE)

  const startSession = useCallback((mode: GameMode, difficulty: Difficulty) => {
    if (advanceTimerRef.current !== null) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
    modeRef.current = mode
    dispatch({ type: 'START_SESSION', firstNote: mode.getNextNote(), difficulty, stringFilter: mode.getStringFilter() })
  }, [])

  const noteDetected = useCallback((note: string) => {
    const mode = modeRef.current
    if (mode === null) return
    const isCorrect = mode.isValidAnswer(note)
    dispatch({ type: 'NOTE_DETECTED', isCorrect })

    if (isCorrect && advanceTimerRef.current === null) {
      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null
        dispatch({ type: 'ADVANCE', nextNote: mode.getNextNote() })
      }, CORRECT_ADVANCE_DELAY_MS)
    }
  }, [])

  const quit = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      clearTimeout(advanceTimerRef.current)
      advanceTimerRef.current = null
    }
    modeRef.current = null
    dispatch({ type: 'QUIT' })
  }, [])

  return (
    <GameSessionContext.Provider value={{ state, startSession, noteDetected, quit }}>
      {children}
    </GameSessionContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

// eslint-disable-next-line react-refresh/only-export-components
export function useGameSession(): GameSessionContextValue {
  const ctx = useContext(GameSessionContext)
  if (ctx === null) {
    throw new Error('useGameSession must be used inside <GameSessionProvider>')
  }
  return ctx
}
