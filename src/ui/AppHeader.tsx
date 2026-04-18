import { useState } from 'react'
import SettingsModal from './SettingsModal'

function GearIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

interface Props {
  showSettings?: boolean
}

export default function AppHeader({ showSettings = true }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <h1
        style={{
          fontFamily: "'Cormorant SC', serif",
          fontSize: '1.375rem',
          fontWeight: 700,
          letterSpacing: '0.16em',
          color: 'var(--fg)',
          margin: 0,
        }}
      >
        Fretboard Learner
      </h1>
      {showSettings && (
        <>
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Open settings"
            style={{
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
            <GearIcon />
          </button>
          <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
        </>
      )}
    </div>
  )
}
