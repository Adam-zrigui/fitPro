'use client'

import { useState, useEffect, createContext } from 'react'
import { SessionProvider } from 'next-auth/react'

export const ThemeContext = createContext<{
  isDarkMode: boolean
  toggleDarkMode: () => void
}>({
  isDarkMode: false,
  toggleDarkMode: () => {},
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Prefer an explicit saved user preference. If none exists, default to light mode.
    const raw = localStorage.getItem('darkMode')
    const savedMode = raw === 'true' ? true : raw === 'false' ? false : null
    const initialDark = savedMode !== null ? savedMode : false

    setIsDarkMode(initialDark)
    // apply initial mode to document root
    if (initialDark) {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [])

  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    localStorage.setItem('darkMode', String(newMode))
    // add a temporary transition class so color changes animate smoothly
    document.documentElement.classList.add('theme-transition')
    // toggle action
    if (newMode) {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    }
    // remove the helper class after the transition finishes
    window.setTimeout(() => {
      document.documentElement.classList.remove('theme-transition')
    }, 400)
  }

  if (!mounted) {
    return (
      <SessionProvider>
        <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
          {children}
        </ThemeContext.Provider>
      </SessionProvider>
    )
  }

  return (
    <SessionProvider>
      <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
        {/* rely on document.documentElement.classList for `dark` class
            to keep Tailwind's `dark:` styles consistent across SSR/CSR */}
        {children}
      </ThemeContext.Provider>
    </SessionProvider>
  )
}
