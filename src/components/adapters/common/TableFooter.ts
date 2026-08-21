/**
 * TableFooter — common types
 *
 * Single source of truth for the TableFooter prop vocabulary, shared by the dispatcher
 * (`adapters/TableFooter.tsx`) and every per-library wrapper (`adapters/{mantine,material,carbon}/TableFooter`).
 */

import type { ComponentLayer, LibrarySpecificProps } from '../../registry/types'

/** Public prop interface. What consumer/demo code uses — identical across every UI kit. */
export type TableFooterProps = {
  children?: React.ReactNode
  variant?: string
  layer?: ComponentLayer
  elevation?: string
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
} & LibrarySpecificProps
