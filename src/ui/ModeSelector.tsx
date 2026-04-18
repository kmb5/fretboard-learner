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
      className="relative min-h-screen flex flex-col items-center p-8"
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

      <div className="flex-1 flex flex-col items-center justify-center w-full">
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

      <footer
        className="anim-fade-up"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.65rem',
          paddingTop: '2rem',
          paddingBottom: '0.25rem',
          animationDelay: '240ms',
        }}
      >
        <div style={{ width: '120px', height: '1px', background: 'var(--border)', opacity: 0.6 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <p style={{ margin: 0, fontSize: '0.7rem', letterSpacing: '0.08em', color: 'var(--fg-3)' }}>
            © 2026 Máté Bendegúz Kovács
          </p>
          <a
            href="https://github.com/kmb5"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            style={{ color: 'var(--fg-3)', display: 'flex', lineHeight: 0, transition: 'color 0.18s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--fg)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-3)')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
          <a
            href="https://www.linkedin.com/in/matebkovacs/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="LinkedIn"
            style={{ color: 'var(--fg-3)', display: 'flex', lineHeight: 0, transition: 'color 0.18s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--fg)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--fg-3)')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  )
}
