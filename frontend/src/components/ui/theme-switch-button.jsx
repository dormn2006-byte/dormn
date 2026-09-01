'use client'

import { useState, useEffect, useCallback } from 'react'
import { Moon, Sun } from 'lucide-react'

export function ThemeSwitch({ className = '' }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    return (
      localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    )
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Toggle theme
  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }, [theme])

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200/80 dark:border-gray-700/80 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 hover:opacity-90 hover:scale-105 transition-all shadow-xs overflow-hidden shrink-0 ${className}`}
    >
      <Sun
        className={`absolute h-5 w-5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          theme === 'light' 
            ? 'scale-100 translate-y-0 opacity-100 text-amber-500' 
            : 'scale-50 translate-y-5 opacity-0 text-amber-500'
        }`}
      />
      <Moon
        className={`absolute h-5 w-5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          theme === 'dark' 
            ? 'scale-100 translate-y-0 opacity-100 text-blue-400' 
            : 'scale-50 translate-y-5 opacity-0 text-blue-400'
        }`}
      />
    </button>
  )
}

export default ThemeSwitch;
