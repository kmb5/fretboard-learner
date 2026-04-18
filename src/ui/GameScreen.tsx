import { useEffect, useMemo, useRef, useState } from 'react'
import { useGameSession } from '../game/GameSessionProvider'
import type { SessionStatus } from '../game/GameSession'
import type { Difficulty } from '../game/GameMode'
import { createPitchDetector } from '../pitch-detector/PitchDetector'
import FretboardSVG from '../fretboard/FretboardSVG'
import type { HighlightSpec } from '../fretboard/FretboardSVG'
import { getAllPositionsForNote, toCanonicalSharp, formatNote } from '../music-theory/MusicTheory'
import type { StringName } from '../music-theory/MusicTheory'
import AppHeader from './AppHeader'
import MicPermissionPrompt from './MicPermissionPrompt'
import { usePreferences } from '../hooks/usePreferences'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Time after last detected note before the "Heard" indicator resets to —. */
export const SILENCE_RESET_MS = 2000

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOTE_COLOR: Record<SessionStatus, string> = {
  idle:    'var(--amber-hl)',
  waiting: 'var(--amber-hl)',
  correct: 'var(--green)',
  wrong:   'var(--red)',
}


function computeHighlights(
  status: SessionStatus,
  difficulty: Difficulty,
  currentNote: string,
  stringFilter: StringName | null,
): HighlightSpec[] {
  if (!currentNote) return []
  const allPositions = getAllPositionsForNote(toCanonicalSharp(currentNote))
  const positions = stringFilter === null
    ? allPositions
    : allPositions.filter((p) => p.string === stringFilter)

  if (status === 'correct') {
    return positions.map((p) => ({ position: p, color: 'green' as const }))
  }
  if (status === 'wrong' && difficulty === 'learning') {
    return positions.map((p) => ({ position: p, color: 'red' as const }))
  }
  if (status === 'waiting' && difficulty === 'learning') {
    return positions.map((p) => ({ position: p, color: 'amber' as const }))
  }
  return []
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GameScreen() {
  const { state, noteDetected, quit } = useGameSession()
  const { isLeftHanded, isTabView } = usePreferences()

  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [heardNote, setHeardNote] = useState<string>('—')
  const [micError, setMicError] = useState<string | null>(null)
  // micInitKey is incremented by handleRetry to re-run this effect and create
  // a fresh detector after a permission denial or other recoverable mic error.
  const [micInitKey, setMicInitKey] = useState(0)

  useEffect(() => {
    const detector = createPitchDetector()

    detector.onNote((note) => {
      // Reset the silence countdown on every incoming note.
      if (silenceTimerRef.current !== null) clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = setTimeout(() => setHeardNote('—'), SILENCE_RESET_MS)

      setHeardNote(note)
      noteDetected(note)
    })

    detector.start().catch((err: unknown) => {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setMicError('Microphone access was denied.')
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setMicError('No microphone found.')
      } else {
        throw err
      }
    })

    return () => {
      if (silenceTimerRef.current !== null) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
      detector.stop()
    }
  }, [noteDetected, micInitKey])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') quit()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [quit])

  const handleRetry = () => {
    setMicError(null)
    setMicInitKey((k) => k + 1)
  }

  const highlights = useMemo(
    () => computeHighlights(state.status, state.difficulty, state.currentNote, state.stringFilter),
    [state.status, state.difficulty, state.currentNote, state.stringFilter],
  )

  if (micError !== null) {
    return <MicPermissionPrompt errorMessage={micError} onRetry={handleRetry} />
  }

  return (
    <div
      className="flex flex-col"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--fg)', height: '100dvh', overflow: 'hidden' }}
    >
      {/* Header bar — hidden on mobile landscape via .game-header-bar */}
      <header
        className="game-header-bar flex items-center justify-between px-8 pt-6 pb-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <AppHeader showSettings={false} />
        <p
          style={{
            fontFamily: "'Fira Code', monospace",
            fontSize: '0.75rem',
            color: 'var(--fg-3)',
            margin: 0,
          }}
        >
          Score: {state.score}
        </p>
      </header>

      {/* Fretboard */}
      <div className="game-fretboard px-6 pt-6">
        <FretboardSVG highlights={highlights} isLeftHanded={isLeftHanded} isFlipped={isTabView} />
      </div>

      {/* Note display + controls */}
      <div className="game-controls flex-1 flex flex-col items-center justify-center gap-6 px-8">
        <div className="game-note-group text-center">
          <p className="section-label" style={{ marginBottom: '20px' }}>
            Play this note
          </p>
          <div
            className="note-aura"
            data-status={state.status}
          >
            <p
              key={state.status === 'correct' ? `${state.currentNote}-correct` : state.currentNote}
              data-testid="current-note"
              className={`game-note-display ${state.status === 'correct' ? 'anim-note-correct' : 'anim-note-advance'}`}
              style={{
                fontFamily: "'Bebas Neue', cursive",
                fontSize: 'clamp(5.5rem, 16vw, 8rem)',
                lineHeight: 1,
                color: NOTE_COLOR[state.status],
                transition: 'color 0.3s ease',
                margin: 0,
              }}
            >
              {(() => {
                const formatted = formatNote(state.currentNote)
                const accidental = formatted.slice(1)
                return (
                  <>
                    {formatted[0]}
                    {accidental && (
                      <span style={{
                        fontFamily: "'Fira Code', monospace",
                        fontSize: '0.5em',
                        verticalAlign: 'top',
                        marginLeft: '0.04em',
                        lineHeight: 1,
                      }}>
                        {accidental}
                      </span>
                    )}
                  </>
                )
              })()}
            </p>
          </div>
        </div>

        <div className="game-bottom-row">
          <span className="game-score-mobile">Score: {state.score}</span>
          <div className="heard-chip">
            Heard:<span data-testid="heard-note">{formatNote(heardNote)}</span>
          </div>
          <button onClick={quit} className="btn-quit">
            Quit
          </button>
        </div>
      </div>
    </div>
  )
}
