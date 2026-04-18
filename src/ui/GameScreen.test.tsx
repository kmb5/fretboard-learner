import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SILENCE_RESET_MS } from './GameScreen'

// ---------------------------------------------------------------------------
// Mock PitchDetector
// ---------------------------------------------------------------------------

// Capture the onNote callback so tests can fire synthetic notes.
let capturedOnNote: ((note: string) => void) | null = null

const mockDetector = {
  start: vi.fn().mockResolvedValue(undefined),
  stop: vi.fn(),
  onNote: vi.fn().mockImplementation((cb: (note: string) => void) => {
    capturedOnNote = cb
  }),
}

vi.mock('../pitch-detector/PitchDetector', () => ({
  createPitchDetector: () => mockDetector,
}))

// ---------------------------------------------------------------------------
// Helper: render App, pick a string, and click Start
// ---------------------------------------------------------------------------

async function navigateToGameScreen(difficulty?: 'practice') {
  const user = userEvent.setup()
  const { default: App } = await import('../App')
  render(<App />)
  await user.click(screen.getByRole('button', { name: 'A' }))
  if (difficulty === 'practice') {
    await user.click(screen.getByRole('button', { name: /practice/i }))
  }
  await user.click(screen.getByRole('button', { name: /start/i }))
  // Flush promise microtasks so detector.start() resolves.
  await act(async () => {})
  return user
}

beforeEach(() => {
  capturedOnNote = null
  mockDetector.start.mockClear()
  mockDetector.start.mockResolvedValue(undefined)
  mockDetector.stop.mockClear()
  mockDetector.onNote.mockClear()
  mockDetector.onNote.mockImplementation((cb: (note: string) => void) => {
    capturedOnNote = cb
  })
})

// ---------------------------------------------------------------------------
// Static structure
// ---------------------------------------------------------------------------

describe('GameScreen — static structure', () => {
  it('renders the target note, heard indicator, score, and quit button', async () => {
    await navigateToGameScreen()
    expect(screen.getByTestId('current-note').textContent).toMatch(/^[A-G][♯♭]?$/)
    expect(screen.getByTestId('heard-note').textContent).toBe('—')
    expect(screen.getByTestId('score').textContent).toMatch(/^Score:/)
    expect(screen.getByRole('button', { name: /quit/i })).toBeInTheDocument()
  })

  it('renders the fretboard SVG', async () => {
    await navigateToGameScreen()
    expect(screen.getByRole('img', { name: /fretboard/i })).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// PitchDetector lifecycle
// ---------------------------------------------------------------------------

describe('GameScreen — PitchDetector lifecycle', () => {
  it('starts the detector on mount', async () => {
    await navigateToGameScreen()
    expect(mockDetector.start).toHaveBeenCalledOnce()
  })

  it('stops the detector when Quit is clicked', async () => {
    const user = await navigateToGameScreen()
    await user.click(screen.getByRole('button', { name: /quit/i }))
    expect(mockDetector.stop).toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// Heard indicator
// ---------------------------------------------------------------------------

describe('GameScreen — Heard indicator', () => {
  it('shows — before any note is detected', async () => {
    await navigateToGameScreen()
    expect(screen.getByTestId('heard-note').textContent).toBe('—')
  })

  it('updates when a note is received from the detector', async () => {
    await navigateToGameScreen()
    await act(async () => { capturedOnNote?.('F#') })
    expect(screen.getByTestId('heard-note').textContent).toBe('F♯')
  })
})

// ---------------------------------------------------------------------------
// Silence reset timer
// ---------------------------------------------------------------------------

describe('GameScreen — silence reset timer', () => {
  afterEach(() => { vi.useRealTimers() })

  it('resets heard note to — after SILENCE_RESET_MS of silence', async () => {
    await navigateToGameScreen()
    vi.useFakeTimers()

    await act(async () => { capturedOnNote?.('F#') })
    expect(screen.getByTestId('heard-note').textContent).toBe('F♯')

    await act(async () => { vi.advanceTimersByTime(SILENCE_RESET_MS) })
    expect(screen.getByTestId('heard-note').textContent).toBe('—')
  })

  it('does not reset before SILENCE_RESET_MS has elapsed', async () => {
    await navigateToGameScreen()
    vi.useFakeTimers()

    await act(async () => { capturedOnNote?.('F#') })
    await act(async () => { vi.advanceTimersByTime(SILENCE_RESET_MS - 1) })
    expect(screen.getByTestId('heard-note').textContent).toBe('F♯')
  })

  it('resets the timer when a second note arrives before the timeout', async () => {
    await navigateToGameScreen()
    vi.useFakeTimers()

    // First note, then a second note arrives just before the timer fires.
    await act(async () => { capturedOnNote?.('F#') })
    await act(async () => { vi.advanceTimersByTime(SILENCE_RESET_MS - 1) })
    await act(async () => { capturedOnNote?.('A') })
    // Still within SILENCE_RESET_MS of the second note — should still show 'A'.
    await act(async () => { vi.advanceTimersByTime(SILENCE_RESET_MS - 1) })
    expect(screen.getByTestId('heard-note').textContent).toBe('A')

    // Now the full SILENCE_RESET_MS has elapsed since the second note.
    await act(async () => { vi.advanceTimersByTime(1) })
    expect(screen.getByTestId('heard-note').textContent).toBe('—')
  })
})

// ---------------------------------------------------------------------------
// Note state transitions
// ---------------------------------------------------------------------------

describe('GameScreen — correct note', () => {
  it('increments the score when the correct note is played', async () => {
    await navigateToGameScreen()
    const target = screen.getByTestId('current-note').textContent!
    await act(async () => { capturedOnNote?.(target) })
    expect(screen.getByTestId('score').textContent).toMatch(/Score:\s*1/)
  })

  it('shows green highlights on correct', async () => {
    await navigateToGameScreen()
    const target = screen.getByTestId('current-note').textContent!
    await act(async () => { capturedOnNote?.(target) })
    const greenDots = document.querySelectorAll('[data-color="green"]')
    expect(greenDots.length).toBeGreaterThan(0)
  })
})

describe('GameScreen — wrong note', () => {
  it('does not increment the score when a wrong note is played', async () => {
    await navigateToGameScreen()
    const target = screen.getByTestId('current-note').textContent!
    // 'A' and 'B' are present on every string's fret pool, so one of them
    // is guaranteed to differ from any possible target note.
    const wrongNote = target === 'A' ? 'B' : 'A'
    await act(async () => { capturedOnNote?.(wrongNote) })
    expect(screen.getByTestId('score').textContent).toMatch(/Score:\s*0/)
  })
})

// ---------------------------------------------------------------------------
// Fretboard highlights — Learning mode
// ---------------------------------------------------------------------------

describe('GameScreen — highlights in Learning mode', () => {
  it('shows amber highlights while waiting', async () => {
    await navigateToGameScreen() // defaults to learning
    const amberDots = document.querySelectorAll('[data-color="amber"]')
    expect(amberDots.length).toBeGreaterThan(0)
  })

  it('shows red highlights when a wrong note is played', async () => {
    await navigateToGameScreen()
    const target = screen.getByTestId('current-note').textContent!
    // 'A' and 'B' are present on every string's fret pool, so one of them
    // is guaranteed to differ from any possible target note.
    const wrongNote = target === 'A' ? 'B' : 'A'
    await act(async () => { capturedOnNote?.(wrongNote) })
    const redDots = document.querySelectorAll('[data-color="red"]')
    expect(redDots.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Fretboard highlights — Practice mode
// ---------------------------------------------------------------------------

describe('GameScreen — highlights in Practice mode', () => {
  it('shows no amber highlights while waiting', async () => {
    await navigateToGameScreen('practice')
    const amberDots = document.querySelectorAll('[data-color="amber"]')
    expect(amberDots.length).toBe(0)
  })

  it('still shows green highlights on correct', async () => {
    await navigateToGameScreen('practice')
    const target = screen.getByTestId('current-note').textContent!
    await act(async () => { capturedOnNote?.(target) })
    const greenDots = document.querySelectorAll('[data-color="green"]')
    expect(greenDots.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Microphone errors
// ---------------------------------------------------------------------------

describe('GameScreen — mic permission denied (NotAllowedError)', () => {
  it('shows MicPermissionPrompt with the denied message', async () => {
    mockDetector.start.mockRejectedValue(
      new DOMException('Permission denied', 'NotAllowedError'),
    )
    await navigateToGameScreen()
    expect(screen.getByText(/microphone access was denied/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('retries mic access when Retry is clicked', async () => {
    mockDetector.start
      .mockRejectedValueOnce(new DOMException('Permission denied', 'NotAllowedError'))
      .mockResolvedValue(undefined)
    const user = await navigateToGameScreen()
    await user.click(screen.getByRole('button', { name: /retry/i }))
    await act(async () => {})
    expect(mockDetector.start).toHaveBeenCalledTimes(2)
    // Main game screen should be visible again.
    expect(screen.getByTestId('current-note')).toBeInTheDocument()
  })
})

describe('GameScreen — no microphone (NotFoundError)', () => {
  it('shows MicPermissionPrompt with the not-found message', async () => {
    mockDetector.start.mockRejectedValue(
      new DOMException('No device', 'NotFoundError'),
    )
    await navigateToGameScreen()
    expect(screen.getByText(/no microphone found/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })
})
