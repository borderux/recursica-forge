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
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('recursica_active_uikit')
      if (saved === 'mantine' || saved === 'material' || saved === 'carbon') {
        return saved as UiKit
      }
    }
    return 'mantine'
  })
  
  const setKit = (next: UiKit) => {
    setKitState(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem('recursica_active_uikit', next)
    }
  }

  const value = useMemo(() => ({ kit, setKit }), [kit])
  return <UiKitContext.Provider value={value}>{children}</UiKitContext.Provider>
}

export function useUiKit(): UiKitContextValue {
  const ctx = useContext(UiKitContext)
  if (!ctx) throw new Error('useUiKit must be used within UiKitProvider')
  return ctx
}


