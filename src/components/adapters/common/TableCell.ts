/**
 * TableCell — common types
 *
 * Single source of truth for the TableCell prop vocabulary, shared by the dispatcher
 * (`adapters/TableCell.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/TableCell`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type TableCellProps = {
  children?: React.ReactNode
  variant?: string
  layer?: ComponentLayer
  elevation?: string
  className?: string
  style?: React.CSSProperties
  isHeader?: boolean
  disabled?: boolean
} & LibrarySpecificProps
