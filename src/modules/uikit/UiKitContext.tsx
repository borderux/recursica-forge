import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'

export type UiKit = 'mantine' | 'material' | 'carbon'

type UiKitContextValue = {
  kit: UiKit
  setKit: (kit: UiKit) => void
}

const UiKitContext = createContext<UiKitContextValue | undefined>(undefined)

export function UiKitProvider({ children }: { children: ReactNode }) {
  const [kit, setKitState] = useState<UiKit>(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('uikit') as UiKit | null) : null
    return saved ?? 'mantine'
  })

  const setKit = (next: UiKit) => {
    setKitState(next)
    try {
      localStorage.setItem('uikit', next)
    } catch {}
  }

  const value = useMemo(() => ({ kit, setKit }), [kit])
  return <UiKitContext.Provider value={value}>{children}</UiKitContext.Provider>
}

export function useUiKit(): UiKitContextValue {
  const ctx = useContext(UiKitContext)
  if (!ctx) throw new Error('useUiKit must be used within UiKitProvider')
  return ctx
}


