import { PitchDetector as PitchyDetector } from 'pitchy'
import { pitch2note } from '../music-theory/MusicTheory'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of consecutive valid pitch readings required before emitting a note. */
export const FRAME_WINDOW = 10

/**
 * Minimum Pitchy clarity score (0–1) for a reading to be counted as valid.
 * Values below this are treated as noise/silence and discarded.
 */
export const CLARITY_THRESHOLD = 0.9

/** Audio buffer size (samples). Must be a power of two. */
export const BUFFER_SIZE = 2048

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/**
 * Abstraction over the audio input source.
 * Inject a real implementation (getUserMedia) or a mock for testing.
 */
export interface AudioSource {
  /** Begin capturing audio and call `onFrame` for each buffer of samples. */
  start(
    onFrame: (samples: Float32Array, sampleRate: number) => void,
  ): Promise<void>
  /** Stop capturing and release all resources. */
  stop(): void
}

/** Public interface for the pitch detector consumed by the rest of the app. */
export interface PitchDetector {
  /** Request microphone access and begin processing frames. */
  start(): Promise<void>
  /** Stop processing and tear down the audio graph. */
  stop(): void
  /** Register the callback that fires with a confirmed note name (octave-stripped). */
  onNote(cb: (note: string) => void): void
}

// ---------------------------------------------------------------------------
// Helper (exported for unit testing)
// ---------------------------------------------------------------------------

/** Returns the most frequently occurring string in `items`. */
export function getMostFrequent(items: string[]): string {
  const counts = new Map<string, number>()
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1)
  }
  let best = items[0]
  let bestCount = 0
  for (const [item, count] of counts) {
    if (count > bestCount) {
      bestCount = count
      best = item
    }
  }
  return best
}

// ---------------------------------------------------------------------------
// WebAudioPitchDetector
// ---------------------------------------------------------------------------

/**
 * Detects musical notes from an injectable AudioSource.
 *
 * Each valid frame (clarity ≥ CLARITY_THRESHOLD) is added to a rolling window.
 * Once FRAME_WINDOW valid readings have accumulated, the most frequent note is
 * emitted via the `onNote` callback and the window resets.
 */
export class WebAudioPitchDetector implements PitchDetector {
  private readonly audioSource: AudioSource
  private noteCallback: ((note: string) => void) | null = null
  private window: string[] = []
  private pitchy: PitchyDetector<Float32Array> | null = null

  constructor(audioSource: AudioSource) {
    this.audioSource = audioSource
  }

  onNote(cb: (note: string) => void): void {
    this.noteCallback = cb
  }

  async start(): Promise<void> {
    await this.audioSource.start((samples, sampleRate) => {
      // Lazily create the Pitchy detector on the first frame so it matches
      // the actual buffer size used by the audio source.
      if (!this.pitchy) {
        this.pitchy = PitchyDetector.forFloat32Array(samples.length)
        this.pitchy.minVolumeDecibels = -30
      }

      const [freq, clarity] = this.pitchy.findPitch(samples, sampleRate)

      if (clarity < CLARITY_THRESHOLD || freq <= 0) return

      this.window.push(pitch2note(freq))

      if (this.window.length >= FRAME_WINDOW) {
        this.noteCallback?.(getMostFrequent(this.window))
        this.window = []
      }
    })
  }

  stop(): void {
    this.audioSource.stop()
    this.window = []
    this.pitchy = null
  }
}

// ---------------------------------------------------------------------------
// WebAudioSource
// ---------------------------------------------------------------------------

/**
 * Real audio source: requests microphone access via `getUserMedia` and feeds
 * frames to the callback using an AnalyserNode polled with requestAnimationFrame.
 */
export class WebAudioSource implements AudioSource {
  private context: AudioContext | null = null
  private stream: MediaStream | null = null
  private running = false

  async start(
    onFrame: (samples: Float32Array, sampleRate: number) => void,
  ): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    })
    this.context = new AudioContext()
    const source = this.context.createMediaStreamSource(this.stream)
    const analyser = this.context.createAnalyser()
    analyser.fftSize = BUFFER_SIZE
    source.connect(analyser)

    const buffer = new Float32Array(analyser.fftSize)
    this.running = true

    const loop = () => {
      if (!this.running) return
      analyser.getFloatTimeDomainData(buffer)
      onFrame(buffer, this.context!.sampleRate)
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }

  stop(): void {
    this.running = false
    this.stream?.getTracks().forEach((t) => t.stop())
    void this.context?.close()
    this.context = null
    this.stream = null
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/** Creates a production-ready PitchDetector backed by the real microphone. */
export function createPitchDetector(): PitchDetector {
  return new WebAudioPitchDetector(new WebAudioSource())
}
