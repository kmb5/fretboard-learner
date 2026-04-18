import { useEffect, useState } from 'react'
import { useTheme } from '../hooks/useTheme'
import { usePreferences } from '../hooks/usePreferences'

interface Props {
  isOpen: boolean
  onClose: () => void
}

function Tooltip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: '3px', verticalAlign: '-2px' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <svg
        width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="var(--fg-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true" style={{ cursor: 'default', display: 'block', flexShrink: 0 }}
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
      {visible && (
        <span
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--fg)',
            color: 'var(--bg)',
            padding: '5px 9px',
            borderRadius: '5px',
            fontSize: '0.65rem',
            whiteSpace: 'nowrap',
            zIndex: 200,
            pointerEvents: 'none',
            letterSpacing: '0.02em',
            lineHeight: 1.4,
            textTransform: 'none',
          }}
        >
          {text}
        </span>
      )}
    </span>
  )
}

export default function SettingsModal({ isOpen, onClose }: Props) {
  const { theme, toggle: toggleTheme } = useTheme()
  const { isLeftHanded, toggleHandedness, isTabView, toggleTabView } = usePreferences()

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
          <p className="section-label">Handedness <Tooltip text="Mirrors the fretboard horizontally for left-handed players" /></p>
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

        {/* String order */}
        <div style={{ marginBottom: '16px' }}>
          <p className="section-label">String order <Tooltip text="Guitar: low E on top (player view) · Tab: high e on top (notation view)" /></p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="String order">
            <button
              aria-pressed={!isTabView}
              onClick={() => { if (isTabView) toggleTabView() }}
              className="btn-ghost"
            >
              Guitar
            </button>
            <button
              aria-pressed={isTabView}
              onClick={() => { if (!isTabView) toggleTabView() }}
              className="btn-ghost"
            >
              Tab
            </button>
          </div>
        </div>

        {/* Theme */}
        <div>
          <p className="section-label">Theme <Tooltip text="Switch between dark and light color scheme" /></p>
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
