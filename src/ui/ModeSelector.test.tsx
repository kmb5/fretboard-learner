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
// Mode type toggle
// ---------------------------------------------------------------------------

describe('ModeSelector — mode type toggle', () => {
  it('defaults to Random String mode', () => {
    renderModeSelector()
    expect(screen.getByRole('button', { name: /random string/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /^scale$/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('switches to Scale mode when Scale is clicked', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /^scale$/i }))
    expect(screen.getByRole('button', { name: /^scale$/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /random string/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('hides the string picker when Scale mode is active', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /^scale$/i }))
    // 'e' (high e string, lowercase) is unique to the string picker — not in the key picker
    expect(screen.queryByRole('button', { name: 'e' })).not.toBeInTheDocument()
  })

  it('hides key and scale pickers when Random String mode is active', () => {
    renderModeSelector()
    expect(screen.queryByRole('button', { name: 'Major' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^C$/ })).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Scale mode — key picker
// ---------------------------------------------------------------------------

describe('ModeSelector — key picker', () => {
  it('renders all 12 chromatic key buttons when Scale mode is active', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /^scale$/i }))
    // Natural notes have exact names; accidentals display as "C♯/D♭" etc., so use regex.
    for (const key of ['C', 'D', 'E', 'F', 'G', 'A', 'B']) {
      expect(screen.getByRole('button', { name: new RegExp(`^${key}$`) })).toBeInTheDocument()
    }
    for (const sharp of ['C♯', 'D♯', 'F♯', 'G♯', 'A♯']) {
      expect(screen.getByRole('button', { name: new RegExp(sharp) })).toBeInTheDocument()
    }
  })

  it('marks a key button as pressed when clicked', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /^scale$/i }))
    const btn = screen.getByRole('button', { name: /^C$/ })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    await user.click(btn)
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })
})

// ---------------------------------------------------------------------------
// Scale mode — scale type picker
// ---------------------------------------------------------------------------

describe('ModeSelector — scale picker', () => {
  it('renders all 7 scale type buttons when Scale mode is active', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /^scale$/i }))
    for (const label of [
      'Major', 'Natural Minor', 'Augmented', 'Blues',
      'Major Pentatonic', 'Minor Pentatonic', 'Phrygian Dominant',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('marks a scale button as pressed when clicked', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /^scale$/i }))
    const btn = screen.getByRole('button', { name: 'Major' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    await user.click(btn)
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })
})

// ---------------------------------------------------------------------------
// Scale mode — Start button enabled state
// ---------------------------------------------------------------------------

describe('ModeSelector — mode switch state preservation', () => {
  it('disables Start when switching from filled Scale to empty Random String', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    // Fill Scale mode — Start becomes enabled.
    await user.click(screen.getByRole('button', { name: /^scale$/i }))
    await user.click(screen.getByRole('button', { name: /^G$/ }))
    await user.click(screen.getByRole('button', { name: 'Blues' }))
    expect(screen.getByRole('button', { name: /start/i })).toBeEnabled()
    // Switch to Random String with no string selected — Start must be disabled.
    await user.click(screen.getByRole('button', { name: /random string/i }))
    expect(screen.getByRole('button', { name: /start/i })).toBeDisabled()
    // Switch back to Scale — previous selections are preserved, Start is enabled again.
    await user.click(screen.getByRole('button', { name: /^scale$/i }))
    expect(screen.getByRole('button', { name: /start/i })).toBeEnabled()
  })
})

describe('ModeSelector — Start button in Scale mode', () => {
  it('is disabled when neither key nor scale is selected', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /^scale$/i }))
    expect(screen.getByRole('button', { name: /start/i })).toBeDisabled()
  })

  it('is disabled when only the key is selected', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /^scale$/i }))
    await user.click(screen.getByRole('button', { name: /^G$/ }))
    expect(screen.getByRole('button', { name: /start/i })).toBeDisabled()
  })

  it('is disabled when only the scale is selected', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /^scale$/i }))
    await user.click(screen.getByRole('button', { name: 'Blues' }))
    expect(screen.getByRole('button', { name: /start/i })).toBeDisabled()
  })

  it('is enabled when both key and scale are selected', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /^scale$/i }))
    await user.click(screen.getByRole('button', { name: /^G$/ }))
    await user.click(screen.getByRole('button', { name: 'Blues' }))
    expect(screen.getByRole('button', { name: /start/i })).toBeEnabled()
  })
})

// ---------------------------------------------------------------------------
// Navigation on Start
// ---------------------------------------------------------------------------

describe('ModeSelector — navigation on Start (Random String)', () => {
  it('transitions to GameScreen when Start is pressed', async () => {
    const user = userEvent.setup()
    const { default: App } = await import('../App')
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'A' }))
    await user.click(screen.getByRole('button', { name: /start/i }))
    expect(screen.queryByRole('button', { name: /start/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /quit/i })).toBeInTheDocument()
  })
})

describe('ModeSelector — navigation on Start (Scale)', () => {
  it('transitions to GameScreen when Start is pressed in Scale mode', async () => {
    const user = userEvent.setup()
    const { default: App } = await import('../App')
    render(<App />)
    await user.click(screen.getByRole('button', { name: /^scale$/i }))
    await user.click(screen.getByRole('button', { name: /^A$/ }))
    await user.click(screen.getByRole('button', { name: 'Major' }))
    await user.click(screen.getByRole('button', { name: /start/i }))
    expect(screen.queryByRole('button', { name: /start/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /quit/i })).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Chord Tones mode
// ---------------------------------------------------------------------------

describe('ModeSelector — mode type toggle (Chord Tones)', () => {
  it('renders the Chord Tones mode button', () => {
    renderModeSelector()
    expect(screen.getByRole('button', { name: /chord tones/i })).toBeInTheDocument()
  })

  it('switches to Chord Tones mode when clicked', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /chord tones/i }))
    expect(screen.getByRole('button', { name: /chord tones/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /random string/i })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: /^scale$/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('hides the string picker when Chord Tones mode is active', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /chord tones/i }))
    // 'e' (lowercase high-e string) only appears in the string picker
    expect(screen.queryByRole('button', { name: 'e' })).not.toBeInTheDocument()
  })
})

describe('ModeSelector — key picker (Chord Tones)', () => {
  it('renders all 12 chromatic key buttons when Chord Tones mode is active', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /chord tones/i }))
    // Natural notes have exact names; accidentals display as "C♯/D♭" etc., so use regex.
    for (const key of ['C', 'D', 'E', 'F', 'G', 'A', 'B']) {
      expect(screen.getByRole('button', { name: new RegExp(`^${key}$`) })).toBeInTheDocument()
    }
    for (const sharp of ['C♯', 'D♯', 'F♯', 'G♯', 'A♯']) {
      expect(screen.getByRole('button', { name: new RegExp(sharp) })).toBeInTheDocument()
    }
  })

  it('shared key selection persists when switching between Scale and Chord Tones', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    // Select G in Scale mode
    await user.click(screen.getByRole('button', { name: /^scale$/i }))
    await user.click(screen.getByRole('button', { name: /^G$/ }))
    expect(screen.getByRole('button', { name: /^G$/ })).toHaveAttribute('aria-pressed', 'true')
    // Switch to Chord Tones — G key should still be pressed
    await user.click(screen.getByRole('button', { name: /chord tones/i }))
    expect(screen.getByRole('button', { name: /^G$/ })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('ModeSelector — chord type picker', () => {
  it('renders all 7 chord type buttons when Chord Tones mode is active', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /chord tones/i }))
    for (const label of [
      'Major', 'Minor', 'Dominant 7', 'Major 7', 'Minor 7', 'Diminished', 'Augmented',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('marks a chord type button as pressed when clicked', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /chord tones/i }))
    const btn = screen.getByRole('button', { name: 'Minor' })
    expect(btn).toHaveAttribute('aria-pressed', 'false')
    await user.click(btn)
    expect(btn).toHaveAttribute('aria-pressed', 'true')
  })

  it('does not show chord type picker in Scale mode', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /^scale$/i }))
    expect(screen.queryByRole('button', { name: 'Dominant 7' })).not.toBeInTheDocument()
  })

  it('does not show chord type picker in Random String mode', () => {
    renderModeSelector()
    expect(screen.queryByRole('button', { name: 'Dominant 7' })).not.toBeInTheDocument()
  })
})

describe('ModeSelector — Start button in Chord Tones mode', () => {
  it('is disabled when neither key nor chord type is selected', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /chord tones/i }))
    expect(screen.getByRole('button', { name: /start/i })).toBeDisabled()
  })

  it('is disabled when only the key is selected', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /chord tones/i }))
    await user.click(screen.getByRole('button', { name: /^A$/ }))
    expect(screen.getByRole('button', { name: /start/i })).toBeDisabled()
  })

  it('is disabled when only the chord type is selected', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /chord tones/i }))
    await user.click(screen.getByRole('button', { name: 'Major' }))
    expect(screen.getByRole('button', { name: /start/i })).toBeDisabled()
  })

  it('is enabled when both key and chord type are selected', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /chord tones/i }))
    await user.click(screen.getByRole('button', { name: /^A$/ }))
    await user.click(screen.getByRole('button', { name: 'Major' }))
    expect(screen.getByRole('button', { name: /start/i })).toBeEnabled()
  })
})

describe('ModeSelector — mode switch state preservation (Chord Tones)', () => {
  it('disables Start when switching from filled Chord Tones to empty Random String', async () => {
    const user = userEvent.setup()
    renderModeSelector()
    await user.click(screen.getByRole('button', { name: /chord tones/i }))
    await user.click(screen.getByRole('button', { name: /^G$/ }))
    await user.click(screen.getByRole('button', { name: 'Minor' }))
    expect(screen.getByRole('button', { name: /start/i })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: /random string/i }))
    expect(screen.getByRole('button', { name: /start/i })).toBeDisabled()
  })
})

describe('ModeSelector — navigation on Start (Chord Tones)', () => {
  it('transitions to GameScreen when Start is pressed in Chord Tones mode', async () => {
    const user = userEvent.setup()
    const { default: App } = await import('../App')
    render(<App />)
    await user.click(screen.getByRole('button', { name: /chord tones/i }))
    await user.click(screen.getByRole('button', { name: /^A$/ }))
    await user.click(screen.getByRole('button', { name: 'Minor' }))
    await user.click(screen.getByRole('button', { name: /start/i }))
    expect(screen.queryByRole('button', { name: /start/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /quit/i })).toBeInTheDocument()
  })
})
