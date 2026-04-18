import AppHeader from './AppHeader'

interface Props {
  errorMessage: string
  onRetry: () => void
}

export default function MicPermissionPrompt({ errorMessage, onRetry }: Props) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-6 p-8"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--fg)' }}
    >
      <AppHeader />

      <div className="text-center" style={{ maxWidth: '22rem' }}>
        <p
          style={{
            fontFamily: "'Fira Code', monospace",
            fontSize: '0.9375rem',
            color: 'var(--fg-2)',
            marginBottom: '8px',
          }}
        >
          {errorMessage}
        </p>
        <p
          style={{
            fontFamily: "'Fira Code', monospace",
            fontSize: '0.8125rem',
            color: 'var(--fg-3)',
            margin: 0,
          }}
        >
          Check your browser settings, then try again.
        </p>
      </div>

      <button onClick={onRetry} className="btn-retry">
        Retry
      </button>
    </div>
  )
}
