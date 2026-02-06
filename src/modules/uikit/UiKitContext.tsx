/**
 * UiKitContext
 *
 * Keeps track of which UI library shell to render ('mantine' | 'material' | 'carbon').
 * Defaults to 'mantine'. The UI selector is disabled, but programmatic changes are allowed for tests.
 */
import { createContext, useContext, useMemo, useState, ReactNode } from 'react'

export type UiKit = 'mantine' | 'material' | 'carbon'

type UiKitContextValue = {
  kit: UiKit
  setKit: (kit: UiKit) => void
}

const UiKitContext = createContext<UiKitContextValue | undefined>(undefined)

export function UiKitProvider({ children }: { children: ReactNode }) {
  // Default to mantine (selector is disabled in UI, but allow programmatic changes for tests)
  const [kit, setKitState] = useState<UiKit>(() => {
    // Default to mantine instead of reading from localStorage
    return 'mantine'
  })
  
  const setKit = (next: UiKit) => {
    setKitState(next)
    // Note: We don't persist to localStorage since the selector is disabled
  }

  const value = useMemo(() => ({ kit, setKit }), [kit])
  return <UiKitContext.Provider value={value}>{children}</UiKitContext.Provider>
}

export function useUiKit(): UiKitContextValue {
  const ctx = useContext(UiKitContext)
  if (!ctx) throw new Error('useUiKit must be used within UiKitProvider')
  return ctx
}


