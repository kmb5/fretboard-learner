import { useState, useCallback } from 'react'
import { useGameSession } from '../game/GameSessionProvider'
import { RandomStringMode } from '../game/GameMode'
import type { Difficulty } from '../game/GameMode'
import type { StringName } from '../music-theory/MusicTheory'

const STRINGS: StringName[] = ['E', 'A', 'D', 'G', 'B', 'e']

export default function ModeSelector() {
  const { startSession } = useGameSession()
  const [selectedString, setSelectedString] = useState<StringName | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('learning')

  const handleStart = useCallback(() => {
    if (selectedString === null) return
    startSession(new RandomStringMode(selectedString), difficulty)
  }, [selectedString, difficulty, startSession])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <h1 className="text-3xl font-bold tracking-wide text-center">Fretboard Learner</h1>

        {/* String picker */}
        <section aria-labelledby="string-label">
          <p id="string-label" className="text-xs uppercase tracking-widest text-zinc-400 mb-3">
            Select a string
          </p>
          <div className="grid grid-cols-6 gap-2" role="group" aria-labelledby="string-label">
            {STRINGS.map((s) => (
              <button
                key={s}
                aria-pressed={selectedString === s}
                onClick={() => setSelectedString(s)}
                className={[
                  'py-3 rounded-lg text-sm font-bold transition-colors',
                  selectedString === s
                    ? 'bg-amber-500 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
                ].join(' ')}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Difficulty toggle */}
        <section aria-labelledby="difficulty-label">
          <p id="difficulty-label" className="text-xs uppercase tracking-widest text-zinc-400 mb-3">
            Difficulty
          </p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="difficulty-label">
            {(['learning', 'practice'] as Difficulty[]).map((d) => (
              <button
                key={d}
                aria-pressed={difficulty === d}
                onClick={() => setDifficulty(d)}
                className={[
                  'py-3 rounded-lg text-sm font-medium capitalize transition-colors',
                  difficulty === d
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
                ].join(' ')}
              >
                {d}
              </button>
            ))}
          </div>
        </section>

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={selectedString === null}
          className="w-full py-4 rounded-xl text-base font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-amber-500 text-zinc-950 hover:bg-amber-400 disabled:hover:bg-amber-500"
        >
          Start
        </button>

      </div>
    </div>
  )
}
