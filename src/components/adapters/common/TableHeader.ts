/**
 * TableHeader — common types
 *
 * Single source of truth for the TableHeader prop vocabulary, shared by the dispatcher
 * (`adapters/TableHeader.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/TableHeader`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type TableHeaderProps = {
  children?: React.ReactNode
  variant?: string
  layer?: ComponentLayer
  elevation?: string
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
  sorted?: 'asc' | 'desc' | null
  onClick?: React.MouseEventHandler<HTMLTableCellElement>
} & LibrarySpecificProps
