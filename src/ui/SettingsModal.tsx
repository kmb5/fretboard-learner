import { useEffect } from 'react'
import { useTheme } from '../hooks/useTheme'
import { usePreferences } from '../hooks/usePreferences'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function SettingsModal({ isOpen, onClose }: Props) {
  const { theme, toggle: toggleTheme } = useTheme()
  const { isLeftHanded, toggleHandedness } = usePreferences()

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="settings-backdrop"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        className="settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
          }}
        >
          <span
            id="settings-title"
            style={{
              fontFamily: "'Fira Code', monospace",
              fontSize: '0.6875rem',
              color: 'var(--fg-3)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            Settings
          </span>
          <button
            onClick={onClose}
            aria-label="Close settings"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--fg-2)',
              padding: '2px 4px',
              fontSize: '1rem',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Handedness */}
        <div style={{ marginBottom: '16px' }}>
          <p className="section-label">Handedness</p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Handedness">
            <button
              aria-pressed={!isLeftHanded}
              onClick={() => { if (isLeftHanded) toggleHandedness() }}
              className="btn-ghost"
            >
              Right-handed
            </button>
            <button
              aria-pressed={isLeftHanded}
              onClick={() => { if (!isLeftHanded) toggleHandedness() }}
              className="btn-ghost"
            >
              Left-handed
            </button>
          </div>
        </div>

        {/* Theme */}
        <div>
          <p className="section-label">Theme</p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Theme">
            <button
              aria-pressed={theme === 'dark'}
              onClick={() => { if (theme !== 'dark') toggleTheme() }}
              className="btn-ghost"
            >
              Dark
            </button>
            <button
              aria-pressed={theme === 'light'}
              onClick={() => { if (theme !== 'light') toggleTheme() }}
              className="btn-ghost"
            >
              Light
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
