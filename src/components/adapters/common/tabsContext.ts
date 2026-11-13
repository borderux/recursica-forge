/**
 * Tabs — shared context
 *
 * `Tabs.List`/`Tabs.Tab`/`Tabs.Panel` need a handful of values from their parent `<Tabs>` —
 * the active value, the change handler, `orientation`/`variant`/`tabContentAlignment`/`layer`
 * — without those being threaded through as props (real Mantine's own `Tabs.List`/`Tabs.Tab`
 * work the same way, via `Tabs.context.mjs`). One `TabsContext`, created here so the dispatcher
 * (which provides it) and each kit's `TabsList`/`TabsTab`/`TabsPanel` (which consume it) share
 * the same instance rather than each kit re-declaring its own.
 */

import { createContext, useContext } from 'react'

export interface TabsContextValue {
  value?: string
  onChange?: (value: string | null) => void
  orientation: 'horizontal' | 'vertical'
  variant: 'default' | 'pills' | 'outline'
  layer?: string
  tabContentAlignment?: 'left' | 'center' | 'right'
}

export const TabsContext = createContext<TabsContextValue | undefined>(undefined)

/** Throws the same "must be used within Tabs" error every sub-component needs, instead of
 *  each one hand-rolling its own copy of the check. */
export function useTabsContext(componentName: string): TabsContextValue {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error(`${componentName} must be used within a Tabs parent component`)
  }
  return context
}
