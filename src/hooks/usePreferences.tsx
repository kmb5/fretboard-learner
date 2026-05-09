import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PreferencesState {
  isLeftHanded: boolean
  isTabView: boolean
}

interface PreferencesContextValue extends PreferencesState {
  toggleHandedness(): void
  toggleTabView(): void
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Single source of truth for user preferences.
 *
 * Reads initial values from localStorage on mount; writes back on every
 * toggle. All components in the tree share the same state — there is no
 * risk of two call-sites diverging the way isolated useState calls could.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [isLeftHanded, setIsLeftHanded] = useState(
    () => localStorage.getItem('isLeftHanded') === 'true',
  )
  const [isTabView, setIsTabView] = useState(
    () => localStorage.getItem('isTabView') === 'true',
  )

  const toggleHandedness = useCallback(() => {
    setIsLeftHanded((prev) => {
      const next = !prev
      localStorage.setItem('isLeftHanded', String(next))
      return next
    })
  }, [])

  const toggleTabView = useCallback(() => {
    setIsTabView((prev) => {
      const next = !prev
      localStorage.setItem('isTabView', String(next))
      return next
    })
  }, [])

  return (
    <PreferencesContext.Provider
      value={{ isLeftHanded, isTabView, toggleHandedness, toggleTabView }}
    >
      {children}
    </PreferencesContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

// eslint-disable-next-line react-refresh/only-export-components
export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext)
  if (ctx === null) {
    throw new Error('usePreferences must be used inside <PreferencesProvider>')
  }
  return ctx
}
