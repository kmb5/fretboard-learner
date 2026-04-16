import { GameSessionProvider, useGameSession } from './game/GameSessionProvider'
import ModeSelector from './ui/ModeSelector'
import GameScreen from './ui/GameScreen'

function AppRoutes() {
  const { state } = useGameSession()
  return state.status === 'idle' ? <ModeSelector /> : <GameScreen />
}

export default function App() {
  return (
    <GameSessionProvider>
      <AppRoutes />
    </GameSessionProvider>
  )
}
