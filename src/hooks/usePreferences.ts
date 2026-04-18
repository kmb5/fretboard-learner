import { useState, useCallback, useEffect } from 'react'

const HANDEDNESS_EVENT = 'preferences:handedness'

export function usePreferences() {
  const [isLeftHanded, setIsLeftHanded] = useState(
    () => localStorage.getItem('isLeftHanded') === 'true',
  )

  useEffect(() => {
    const handler = (e: Event) => {
      setIsLeftHanded((e as CustomEvent<boolean>).detail)
    }
    window.addEventListener(HANDEDNESS_EVENT, handler)
    return () => window.removeEventListener(HANDEDNESS_EVENT, handler)
  }, [])

  const toggleHandedness = useCallback(() => {
    setIsLeftHanded((prev) => {
      const next = !prev
      localStorage.setItem('isLeftHanded', String(next))
      window.dispatchEvent(new CustomEvent<boolean>(HANDEDNESS_EVENT, { detail: next }))
      return next
    })
  }, [])

  return { isLeftHanded, toggleHandedness }
}
