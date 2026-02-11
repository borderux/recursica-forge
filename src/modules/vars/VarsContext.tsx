/**
 * VarsContext (thin wrapper around core store)
 * Exposes tokens, theme, uikit, palettes plus setters and resetAll.
 * CSS variables are computed and applied inside the core store.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getVarsStore } from '../../core/store/varsStore'
import type { JsonLike } from '../../core/resolvers/tokens'
import { buildPaletteVars } from '../../core/resolvers/palettes'

// Import PaletteStore type from varsStore to ensure consistency
type PaletteStore = {
  opacity: Record<'disabled' | 'overlay' | 'text-high' | 'text-low', { token: string; value: number }>
  dynamic: Array<{ key: string; title: string; defaultLevel: number; initialFamily?: string }>
  primaryLevels?: Record<string, string>
}

type ResolvedTheme = { light: Record<string, string>; dark: Record<string, string> }

type VarsContextValue = {
  tokens: JsonLike
  setTokens: (next: JsonLike) => void
  updateToken: (tokenName: string, value: string | number) => void
  theme: JsonLike
  setTheme: (next: JsonLike) => void
  uikit: JsonLike
  setUiKit: (next: JsonLike) => void
  resolvedTheme: ResolvedTheme
  palettes: PaletteStore
  setPalettes: (next: PaletteStore) => void
  elevation: import('../../core/store/varsStore').ElevationState
  setElevation: (next: import('../../core/store/varsStore').ElevationState) => void
  updateElevation: (mutator: (prev: import('../../core/store/varsStore').ElevationState) => import('../../core/store/varsStore').ElevationState) => void
  resetAll: () => void
  /** Clears UIKit from localStorage and reloads with cache bust to pick up UIKit.json file changes */
  reloadFromFile: () => void
}

const VarsContext = createContext<VarsContextValue | undefined>(undefined)

export function VarsProvider({ children }: { children: React.ReactNode }) {
  // Ensure store is initialized before using it
  const store = useMemo(() => getVarsStore(), [])
  const [state, setState] = useState(() => store.getState())

  // Strip cache-bust param from URL after reloadFromFile()
  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (url.searchParams.has('_cb')) {
      url.searchParams.delete('_cb')
      const cleanUrl = url.pathname + (url.search || '') + url.hash
      window.history.replaceState(null, '', cleanUrl)
    }
  }, [])

  useEffect(() => {
    return store.subscribe(() => {
      const newState = store.getState()
      // Only update React state if actual data changed, not just version
      // bumpVersion() creates a new state object but keeps the same references for
      // tokens, theme, uikit, palettes, and elevation, so we can skip the update
      // to prevent unnecessary re-renders of all consumers
      setState(prevState => {
        const elevationChanged = prevState.elevation !== newState.elevation
        if (
          prevState.tokens !== newState.tokens ||
          prevState.theme !== newState.theme ||
          prevState.uikit !== newState.uikit ||
          prevState.palettes !== newState.palettes ||
          elevationChanged
        ) {
          return newState
        }
        // Data hasn't changed (only version changed), return previous state to prevent re-render
        return prevState
      })
    })
  }, [store])

  const resolvedTheme: ResolvedTheme = useMemo(() => ({
    light: buildPaletteVars(state.tokens, state.theme, 'Light'),
    dark: buildPaletteVars(state.tokens, state.theme, 'Dark'),
  }), [state.tokens, state.theme])

  const value = useMemo<VarsContextValue>(() => {
    return {
      tokens: state.tokens,
      setTokens: (next) => store.setTokens(next),
      updateToken: (tokenName: string, value: string | number) => store.updateToken(tokenName, value),
      theme: state.theme,
      setTheme: (next) => store.setTheme(next),
      uikit: state.uikit,
      setUiKit: (next) => store.setUiKit(next),
      resolvedTheme,
      palettes: state.palettes,
      setPalettes: (next) => store.setPalettes(next),
      elevation: state.elevation,
      setElevation: (next) => store.setElevation(next),
      updateElevation: (mutator) => store.updateElevation(mutator),
      resetAll: () => store.resetAll(),
      reloadFromFile: () => store.reloadFromFile(),
    }
  }, [state, store, resolvedTheme])

  return <VarsContext.Provider value={value}>{children}</VarsContext.Provider>
}

export function useVars(): VarsContextValue {
  const ctx = useContext(VarsContext)
  if (!ctx) throw new Error('useVars must be used within VarsProvider')
  return ctx
}

