/**
 * Tabs Component Adapter
 *
 * Thin dispatcher: renders the local adapter's Tabs, or forwards props to the real adapter.
 * `Tabs`, `Tabs.List`, `Tabs.Tab`, and `Tabs.Panel` are each their own registered component
 * (`useComponent('Tabs' | 'TabsList' | 'TabsTab' | 'TabsPanel')`), exposed as static
 * properties on `Tabs` since every call site uses `<Tabs.List>`/`<Tabs.Tab>`/`<Tabs.Panel>`
 * composition. Per-kit rendering, including `TabsContext`, lives in each kit's own
 * `adapters/mantine/Tabs/` files.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import { isLocalAdapter } from '../registry/activeAdapter'
import { Tabs as LocalTabs } from './local/dispatch/Tabs'
import type { TabsProps, TabsListProps, TabsTabProps, TabsPanelProps } from './common/Tabs'

// Re-exported so existing `import type { TabsProps, TabsListProps, TabsTabProps, TabsPanelProps }
// from '.../adapters/Tabs'` call sites keep working — the types now live in common/Tabs.ts.
export type { TabsProps, TabsListProps, TabsTabProps, TabsPanelProps } from './common/Tabs'

function SharedTabs(props: TabsProps) {
  const Component = useComponent('Tabs')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

SharedTabs.List = function TabsList(props: TabsListProps) {
  const Component = useComponent('TabsList')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

SharedTabs.Tab = function TabsTab(props: TabsTabProps) {
  const Component = useComponent('TabsTab')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

SharedTabs.Panel = function TabsPanel(props: TabsPanelProps) {
  const Component = useComponent('TabsPanel')
  return (
    <Suspense fallback={<span />}>
      <Component {...props} />
    </Suspense>
  )
}

// The Mantine shell renders either the local adapter's dispatcher or this shared one; fixed per page load.
export const Tabs = (isLocalAdapter ? LocalTabs : SharedTabs) as typeof SharedTabs
