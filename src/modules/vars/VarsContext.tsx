/**
 * VarsContext (thin wrapper around core store)
 * Exposes tokens, theme, uikit, palettes plus setters and resetAll.
 * CSS variables are computed and applied inside the core store.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getVarsStore } from '../../core/store/varsStore'
import type { JsonLike } from '../../core/resolvers/tokens'
import { buildPaletteVars } from '../../core/resolvers/palettes'

type PaletteStore = {
  bindings: Record<string, { token: string; hex: string }>
  opacity: Record<'disabled' | 'overlay', { token: string; value: number }>
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
}

const VarsContext = createContext<VarsContextValue | undefined>(undefined)

export function VarsProvider({ children }: { children: React.ReactNode }) {
  const store = getVarsStore()
  const [state, setState] = useState(() => store.getState())

  useEffect(() => {
    return store.subscribe(() => setState(store.getState()))
  }, [store])

  const resolvedTheme: ResolvedTheme = useMemo(() => ({
    light: buildPaletteVars(state.tokens, state.theme, 'Light'),
    dark: buildPaletteVars(state.tokens, state.theme, 'Dark'),
  }), [state.tokens, state.theme])

  const value = useMemo<VarsContextValue>(() => ({
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
  }), [state, store, resolvedTheme])

  return <VarsContext.Provider value={value}>{children}</VarsContext.Provider>
}

export function useVars(): VarsContextValue {
  const ctx = useContext(VarsContext)
  if (!ctx) throw new Error('useVars must be used within VarsProvider')
  return ctx
}

