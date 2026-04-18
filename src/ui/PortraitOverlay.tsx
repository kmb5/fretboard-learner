/**
 * Full-screen overlay shown when the device is in portrait orientation.
 * Visibility is controlled entirely by the CSS `(orientation: portrait)`
 * media query — no JavaScript orientation API is used.
 *
 * The component is always present in the DOM; CSS switches it between
 * `display: none` (landscape) and `display: flex` (portrait).
 */
export default function PortraitOverlay() {
  return (
    <div
      data-testid="portrait-overlay"
      className="hidden [@media(orientation:portrait)]:flex fixed inset-0 z-50 flex-col items-center justify-center gap-6 p-8 text-center"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--fg)' }}
    >
      <span
        aria-hidden="true"
        style={{
          fontSize: '3.5rem',
          color: 'var(--amber)',
          display: 'block',
          lineHeight: 1,
        }}
      >
        ↻
      </span>
      <p
        style={{
          fontFamily: "'Cormorant SC', serif",
          fontSize: '1.5rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
          margin: 0,
          color: 'var(--fg)',
        }}
      >
        Rotate your device
      </p>
      <p
        style={{
          fontFamily: "'Fira Code', monospace",
          fontSize: '0.8125rem',
          color: 'var(--fg-3)',
          maxWidth: '22rem',
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        Fretboard Learner is designed for landscape orientation. Please rotate
        your device to continue.
      </p>
    </div>
  )
}
