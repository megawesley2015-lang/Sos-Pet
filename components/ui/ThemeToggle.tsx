'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

type Theme = 'light' | 'dark'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('sos-theme') as Theme | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = saved ?? (prefersDark ? 'dark' : 'light')
    applyTheme(initial)
    setTheme(initial)
  }, [])

  function applyTheme(t: Theme) {
    document.documentElement.setAttribute('data-theme', t)
    localStorage.setItem('sos-theme', t)
  }

  function toggle() {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    applyTheme(next)
  }

  if (!mounted) return null

  return (
    <button
      onClick={toggle}
      aria-label={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      className="
        inline-flex items-center gap-2 rounded-full
        border border-[rgb(var(--color-border))]
        bg-[rgb(var(--color-bg-raised))]
        px-3 py-1.5 text-xs font-semibold
        text-[rgb(var(--color-fg-muted))]
        hover:border-[rgb(var(--color-primary))]/40
        hover:text-[rgb(var(--color-fg))]
        transition-all duration-200
        active:scale-[0.97]
      "
    >
      {theme === 'light'
        ? <><Moon size={13} aria-hidden /> Modo escuro</>
        : <><Sun size={13} aria-hidden /> Modo claro</>
      }
    </button>
  )
}
