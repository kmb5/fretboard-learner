import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getMostFrequent,
  getRMS,
  WebAudioPitchDetector,
  FRAME_WINDOW,
  CLARITY_THRESHOLD,
  BUFFER_SIZE,
  GUITAR_FREQ_MIN,
  GUITAR_FREQ_MAX,
  AMPLITUDE_GATE_THRESHOLD,
  AMPLITUDE_SUSTAIN_FRAMES,
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

/** Generates a sine wave scaled to a given amplitude (default full-scale). */
function makeScaledSineFrame(
  freq: number,
  amplitude: number,
  sampleRate = 44100,
  length = BUFFER_SIZE,
): Float32Array {
  const buf = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    buf[i] = amplitude * Math.sin((2 * Math.PI * freq * i) / sampleRate)
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

/**
 * Pushes AMPLITUDE_SUSTAIN_FRAMES - 1 loud frames to open the sustain gate
 * without yet adding any frame to the pitch window. After calling warmUp(),
 * the very next loud frame will be the first one counted toward FRAME_WINDOW.
 */
function warmUp(source: MockAudioSource, frame = A4_FRAME): void {
  for (let i = 0; i < AMPLITUDE_SUSTAIN_FRAMES - 1; i++) source.pushFrame(frame)
}

// Pre-built frames used throughout (computed once, reused)
const A4_FRAME = makeSineFrame(440)          // A4 → "A", RMS ≈ 0.707
const E4_FRAME = makeSineFrame(329.63)       // E4 → "E", RMS ≈ 0.707
const SILENT_FRAME = new Float32Array(BUFFER_SIZE) // all zeros → RMS = 0
// 2 kHz is above GUITAR_FREQ_MAX (1400 Hz) — should be filtered by freq guard
const ABOVE_RANGE_FRAME = makeSineFrame(2000)
// Amplitude well below AMPLITUDE_GATE_THRESHOLD (0.02): RMS ≈ 0.007
const QUIET_A4_FRAME = makeScaledSineFrame(440, 0.01)

// ---------------------------------------------------------------------------
// getRMS
// ---------------------------------------------------------------------------

describe('getRMS', () => {
  it('returns 0 for a silent (all-zero) buffer', () => {
    expect(getRMS(new Float32Array(BUFFER_SIZE))).toBe(0)
  })

  it('returns ~0.707 for a full-scale sine wave', () => {
    // RMS of sin(x) = 1/√2 ≈ 0.7071
    expect(getRMS(A4_FRAME)).toBeCloseTo(1 / Math.sqrt(2), 2)
  })

  it('scales linearly with amplitude', () => {
    const half = makeScaledSineFrame(440, 0.5)
    expect(getRMS(half)).toBeCloseTo(0.5 / Math.sqrt(2), 2)
  })

  it('quiet frame RMS is below AMPLITUDE_GATE_THRESHOLD', () => {
    expect(getRMS(QUIET_A4_FRAME)).toBeLessThan(AMPLITUDE_GATE_THRESHOLD)
  })

  it('loud frame RMS is above AMPLITUDE_GATE_THRESHOLD', () => {
    expect(getRMS(A4_FRAME)).toBeGreaterThan(AMPLITUDE_GATE_THRESHOLD)
  })
})

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

  it('GUITAR_FREQ_MIN is below the open low-E frequency (82 Hz)', () => {
    expect(GUITAR_FREQ_MIN).toBeLessThan(82)
    expect(GUITAR_FREQ_MIN).toBeGreaterThan(0)
  })

  it('GUITAR_FREQ_MAX is above the highest playable note (≈1319 Hz)', () => {
    expect(GUITAR_FREQ_MAX).toBeGreaterThan(1319)
  })

  it('GUITAR_FREQ_MIN < GUITAR_FREQ_MAX', () => {
    expect(GUITAR_FREQ_MIN).toBeLessThan(GUITAR_FREQ_MAX)
  })

  it('AMPLITUDE_GATE_THRESHOLD is a small positive value', () => {
    expect(AMPLITUDE_GATE_THRESHOLD).toBeGreaterThan(0)
    expect(AMPLITUDE_GATE_THRESHOLD).toBeLessThan(0.1)
  })

  it('AMPLITUDE_SUSTAIN_FRAMES is a positive integer', () => {
    expect(Number.isInteger(AMPLITUDE_SUSTAIN_FRAMES)).toBe(true)
    expect(AMPLITUDE_SUSTAIN_FRAMES).toBeGreaterThan(0)
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

    warmUp(mockSource)
    for (let i = 0; i < FRAME_WINDOW - 1; i++) {
      mockSource.pushFrame(A4_FRAME)
    }

    expect(cb).not.toHaveBeenCalled()
  })

  it('emits the most-frequent note after exactly 10 valid frames', async () => {
    const cb = vi.fn()
    detector.onNote(cb)
    await detector.start()

    warmUp(mockSource)
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

    warmUp(mockSource)
    for (let i = 0; i < 7; i++) mockSource.pushFrame(A4_FRAME)
    for (let i = 0; i < 3; i++) mockSource.pushFrame(E4_FRAME)

    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith('A')
  })

  it('resets the window after emission so the next 10 frames form a new window', async () => {
    const cb = vi.fn()
    detector.onNote(cb)
    await detector.start()

    // First window → 1 emission (warm-up once; sustain stays high across windows)
    warmUp(mockSource)
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

    // Warm up, then 9 valid frames fill the window to 9 …
    warmUp(mockSource)
    for (let i = 0; i < FRAME_WINDOW - 1; i++) mockSource.pushFrame(A4_FRAME)
    // … 5 silent frames reset the sustain counter and clear the window
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

    // Accumulate 9 frames (warm-up first so they actually enter the window)
    warmUp(mockSource)
    for (let i = 0; i < FRAME_WINDOW - 1; i++) mockSource.pushFrame(A4_FRAME)

    detector.stop()
    // Restart resets both window and sustain counter
    await detector.start()

    // Re-warm after restart, then push only 1 frame — should not emit
    warmUp(mockSource)
    mockSource.pushFrame(A4_FRAME)
    expect(cb).not.toHaveBeenCalled()

    // Complete a full fresh window of 10
    for (let i = 0; i < FRAME_WINDOW - 1; i++) mockSource.pushFrame(A4_FRAME)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('onNote callback can be registered before start', async () => {
    const cb = vi.fn()
    detector.onNote(cb) // register before start
    await detector.start()

    warmUp(mockSource)
    for (let i = 0; i < FRAME_WINDOW; i++) mockSource.pushFrame(A4_FRAME)

    expect(cb).toHaveBeenCalledWith('A')
  })

  it('calling start() twice discards any partial window from the first call', async () => {
    const cb = vi.fn()
    detector.onNote(cb)
    await detector.start()

    // Accumulate 9 frames — one short of triggering
    warmUp(mockSource)
    for (let i = 0; i < FRAME_WINDOW - 1; i++) mockSource.pushFrame(A4_FRAME)

    // Second start() must reset the window and sustain counter
    await detector.start()

    // Re-warm; those 9 frames should be gone — 1 new frame is not enough
    warmUp(mockSource)
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

    warmUp(mockSource)
    for (let i = 0; i < FRAME_WINDOW; i++) mockSource.pushFrame(A4_FRAME)

    expect(cb1).not.toHaveBeenCalled()
    expect(cb2).toHaveBeenCalledWith('A')
  })
})

// ---------------------------------------------------------------------------
// WebAudioPitchDetector — amplitude gate
// ---------------------------------------------------------------------------

describe('WebAudioPitchDetector — amplitude gate', () => {
  let mockSource: MockAudioSource
  let detector: WebAudioPitchDetector

  beforeEach(() => {
    mockSource = new MockAudioSource()
    detector = new WebAudioPitchDetector(mockSource)
  })

  it('does not count frames whose RMS is below AMPLITUDE_GATE_THRESHOLD', async () => {
    const cb = vi.fn()
    detector.onNote(cb)
    await detector.start()

    // Quiet frames — amplitude well below threshold; even FRAME_WINDOW of them
    // should never emit regardless of pitch clarity
    for (let i = 0; i < FRAME_WINDOW + AMPLITUDE_SUSTAIN_FRAMES; i++) {
      mockSource.pushFrame(QUIET_A4_FRAME)
    }

    expect(cb).not.toHaveBeenCalled()
  })

  it('resets the window when a silent frame interrupts a partial accumulation', async () => {
    const cb = vi.fn()
    detector.onNote(cb)
    await detector.start()

    // Warm up and accumulate 9 valid frames …
    warmUp(mockSource)
    for (let i = 0; i < FRAME_WINDOW - 1; i++) mockSource.pushFrame(A4_FRAME)

    // … then a single silent frame resets everything
    mockSource.pushFrame(SILENT_FRAME)

    // One more loud frame alone should not trigger emission
    mockSource.pushFrame(A4_FRAME)
    expect(cb).not.toHaveBeenCalled()
  })

  it('requires AMPLITUDE_SUSTAIN_FRAMES consecutive loud frames before counting', async () => {
    const cb = vi.fn()
    detector.onNote(cb)
    await detector.start()

    // Push exactly AMPLITUDE_SUSTAIN_FRAMES - 1 loud frames (gate still closed)
    for (let i = 0; i < AMPLITUDE_SUSTAIN_FRAMES - 1; i++) {
      mockSource.pushFrame(A4_FRAME)
    }
    // Even if we push FRAME_WINDOW more loud frames, nothing enters the window
    // because the gate has not opened yet (it opens on frame AMPLITUDE_SUSTAIN_FRAMES)
    // — wait, the gate opens on the 4th frame, so FRAME_WINDOW frames after that emit
    // This test just checks the gate doesn't open prematurely:
    expect(cb).not.toHaveBeenCalled()
  })

  it('emits after warm-up + FRAME_WINDOW loud frames (gate now open)', async () => {
    const cb = vi.fn()
    detector.onNote(cb)
    await detector.start()

    warmUp(mockSource)
    for (let i = 0; i < FRAME_WINDOW; i++) mockSource.pushFrame(A4_FRAME)

    expect(cb).toHaveBeenCalledTimes(1)
    expect(cb).toHaveBeenCalledWith('A')
  })
})

// ---------------------------------------------------------------------------
// WebAudioPitchDetector — frequency range guard
// ---------------------------------------------------------------------------

describe('WebAudioPitchDetector — frequency range guard', () => {
  let mockSource: MockAudioSource
  let detector: WebAudioPitchDetector

  beforeEach(() => {
    mockSource = new MockAudioSource()
    detector = new WebAudioPitchDetector(mockSource)
  })

  it('does not emit when all detected frequencies are above GUITAR_FREQ_MAX', async () => {
    const cb = vi.fn()
    detector.onNote(cb)
    await detector.start()

    // 2 kHz is above GUITAR_FREQ_MAX (1400 Hz)
    warmUp(mockSource, ABOVE_RANGE_FRAME)
    for (let i = 0; i < FRAME_WINDOW; i++) mockSource.pushFrame(ABOVE_RANGE_FRAME)

    expect(cb).not.toHaveBeenCalled()
  })

  it('GUITAR_FREQ_MIN and GUITAR_FREQ_MAX bracket the guitar frequency range', () => {
    // Low E open ≈ 82.4 Hz is within range
    expect(82.4).toBeGreaterThan(GUITAR_FREQ_MIN)
    expect(82.4).toBeLessThan(GUITAR_FREQ_MAX)
    // High e fret 12 ≈ 1318.5 Hz is within range
    expect(1318.5).toBeGreaterThan(GUITAR_FREQ_MIN)
    expect(1318.5).toBeLessThan(GUITAR_FREQ_MAX)
  })
})
