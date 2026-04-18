import { useState, useEffect, useCallback } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>(
    () => (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') ?? 'dark',
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggle = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), [])

  return { theme, toggle }
}
