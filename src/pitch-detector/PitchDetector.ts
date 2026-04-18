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

/** Lowest frequency (Hz) a guitar string can produce (low E open ≈ 82 Hz). */
export const GUITAR_FREQ_MIN = 70

/** Highest frequency (Hz) in the guitar's playable range (fret 12 of high e ≈ 1319 Hz). */
export const GUITAR_FREQ_MAX = 1400

/**
 * RMS amplitude threshold below which a frame is considered silent.
 * Frames below this level reset the sustain counter and window.
 */
export const AMPLITUDE_GATE_THRESHOLD = 0.02

/**
 * Number of consecutive loud frames required before the amplitude gate opens
 * and frames begin counting toward FRAME_WINDOW. Filters brief transients
 * such as hand claps, consonants, or pick noise that would otherwise bleed
 * into the pitch window.
 */
export const AMPLITUDE_SUSTAIN_FRAMES = 4

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
// Helpers (exported for unit testing)
// ---------------------------------------------------------------------------

/** Returns the most frequently occurring string in `items`. */
export function getMostFrequent(items: string[]): string {
  if (items.length === 0) throw new Error('getMostFrequent called with empty array')
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

/** Computes the root-mean-square amplitude of a sample buffer. */
export function getRMS(samples: Float32Array): number {
  let sum = 0
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i]
  }
  return Math.sqrt(sum / samples.length)
}

// ---------------------------------------------------------------------------
// WebAudioPitchDetector
// ---------------------------------------------------------------------------

/**
 * Detects musical notes from an injectable AudioSource.
 *
 * Processing pipeline per frame:
 *   1. Amplitude gate — discard frames below AMPLITUDE_GATE_THRESHOLD; reset
 *      sustain counter and window on silence to prevent cross-note contamination.
 *   2. Sustain gate — require AMPLITUDE_SUSTAIN_FRAMES consecutive loud frames
 *      before counting toward FRAME_WINDOW (filters brief transients).
 *   3. Pitchy pitch detection — discard frames below CLARITY_THRESHOLD.
 *   4. Frequency range guard — discard pitches outside [GUITAR_FREQ_MIN,
 *      GUITAR_FREQ_MAX] (filters voices, HVAC, and other environmental noise).
 *   5. Window accumulation — once FRAME_WINDOW valid readings accumulate, emit
 *      the most frequent note and reset.
 */
export class WebAudioPitchDetector implements PitchDetector {
  private readonly audioSource: AudioSource
  private noteCallback: ((note: string) => void) | null = null
  private window: string[] = []
  private pitchy: PitchyDetector<Float32Array> | null = null
  private sustainCount = 0

  constructor(audioSource: AudioSource) {
    this.audioSource = audioSource
  }

  onNote(cb: (note: string) => void): void {
    this.noteCallback = cb
  }

  async start(): Promise<void> {
    this.window = []
    this.sustainCount = 0
    await this.audioSource.start((samples, sampleRate) => {
      // 1. Amplitude gate
      if (getRMS(samples) < AMPLITUDE_GATE_THRESHOLD) {
        this.sustainCount = 0
        this.window = []
        return
      }

      // 2. Sustain gate — require N consecutive loud frames before counting
      this.sustainCount++
      if (this.sustainCount < AMPLITUDE_SUSTAIN_FRAMES) return

      // Lazily create the Pitchy detector on the first qualifying frame so it
      // matches the actual buffer size used by the audio source.
      if (!this.pitchy) {
        this.pitchy = PitchyDetector.forFloat32Array(samples.length)
        this.pitchy.minVolumeDecibels = -20
      }

      // 3. Clarity gate
      const [freq, clarity] = this.pitchy.findPitch(samples, sampleRate)
      if (clarity < CLARITY_THRESHOLD || freq <= 0) return

      // 4. Frequency range guard
      if (freq < GUITAR_FREQ_MIN || freq > GUITAR_FREQ_MAX) return

      // 5. Window accumulation
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
    this.sustainCount = 0
    this.pitchy = null
  }
}

// ---------------------------------------------------------------------------
// WebAudioSource
// ---------------------------------------------------------------------------

/**
 * Real audio source: requests microphone access via `getUserMedia` and feeds
 * frames to the callback using an AnalyserNode polled with requestAnimationFrame.
 * A highpass BiquadFilter at GUITAR_FREQ_MIN Hz is inserted before the analyser
 * to attenuate sub-bass rumble before pitch analysis.
 */
export class WebAudioSource implements AudioSource {
  private context: AudioContext | null = null
  private stream: MediaStream | null = null
  private running = false

  async start(
    onFrame: (samples: Float32Array, sampleRate: number) => void,
  ): Promise<void> {
    if (this.running) this.stop()
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    })
    this.context = new AudioContext()
    const source = this.context.createMediaStreamSource(this.stream)
    const filter = this.context.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = GUITAR_FREQ_MIN
    const analyser = this.context.createAnalyser()
    analyser.fftSize = BUFFER_SIZE
    source.connect(filter)
    filter.connect(analyser)

    // buffer is reused across frames; onFrame must consume samples synchronously.
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
    this.context?.close().catch((e) => console.warn('AudioContext.close() failed', e))
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
