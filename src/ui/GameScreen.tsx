import { useEffect, useRef, useState } from 'react'
import { useGameSession } from '../game/GameSessionProvider'
import type { SessionStatus } from '../game/GameSession'
import type { Difficulty } from '../game/GameMode'
import { createPitchDetector } from '../pitch-detector/PitchDetector'
import FretboardSVG from '../fretboard/FretboardSVG'
import type { HighlightSpec } from '../fretboard/FretboardSVG'
import { getAllPositionsForNote } from '../music-theory/MusicTheory'
import MicPermissionPrompt from './MicPermissionPrompt'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Time after last detected note before the "Heard" indicator resets to —. */
const SILENCE_RESET_MS = 2000

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOTE_COLOR_CLASS: Record<SessionStatus, string> = {
  idle: 'text-amber-400',
  waiting: 'text-amber-400',
  correct: 'text-green-400',
  wrong: 'text-red-400',
}

function computeHighlights(
  status: SessionStatus,
  difficulty: Difficulty,
  currentNote: string,
): HighlightSpec[] {
  if (!currentNote) return []
  const positions = getAllPositionsForNote(currentNote)

  if (status === 'correct') {
    return positions.map((p) => ({ position: p, color: 'green' as const }))
  }
  if (status === 'wrong') {
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

  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [heardNote, setHeardNote] = useState<string>('—')
  const [micDenied, setMicDenied] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

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
        setMicDenied(true)
      }
    })

    return () => {
      if (silenceTimerRef.current !== null) {
        clearTimeout(silenceTimerRef.current)
        silenceTimerRef.current = null
      }
      detector.stop()
    }
  }, [noteDetected, retryCount])

  const handleRetry = () => {
    setMicDenied(false)
    setRetryCount((c) => c + 1)
  }

  if (micDenied) {
    return <MicPermissionPrompt onRetry={handleRetry} />
  }

  const highlights = computeHighlights(state.status, state.difficulty, state.currentNote)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col gap-8 p-8">
      <h1 className="text-3xl font-bold tracking-wide text-center">Fretboard Learner</h1>

      <div className="w-full">
        <FretboardSVG highlights={highlights} />
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <p className="text-zinc-400 text-sm uppercase tracking-widest mb-2">Play this note</p>
          <p
            data-testid="current-note"
            className={`text-7xl font-bold ${NOTE_COLOR_CLASS[state.status]}`}
          >
            {state.currentNote}
          </p>
        </div>

        <p className="text-zinc-500 text-sm">
          Heard: <span data-testid="heard-note" className="text-zinc-300 font-mono">{heardNote}</span>
        </p>

        <p className="text-zinc-500 text-sm">Score: {state.score}</p>

        <button
          onClick={quit}
          className="px-6 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
        >
          Quit
        </button>
      </div>
    </div>
  )
}
