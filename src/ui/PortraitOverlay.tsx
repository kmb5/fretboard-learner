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
      className={[
        // Hidden in landscape; flex in portrait — pure CSS, no JS.
        'hidden [@media(orientation:portrait)]:flex',
        // Cover everything above all other content.
        'fixed inset-0 z-50',
        // Layout.
        'flex-col items-center justify-center gap-6 p-8 text-center',
        // Colours.
        'bg-zinc-950 text-zinc-100',
      ].join(' ')}
    >
      <span className="text-6xl" aria-hidden="true">⟳</span>
      <p className="text-xl font-semibold">Rotate your device</p>
      <p className="text-zinc-400 text-sm max-w-xs">
        Fretboard Learner is designed for landscape orientation. Please rotate
        your device to continue.
      </p>
    </div>
  )
}
