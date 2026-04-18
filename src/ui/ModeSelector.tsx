import { useState, useCallback } from 'react'
import { useGameSession } from '../game/GameSessionProvider'
import SettingsModal from './SettingsModal'
import {
  RandomStringMode,
  ScaleMode,
  ChordTonesMode,
  SCALE_LABELS,
  SCALE_TYPES,
  CHORD_TYPE_LABELS,
  CHORD_TYPES,
  GAME_MODE_ENTRIES,
  RANDOM_STRING_MODE_ID,
  SCALE_MODE_ID,
  CHORD_TONES_MODE_ID,
} from '../game/GameMode'
import type { Difficulty, GameModeId, NoteFilter } from '../game/GameMode'
import { NOTE_NAMES } from '../music-theory/MusicTheory'
import type { StringName, ScaleType, ChordType, NoteName } from '../music-theory/MusicTheory'

type ModeType = GameModeId

const STRINGS: StringName[] = ['E', 'A', 'D', 'G', 'B', 'e']

const ROOT_KEY_DISPLAY: Record<string, string> = {
  'C#': 'C♯/D♭', 'D#': 'D♯/E♭', 'F#': 'F♯/G♭', 'G#': 'G♯/A♭', 'A#': 'A♯/B♭',
}

export default function ModeSelector() {
  const { startSession } = useGameSession()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const [modeType, setModeType] = useState<ModeType>(RANDOM_STRING_MODE_ID)
  const [selectedString, setSelectedString] = useState<StringName | 'all' | null>(null)
  const [selectedKey, setSelectedKey] = useState<NoteName | null>(null)
  const [selectedScale, setSelectedScale] = useState<ScaleType | null>(null)
  const [selectedChordType, setSelectedChordType] = useState<ChordType | null>(null)
  const [difficulty, setDifficulty] = useState<Difficulty>('learning')
  const [noteFilter, setNoteFilter] = useState<NoteFilter>('sharps')

  const canStart: boolean = {
    [RANDOM_STRING_MODE_ID]: selectedString !== null,
    [SCALE_MODE_ID]:         selectedKey !== null && selectedScale !== null,
    [CHORD_TONES_MODE_ID]:   selectedKey !== null && selectedChordType !== null,
  }[modeType]

  const handleStart = useCallback(() => {
    if (modeType === RANDOM_STRING_MODE_ID) {
      if (selectedString === null) return
      startSession(new RandomStringMode(selectedString === 'all' ? null : selectedString, noteFilter), difficulty)
    } else if (modeType === SCALE_MODE_ID) {
      if (selectedKey === null || selectedScale === null) return
      startSession(new ScaleMode(selectedKey, selectedScale), difficulty)
    } else {
      if (selectedKey === null || selectedChordType === null) return
      startSession(new ChordTonesMode(selectedKey, selectedChordType), difficulty)
    }
  }, [modeType, selectedString, selectedKey, selectedScale, selectedChordType, difficulty, noteFilter, startSession])

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center p-8"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--fg)' }}
    >
      <button
        onClick={() => setSettingsOpen(true)}
        aria-label="Open settings"
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '2rem',
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: '7px',
          cursor: 'pointer',
          color: 'var(--fg-2)',
          padding: '5px 7px',
          display: 'flex',
          alignItems: 'center',
          transition: 'border-color 0.18s, color 0.18s',
          lineHeight: 0,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <div className="w-full max-w-sm flex flex-col gap-7">

        {/* Title */}
        <div
          className="anim-fade-up text-center mb-1"
          style={{ animationDelay: '0ms' }}
        >
          <h1
            style={{
              fontFamily: "'Cormorant SC', serif",
              fontSize: '2.75rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              color: 'var(--fg)',
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            Fretboard Learner
          </h1>
        </div>

        {/* Mode type toggle */}
        <section
          className="anim-fade-up"
          style={{ animationDelay: '70ms' }}
          aria-labelledby="mode-label"
        >
          <p id="mode-label" className="section-label">Mode</p>
          <div className="grid grid-cols-3 gap-2" role="group" aria-labelledby="mode-label">
            {GAME_MODE_ENTRIES.map(({ id, label }) => (
              <button
                key={id}
                aria-pressed={modeType === id}
                onClick={() => setModeType(id)}
                className="btn-ghost"
              style={{ fontSize: '0.7rem' }}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Random String controls */}
        {modeType === RANDOM_STRING_MODE_ID && (
          <section
            className="anim-fade-up"
            style={{ animationDelay: '0ms' }}
            aria-labelledby="string-label"
          >
            <p id="string-label" className="section-label">Select a string</p>
            <div role="group" aria-labelledby="string-label" className="flex flex-col gap-2">
              <button
                aria-pressed={selectedString === 'all'}
                onClick={() => setSelectedString('all')}
                className="btn-ghost"
              >
                All
              </button>
              <div className="grid grid-cols-6 gap-2">
                {STRINGS.map((s) => (
                  <button
                    key={s}
                    aria-pressed={selectedString === s}
                    onClick={() => setSelectedString(s)}
                    className="btn-ghost"
                    style={{ fontFamily: "'Fira Code', monospace", fontWeight: 500 }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Notes filter — Random String only */}
        {modeType === RANDOM_STRING_MODE_ID && (
          <section
            className="anim-fade-up"
            style={{ animationDelay: '40ms' }}
            aria-labelledby="notes-label"
          >
            <p id="notes-label" className="section-label">Notes</p>
            <div className="grid grid-cols-3 gap-2" role="group" aria-labelledby="notes-label">
              {([['naturals', 'Naturals'], ['sharps', '+ Sharps'], ['all', '+ Flats']] as [NoteFilter, string][]).map(([f, label]) => (
                <button
                  key={f}
                  aria-pressed={noteFilter === f}
                  onClick={() => setNoteFilter(f)}
                  className="btn-ghost"
                  style={{ fontSize: '0.75rem' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Root key — shared by Scale and Chord Tones modes */}
        {(modeType === SCALE_MODE_ID || modeType === CHORD_TONES_MODE_ID) && (
          <section
            className="anim-fade-up"
            style={{ animationDelay: '0ms' }}
            aria-labelledby="key-label"
          >
            <p id="key-label" className="section-label">Root key</p>
            <div className="grid grid-cols-4 gap-2" role="group" aria-labelledby="key-label">
              {NOTE_NAMES.map((key) => (
                <button
                  key={key}
                  aria-pressed={selectedKey === key}
                  onClick={() => setSelectedKey(key)}
                  className="btn-ghost"
                  style={ROOT_KEY_DISPLAY[key] ? { fontSize: '0.72rem' } : undefined}
                >
                  {ROOT_KEY_DISPLAY[key] ?? key}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Scale type picker */}
        {modeType === SCALE_MODE_ID && (
          <section
            className="anim-fade-up"
            style={{ animationDelay: '60ms' }}
            aria-labelledby="scale-label"
          >
            <p id="scale-label" className="section-label">Scale</p>
            <div className="flex flex-col gap-2" role="group" aria-labelledby="scale-label">
              {SCALE_TYPES.map((scale) => (
                <button
                  key={scale}
                  aria-pressed={selectedScale === scale}
                  onClick={() => setSelectedScale(scale)}
                  className="btn-ghost"
                >
                  {SCALE_LABELS[scale]}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Chord type picker */}
        {modeType === CHORD_TONES_MODE_ID && (
          <section
            className="anim-fade-up"
            style={{ animationDelay: '60ms' }}
            aria-labelledby="chord-label"
          >
            <p id="chord-label" className="section-label">Chord type</p>
            <div className="flex flex-col gap-2" role="group" aria-labelledby="chord-label">
              {CHORD_TYPES.map((chord) => (
                <button
                  key={chord}
                  aria-pressed={selectedChordType === chord}
                  onClick={() => setSelectedChordType(chord)}
                  className="btn-ghost"
                >
                  {CHORD_TYPE_LABELS[chord]}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Difficulty toggle */}
        <section
          className="anim-fade-up"
          style={{ animationDelay: '140ms' }}
          aria-labelledby="difficulty-label"
        >
          <p id="difficulty-label" className="section-label">Difficulty</p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="difficulty-label">
            {(['learning', 'practice'] as Difficulty[]).map((d) => (
              <button
                key={d}
                aria-pressed={difficulty === d}
                onClick={() => setDifficulty(d)}
                className="btn-ghost"
                style={{ textTransform: 'capitalize' }}
              >
                {d}
              </button>
            ))}
          </div>
        </section>

        {/* Start button */}
        <div className="anim-fade-up" style={{ animationDelay: '200ms' }}>
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="btn-primary"
          >
            Start
          </button>
        </div>

      </div>
    </div>
  )
}
