import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  // Check localStorage first
  const stored = localStorage.getItem('contextflow.theme') as Theme | null
  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  // Fall back to system preference
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    const root = document.documentElement

    // Remove both classes first to ensure clean state
    root.classList.remove('light', 'dark')

    // Add the current theme class
    root.classList.add(theme)

    // Save to localStorage
    localStorage.setItem('contextflow.theme', theme)

    console.log('Theme changed to:', theme) // Debug log
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light'
      console.log('Toggling theme from', prev, 'to', next) // Debug log
      return next
    })
  }

  return { theme, toggleTheme }
}
