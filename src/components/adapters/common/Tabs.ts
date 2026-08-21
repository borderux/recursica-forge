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
