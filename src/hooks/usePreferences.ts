import { useState, useCallback } from 'react'

export function usePreferences() {
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

  return { isLeftHanded, toggleHandedness, isTabView, toggleTabView }
}
