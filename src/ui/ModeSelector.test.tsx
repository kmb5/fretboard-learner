import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { GameSessionProvider } from '../game/GameSessionProvider'
import ModeSelector from './ModeSelector'

// GameScreen (rendered after Start) starts the PitchDetector; stub it out so
// jsdom doesn't hit navigator.mediaDevices (which doesn't exist in the test env).
vi.mock('../pitch-detector/PitchDetector', () => ({
  createPitchDetector: () => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn(),
    onNote: vi.fn(),
  }),
}))

function renderModeSelector() {
  return render(
    <GameSessionProvider>
      <ModeSelector />
    </GameSessionProvider>,
  )
}

// ---------------------------------------------------------------------------
// Static structure
// ---------------------------------------------------------------------------

describe('ModeSelector — static structure', () => {
  it('renders all 6 string buttons', () => {
    renderModeSelector()
    for (const s of ['E', 'A', 'D', 'G', 'B', 'e']) {
      expect(screen.getByRole('button', { name: s })).toBeInTheDocument()
    }
  })

  it('renders Learning and Practice difficulty buttons', () => {
    renderModeSelector()
    expect(screen.getByRole('button', { name: /learning/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /practice/i })).toBeInTheDocument()
  })

  it('renders the Start button', () => {
    renderModeSelector()
    expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Start button enabled/disabled
// ---------------------------------------------------------------------------

describe('ModeSelector — Start button state', () => {
  it('is disabled when no string is selected', () => {
    renderModeSelector()
    expect(screen.getByRole('button', { name: /start/i })).toBeDisabled()
  })

  it('is enabled after a string is selected', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: 'A' }))
    expect(screen.getByRole('button', { name: /start/i })).toBeEnabled()
  })

  it('remains enabled when the selected string changes', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: 'E' }))
    await user.click(screen.getByRole('button', { name: 'G' }))
    expect(screen.getByRole('button', { name: /start/i })).toBeEnabled()
  })
})

// ---------------------------------------------------------------------------
// String selection
// ---------------------------------------------------------------------------

describe('ModeSelector — string selection', () => {
  it('marks a string button as pressed when clicked', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    const btn = screen.getByRole('button', { name: 'D' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    await user.click(btn)
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('deselects the previous string when a new one is clicked', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: 'E' }))
    await user.click(screen.getByRole('button', { name: 'B' }))
    expect(screen.getByRole('button', { name: 'E' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'B' })).toHaveAttribute('aria-pressed', 'true')
  })
})

// ---------------------------------------------------------------------------
// Difficulty toggle
// ---------------------------------------------------------------------------

describe('ModeSelector — difficulty toggle', () => {
  it('defaults to Learning', () => {
    renderModeSelector()
    expect(screen.getByRole('button', { name: /learning/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /practice/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('switches to Practice when clicked', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /practice/i }))
    expect(screen.getByRole('button', { name: /practice/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /learning/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('switches back to Learning when clicked again', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /practice/i }))
    await user.click(screen.getByRole('button', { name: /learning/i }))
    expect(screen.getByRole('button', { name: /learning/i })).toHaveAttribute('aria-pressed', 'true')
  })
})

// ---------------------------------------------------------------------------
// Navigation on Start
// ---------------------------------------------------------------------------

describe('ModeSelector — navigation on Start', () => {
  it('transitions away from ModeSelector when Start is pressed', async () => {
    const user = userEvent.setup()
    // Render the full App so AppRoutes can swap ModeSelector → GameScreen
    const { default: App } = await import('../App')
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'A' }))
    await user.click(screen.getByRole('button', { name: /start/i }))
    // ModeSelector should no longer be visible (GameScreen stub takes over)
    expect(screen.queryByRole('button', { name: /start/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /quit/i })).toBeInTheDocument()
  })
})
