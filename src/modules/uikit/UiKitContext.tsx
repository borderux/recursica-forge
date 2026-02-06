/**
 * UiKitContext
 *
 * Keeps track of which UI library shell to render ('mantine' | 'material' | 'carbon').
 * Persists selection to localStorage under 'uikit'.
 */
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'

export type UiKit = 'mantine' | 'material' | 'carbon'

type UiKitContextValue = {
  kit: UiKit
  setKit: (kit: UiKit) => void
}

const UiKitContext = createContext<UiKitContextValue | undefined>(undefined)

export function UiKitProvider({ children }: { children: ReactNode }) {
  // Always use mantine, disable selector
  const kit: UiKit = 'mantine'
  
  const setKit = (_next: UiKit) => {
    // No-op: selector is disabled, always use mantine
  }

  const value = useMemo(() => ({ kit, setKit }), [])
  return <UiKitContext.Provider value={value}>{children}</UiKitContext.Provider>
}

export function useUiKit(): UiKitContextValue {
  const ctx = useContext(UiKitContext)
  if (!ctx) throw new Error('useUiKit must be used within UiKitProvider')
  return ctx
}


