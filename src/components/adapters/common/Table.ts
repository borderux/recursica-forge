/**
 * Table — common types
 *
 * Single source of truth for the Table prop vocabulary, shared by the dispatcher
 * (`adapters/Table.tsx`) and the per-library wrapper (`adapters/mantine/Table`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type TableProps = {
  children?: React.ReactNode
  variant?: string
  layer?: ComponentLayer
  elevation?: string
  className?: string
  style?: React.CSSProperties
  data?: any
} & LibrarySpecificProps
