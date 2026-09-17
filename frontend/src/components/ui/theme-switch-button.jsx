'use client'

import { useState, useEffect, useCallback } from 'react'
import { Moon, Sun } from 'lucide-react'

// Temporarily disable transitions during theme switch so all elements change in 0ms
const disableTransitions = () => {
  const css = document.createElement('style')
  css.textContent = '*,*::before,*::after{-webkit-transition:none!important;transition:none!important}'
  document.head.appendChild(css)
  return () => {
    (() => window.getComputedStyle(document.body))()
    requestAnimationFrame(() => css.remove())
  }
}

export function ThemeSwitch({ className = '' }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  })

  // Consolidated sync: handles theme-change events, cross-tab storage, and OS changes
  useEffect(() => {
    const sync = (val) => {
      const next = val || localStorage.getItem('theme') || (document.documentElement.classList.contains('dark') ? 'dark' : 'light')
      setTheme(next)
      document.documentElement.classList.toggle('dark', next === 'dark')
    }

    const onEvent = (e) => sync(e.detail)
    const onStorage = (e) => e.key === 'theme' && sync(e.newValue)
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    const onMQ = (e) => !localStorage.getItem('theme') && sync(e.matches ? 'dark' : 'light')

    window.addEventListener('theme-change', onEvent)
    window.addEventListener('storage', onStorage)
    mq?.addEventListener?.('change', onMQ)

    return () => {
      window.removeEventListener('theme-change', onEvent)
      window.removeEventListener('storage', onStorage)
      mq?.removeEventListener?.('change', onMQ)
    }
  }, [])

  // Instant toggle: always inverts live DOM class on the very first click
  const toggleTheme = useCallback(() => {
    const restore = disableTransitions()
    const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark'
    setTheme(next)
    try { localStorage.setItem('theme', next) } catch {}
    document.documentElement.classList.toggle('dark', next === 'dark')
    window.dispatchEvent(new CustomEvent('theme-change', { detail: next }))
    restore()
  }, [])

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200/80 dark:border-gray-700/80 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 hover:scale-105 active:scale-95 transition-transform shadow-xs overflow-hidden shrink-0 cursor-pointer ${className}`}
    >
      <Sun
        className={`absolute h-5 w-5 transition-transform duration-150 text-amber-500 ${
          theme === 'light' ? 'scale-100 translate-y-0 opacity-100' : 'scale-50 translate-y-5 opacity-0'
        }`}
      />
      <Moon
        className={`absolute h-5 w-5 transition-transform duration-150 text-blue-400 ${
          theme === 'dark' ? 'scale-100 translate-y-0 opacity-100' : 'scale-50 translate-y-5 opacity-0'
        }`}
      />
    </button>
  )
}

export default ThemeSwitch;
