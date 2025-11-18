/**
 * ThemeModeContext
 *
 * Provides global theme mode (light/dark) state management with localStorage persistence.
 */
import { createContext, useContext, useState, useMemo, ReactNode, useEffect } from 'react'
import { getVarsStore } from '../../core/store/varsStore'

export type ThemeMode = 'light' | 'dark'

type ThemeModeContextValue = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined)

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('theme-mode') as ThemeMode | null) : null
    return saved ?? 'light'
  })

  const setMode = (next: ThemeMode) => {
    setModeState(next)
    try {
      localStorage.setItem('theme-mode', next)
      // Update varsStore to switch mode and regenerate CSS vars
      getVarsStore().switchMode(next)
    } catch {}
  }

  // Sync varsStore mode on mount
  useEffect(() => {
    getVarsStore().switchMode(mode)
  }, []) // Only run on mount

  const value = useMemo(() => ({ mode, setMode }), [mode])
  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>
}

export function useThemeMode(): ThemeModeContextValue {
  const ctx = useContext(ThemeModeContext)
  if (!ctx) {
    throw new Error('useThemeMode must be used within ThemeModeProvider')
  }
  return ctx
}

