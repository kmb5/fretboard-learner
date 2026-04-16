import { useGameSession } from '../game/GameSessionProvider'

/**
 * Stub game screen — placeholder until slice #8.
 * Shows the current target note and a Quit button.
 */
export default function GameScreen() {
  const { state, quit } = useGameSession()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-3xl font-bold tracking-wide">Fretboard Learner</h1>

      <div className="text-center">
        <p className="text-zinc-400 text-sm uppercase tracking-widest mb-2">Play this note</p>
        <p className="text-7xl font-bold text-amber-400">{state.currentNote}</p>
      </div>

      <p className="text-zinc-500 text-sm">Score: {state.score}</p>

      <button
        onClick={quit}
        className="px-6 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
      >
        Quit
      </button>
    </div>
  )
}
