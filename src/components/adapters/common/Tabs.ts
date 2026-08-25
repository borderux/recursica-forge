/**
 * Tabs — common types
 *
 * Single source of truth for the Tabs prop vocabulary, shared by the dispatcher
 * (`adapters/Tabs.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/Tabs`).
 * Also covers the Tabs.List / Tabs.Tab / Tabs.Panel subcomponents.
 */

import type { ReactNode } from 'react'
import type { LibrarySpecificProps } from '../../registry/types'

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type TabsProps = {
  value?: string
  defaultValue?: string
  onChange?: (value: string | null) => void
  orientation?: 'horizontal' | 'vertical'
  variant?: 'default' | 'pills' | 'outline'
  tabContentAlignment?: 'left' | 'center' | 'right'
  /**
   * Horizontal orientation only: tab list below its panel instead of above. The caller still
   * composes `Tabs.Panel` before `Tabs.List` as children to get that layout (DOM order drives
   * the actual positioning in every kit) — this additionally corrects which corners get rounded
   * on `default`/`outline` tabs, so a "hanging" tab bar rounds its bottom corners instead of its
   * top ones. Mantine-only: it's a real, native prop on raw `@mantine/core`'s own `Tabs`
   * (confirmed — `orientation === 'horizontal' && inverted` drives its own `data-inverted`
   * internally), which the real adapter forwards straight through. Material/Carbon's hand-rolled
   * `Tabs.Tab` applies border-radius uniformly to every corner regardless of orientation, so
   * there's no directional concept for this to affect there.
   */
  inverted?: boolean
  /**
   * Vertical orientation only: tab list on the right of its panel instead of the left. Same
   * split as `inverted` above (its horizontal counterpart) — DOM order still drives the actual
   * positioning; this is real, native raw-Mantine behavior (`Tabs`'s own `placement` prop,
   * `@default 'left'`) forwarded straight through by the real adapter. Mantine-only, same
   * reasoning as `inverted`.
   */
  placement?: 'left' | 'right'
  layer?: string
  children: ReactNode
  className?: string
  style?: React.CSSProperties
} & LibrarySpecificProps

export type TabsListProps = {
  children: ReactNode
  style?: React.CSSProperties
  className?: string
}

export type TabsTabProps = {
  value: string
  children: ReactNode
  leftSection?: ReactNode
  rightSection?: ReactNode
  disabled?: boolean
  style?: React.CSSProperties
  className?: string
}

export type TabsPanelProps = {
  value: string
  children: ReactNode
  style?: React.CSSProperties
  className?: string
}
