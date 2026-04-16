import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getMostFrequent,
  WebAudioPitchDetector,
  FRAME_WINDOW,
  CLARITY_THRESHOLD,
  BUFFER_SIZE,
  type AudioSource,
} from './PitchDetector'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Generates a pure sine wave Float32Array at the given frequency. */
function makeSineFrame(
  freq: number,
  sampleRate = 44100,
  length = BUFFER_SIZE,
): Float32Array {
  const buf = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    buf[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate)
  }
  return buf
}

/**
 * A controllable AudioSource for testing.
 * Holds the frame callback so tests can push frames on demand.
 */
class MockAudioSource implements AudioSource {
  private callback: ((samples: Float32Array, sampleRate: number) => void) | null =
    null
  startCount = 0
  stopCount = 0

  async start(
    onFrame: (samples: Float32Array, sampleRate: number) => void,
  ): Promise<void> {
    this.callback = onFrame
    this.startCount++
  }

  stop(): void {
    this.callback = null
    this.stopCount++
  }

  pushFrame(samples: Float32Array, sampleRate = 44100): void {
    this.callback?.(samples, sampleRate)
  }
}

// Pre-built frames used throughout (computed once, reused)
const A4_FRAME = makeSineFrame(440) // A4 → "A"
const E4_FRAME = makeSineFrame(329.63) // E4 → "E"
const SILENT_FRAME = new Float32Array(BUFFER_SIZE) // silence → clarity = 0

// ---------------------------------------------------------------------------
// getMostFrequent
// ---------------------------------------------------------------------------

describe('getMostFrequent', () => {
  it('returns the single element when array has one item', () => {
    expect(getMostFrequent(['A'])).toBe('A')
  })

  it('returns the most frequent element', () => {
    expect(getMostFrequent(['A', 'A', 'E', 'A', 'E'])).toBe('A')
  })

  it('returns the less-frequent item when that wins', () => {
    expect(getMostFrequent(['E', 'E', 'A'])).toBe('E')
  })

  it('handles an array where all elements are the same', () => {
    expect(getMostFrequent(['G', 'G', 'G', 'G'])).toBe('G')
  })

  it('returns one of the tied elements deterministically', () => {
    // Both appear once — just assert it is one of the valid options
    const result = getMostFrequent(['A', 'E'])
    expect(['A', 'E']).toContain(result)
  })

  it('throws when called with an empty array', () => {
    expect(() => getMostFrequent([])).toThrow('getMostFrequent called with empty array')
  })
})

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('module constants', () => {
  it('FRAME_WINDOW is 10', () => {
    expect(FRAME_WINDOW).toBe(10)
  })

  it('CLARITY_THRESHOLD is between 0 and 1', () => {
    expect(CLARITY_THRESHOLD).toBeGreaterThan(0)
    expect(CLARITY_THRESHOLD).toBeLessThanOrEqual(1)
  })

  it('BUFFER_SIZE is a power of two ≥ 1024', () => {
    expect(BUFFER_SIZE).toBeGreaterThanOrEqual(1024)
    expect(BUFFER_SIZE & (BUFFER_SIZE - 1)).toBe(0) // power of two
  })
})

// ---------------------------------------------------------------------------
// WebAudioPitchDetector — aggregation behaviour
// ---------------------------------------------------------------------------

describe('WebAudioPitchDetector', () => {
  let mockSource: MockAudioSource
  let detector: WebAudioPitchDetector

  beforeEach(() => {
    mockSource = new MockAudioSource()
    detector = new WebAudioPitchDetector(mockSource)
  })

  it('does not emit before 10 valid frames', async () => {
    const cb = vi.fn()
    detector.onNote(cb)
    await detector.start()

    for (let i = 0; i < FRAME_WINDOW - 1; i++) {
      mockSource.pushFrame(A4_FRAME)
    }

    expect(cb).not.toHaveBeenCalled()
  })

  it('emits the most-frequent note after exactly 10 valid frames', async () => {
    const cb = vi.fn()
    detector.onNote(cb)
    await detector.start()

    for (let i = 0; i < FRAME_WINDOW; i++) {
      mockSource.pushFrame(A4_FRAME)
    }

    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith('A')
  })

  it('emits the majority note when frames are mixed (7 A + 3 E → A)', async () => {
    const cb = vi.fn()
    detector.onNote(cb)
    await detector.start()

    for (let i = 0; i < 7; i++) mockSource.pushFrame(A4_FRAME)
    for (let i = 0; i < 3; i++) mockSource.pushFrame(E4_FRAME)

    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith('A')
  })

  it('resets the window after emission so the next 10 frames form a new window', async () => {
    const cb = vi.fn()
    detector.onNote(cb)
    await detector.start()

    // First window → 1 emission
    for (let i = 0; i < FRAME_WINDOW; i++) mockSource.pushFrame(A4_FRAME)
    expect(cb).toHaveBeenCalledTimes(1)

    // 9 more frames — not yet a second emission
    for (let i = 0; i < FRAME_WINDOW - 1; i++) mockSource.pushFrame(E4_FRAME)
    expect(cb).toHaveBeenCalledTimes(1)

    // 10th frame completes the second window
    mockSource.pushFrame(E4_FRAME)
    expect(cb).toHaveBeenCalledTimes(2)
    expect(cb).toHaveBeenNthCalledWith(2, 'E')
  })

  it('ignores frames below the clarity threshold (silent frames do not count)', async () => {
    const cb = vi.fn()
    detector.onNote(cb)
    await detector.start()

    // 9 valid frames + 5 silent frames — still not a full window
    for (let i = 0; i < FRAME_WINDOW - 1; i++) mockSource.pushFrame(A4_FRAME)
    for (let i = 0; i < 5; i++) mockSource.pushFrame(SILENT_FRAME)

    expect(cb).not.toHaveBeenCalled()
  })

  it('stop() calls audioSource.stop()', async () => {
    await detector.start()
    detector.stop()
    expect(mockSource.stopCount).toBe(1)
  })

  it('stop() resets the window so a restart requires 10 new frames', async () => {
    const cb = vi.fn()
    detector.onNote(cb)
    await detector.start()

    // Accumulate 9 frames
    for (let i = 0; i < FRAME_WINDOW - 1; i++) mockSource.pushFrame(A4_FRAME)

    detector.stop()
    // Restart (same mock source re-registers callback)
    await detector.start()

    // Only 1 frame — window should have been cleared on stop
    mockSource.pushFrame(A4_FRAME)
    expect(cb).not.toHaveBeenCalled()

    // Complete a full window of 10
    for (let i = 0; i < FRAME_WINDOW - 1; i++) mockSource.pushFrame(A4_FRAME)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('onNote callback can be registered before start', async () => {
    const cb = vi.fn()
    detector.onNote(cb) // register before start
    await detector.start()

    for (let i = 0; i < FRAME_WINDOW; i++) mockSource.pushFrame(A4_FRAME)

    expect(cb).toHaveBeenCalledWith('A')
  })

  it('calling start() twice discards any partial window from the first call', async () => {
    const cb = vi.fn()
    detector.onNote(cb)
    await detector.start()

    // Accumulate 9 frames — one short of triggering
    for (let i = 0; i < FRAME_WINDOW - 1; i++) mockSource.pushFrame(A4_FRAME)

    // Second start() must reset the window
    await detector.start()

    // Those 9 frames should be gone — 1 new frame is not enough
    mockSource.pushFrame(A4_FRAME)
    expect(cb).not.toHaveBeenCalled()

    // Complete a full fresh window
    for (let i = 0; i < FRAME_WINDOW - 1; i++) mockSource.pushFrame(A4_FRAME)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('replaces the callback when onNote is called again', async () => {
    const cb1 = vi.fn()
    const cb2 = vi.fn()
    detector.onNote(cb1)
    await detector.start()
    detector.onNote(cb2) // replace

    for (let i = 0; i < FRAME_WINDOW; i++) mockSource.pushFrame(A4_FRAME)

    expect(cb1).not.toHaveBeenCalled()
    expect(cb2).toHaveBeenCalledWith('A')
  })
})
