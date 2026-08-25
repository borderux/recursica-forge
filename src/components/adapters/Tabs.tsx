/**
 * Tabs Component Adapter
 *
 * Unified Tabs component that renders the appropriate library implementation based on the
 * current UI kit selection. `Tabs`, `Tabs.List`, `Tabs.Tab`, and `Tabs.Panel` are each their
 * own registered component (`useComponent('Tabs' | 'TabsList' | 'TabsTab' | 'TabsPanel')`) —
 * same pattern as every other dispatcher (e.g. `Menu`/`MenuItem`), just exposed as static
 * properties on `Tabs` instead of separate named exports, since every call site already uses
 * `<Tabs.List>`/`<Tabs.Tab>`/`<Tabs.Panel>` composition. Per-kit rendering, including
 * `TabsContext` (the active value/orientation/variant/alignment sub-components read), lives
 * entirely in each kit's own `adapters/{mantine,material,carbon}/Tabs/` files — nothing
 * kit-specific belongs here.
 */

import { Suspense } from 'react'
import { useComponent } from '../hooks/useComponent'
import type { TabsProps, TabsListProps, TabsTabProps, TabsPanelProps } from './common/Tabs'

// Re-exported so existing `import type { TabsProps, TabsListProps, TabsTabProps, TabsPanelProps }
// from '.../adapters/Tabs'` call sites keep working — the types now live in common/Tabs.ts.
export type { TabsProps, TabsListProps, TabsTabProps, TabsPanelProps } from './common/Tabs'

export function Tabs({
  value,
  defaultValue,
  onChange,
  orientation = 'horizontal',
  variant = 'default',
  tabContentAlignment = 'left',
  layer = 'layer-0',
  children,
  className,
  style,
  mantine,
  material,
  carbon,
}: TabsProps) {
  const Component = useComponent('Tabs')

  return (
    <Suspense fallback={<span />}>
      <Component
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        orientation={orientation}
        variant={variant}
        tabContentAlignment={tabContentAlignment}
        layer={layer}
        className={className}
        style={style}
        mantine={mantine}
        material={material}
        carbon={carbon}
      >
        {children}
      </Component>
    </Suspense>
  )
}

Tabs.List = function TabsList({ children, style, className }: TabsListProps) {
  const Component = useComponent('TabsList')
  return (
    <Suspense fallback={<span />}>
      <Component style={style} className={className}>{children}</Component>
    </Suspense>
  )
}

Tabs.Tab = function TabsTab({ value, children, leftSection, rightSection, disabled, style, className }: TabsTabProps) {
  const Component = useComponent('TabsTab')
  return (
    <Suspense fallback={<span />}>
      <Component value={value} leftSection={leftSection} rightSection={rightSection} disabled={disabled} style={style} className={className}>
        {children}
      </Component>
    </Suspense>
  )
}

Tabs.Panel = function TabsPanel({ value, children, style, className }: TabsPanelProps) {
  const Component = useComponent('TabsPanel')
  return (
    <Suspense fallback={<span />}>
      <Component value={value} style={style} className={className}>{children}</Component>
    </Suspense>
  )
}
