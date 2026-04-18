import { useState, useCallback } from 'react'
import { useGameSession } from '../game/GameSessionProvider'
import { RandomStringMode, ScaleMode, SCALE_LABELS, SCALE_TYPES } from '../game/GameMode'
import type { Difficulty } from '../game/GameMode'
import { NOTE_NAMES } from '../music-theory/MusicTheory'
import type { StringName, ScaleType, NoteName } from '../music-theory/MusicTheory'

type ModeType = 'random-string' | 'scale'

const STRINGS: StringName[] = ['E', 'A', 'D', 'G', 'B', 'e']

export default function ModeSelector() {
  const { startSession } = useGameSession()

  const [modeType, setModeType] = useState<ModeType>('random-string')
  const [selectedString, setSelectedString] = useState<StringName | null>(null)
  const [selectedKey, setSelectedKey] = useState<NoteName | null>(null)
  const [selectedScale, setSelectedScale] = useState<ScaleType | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('learning')

  const canStart =
    modeType === 'random-string'
      ? selectedString !== null
      : selectedKey !== null && selectedScale !== null

  const handleStart = useCallback(() => {
    if (modeType === 'random-string') {
      if (selectedString === null) return
      startSession(new RandomStringMode(selectedString), difficulty)
    } else {
      if (selectedKey === null || selectedScale === null) return
      startSession(new ScaleMode(selectedKey, selectedScale), difficulty)
    }
  }, [modeType, selectedString, selectedKey, selectedScale, difficulty, startSession])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm flex flex-col gap-8">

        <h1 className="text-3xl font-bold tracking-wide text-center">Fretboard Learner</h1>

        {/* Mode type toggle */}
        <section aria-labelledby="mode-label">
          <p id="mode-label" className="text-xs uppercase tracking-widest text-zinc-400 mb-3">
            Mode
          </p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="mode-label">
            {(['random-string', 'scale'] as ModeType[]).map((m) => (
              <button
                key={m}
                aria-pressed={modeType === m}
                onClick={() => setModeType(m)}
                className={[
                  'py-3 rounded-lg text-sm font-medium transition-colors',
                  modeType === m
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
                ].join(' ')}
              >
                {m === 'random-string' ? 'Random String' : 'Scale'}
              </button>
            ))}
          </div>
        </section>

        {/* Random String controls */}
        {modeType === 'random-string' && (
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
        )}

        {/* Scale controls */}
        {modeType === 'scale' && (
          <>
            <section aria-labelledby="key-label">
              <p id="key-label" className="text-xs uppercase tracking-widest text-zinc-400 mb-3">
                Root key
              </p>
              <div className="grid grid-cols-4 gap-2" role="group" aria-labelledby="key-label">
                {NOTE_NAMES.map((key) => (
                  <button
                    key={key}
                    aria-pressed={selectedKey === key}
                    onClick={() => setSelectedKey(key)}
                    className={[
                      'py-3 rounded-lg text-sm font-bold transition-colors',
                      selectedKey === key
                        ? 'bg-amber-500 text-zinc-950'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
                    ].join(' ')}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </section>

            <section aria-labelledby="scale-label">
              <p id="scale-label" className="text-xs uppercase tracking-widest text-zinc-400 mb-3">
                Scale
              </p>
              <div className="flex flex-col gap-2" role="group" aria-labelledby="scale-label">
                {SCALE_TYPES.map((scale) => (
                  <button
                    key={scale}
                    aria-pressed={selectedScale === scale}
                    onClick={() => setSelectedScale(scale)}
                    className={[
                      'py-3 rounded-lg text-sm font-medium transition-colors',
                      selectedScale === scale
                        ? 'bg-amber-500 text-zinc-950'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700',
                    ].join(' ')}
                  >
                    {SCALE_LABELS[scale]}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}

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
          disabled={!canStart}
          className="w-full py-4 rounded-xl text-base font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-amber-500 text-zinc-950 hover:bg-amber-400 disabled:hover:bg-amber-500"
        >
          Start
        </button>

      </div>
    </div>
  )
}
