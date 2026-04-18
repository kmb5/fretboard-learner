import AppHeader from './AppHeader'

interface Props {
  errorMessage: string
  onRetry: () => void
}

export default function MicPermissionPrompt({ errorMessage, onRetry }: Props) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-6 p-8">
      <AppHeader />

      <div className="text-center max-w-sm">
        <p className="text-zinc-300 mb-2">{errorMessage}</p>
        <p className="text-zinc-500 text-sm">
          Check your browser settings, then try again.
        </p>
      </div>

      <button
        onClick={onRetry}
        className="px-6 py-2 rounded-lg bg-amber-500 text-zinc-950 font-semibold hover:bg-amber-400 transition-colors"
      >
        Retry
      </button>
    </div>
  )
}
