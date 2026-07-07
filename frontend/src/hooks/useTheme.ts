import { useCallback, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

function currentTheme(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/**
 * Theme state lives on <html class="dark">, set before paint by the inline
 * script in index.html. This hook reads it, toggles it, and persists the
 * user's explicit choice to localStorage. With no stored choice, the OS
 * preference wins (and changes to it are followed live).
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(currentTheme)

  const apply = useCallback((next: Theme) => {
    document.documentElement.classList.toggle('dark', next === 'dark')
    setTheme(next)
  }, [])

  const toggle = useCallback(() => {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', next)
    apply(next)
  }, [apply])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('theme') === null) {
        apply(e.matches ? 'dark' : 'light')
      }
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [apply])

  return { theme, toggle }
}
